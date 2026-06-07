// src/composables/use-auth.ts
import type { Session, Subscription } from '@supabase/supabase-js';
import { computed, onScopeDispose, readonly, ref, shallowRef } from 'vue';

import { supabase } from '@/services/supabase';
import type { UserRecord, UserRole } from '@/types';

// ─────────────────────────────────────────────────────────────────
// Module-level singleton state.
// All components calling useAuth() share the same user/profile
// state and the same auth subscription. This is intentional —
// auth state is global and reactive, like a Pinia store, but
// scoped tightly to auth concerns (no business state).
// ─────────────────────────────────────────────────────────────────
const session = shallowRef<Session | null>(null);
const user = ref<UserRecord | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

let initialized = false;
let subscription: Subscription | null = null;
let refCount = 0;

async function loadUser(userId: string) {
  const { data, error: loadErr } = await supabase
    .from('ptc_user')
    .select('user_id, email, display_name, role, is_active')
    .eq('user_id', userId)
    .maybeSingle();

  if (loadErr) {
    error.value = `ไม่สามารถโหลดข้อมูลผู้ใช้ได้: ${loadErr.message}`;
    user.value = null;
    return;
  }

  if (!data) {
    // ptc_user row normally created by the auth.users trigger
    // (handle_new_user). If it's missing — e.g. the trigger wasn't
    // installed or the user was deleted manually — keep them signed
    // in but mark as viewer. Admins can fix the missing row.
    const sess = session.value;
    user.value = {
      userId,
      email: sess?.user.email ?? '',
      displayName: sess?.user.email?.split('@')[0] ?? '',
      role: 'viewer',
      isActive: true,
    };
    return;
  }

  if (!data.is_active) {
    // Soft-deleted users cannot stay signed in.
    error.value = 'บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ';
    await supabase.auth.signOut();
    user.value = null;
    return;
  }

  user.value = {
    userId: data.user_id,
    email: data.email,
    displayName: data.display_name || data.email.split('@')[0] || data.email,
    role: (data.role as UserRole) ?? 'viewer',
    isActive: data.is_active,
  };
}

function clearUser() {
  user.value = null;
  error.value = null;
}

function init() {
  if (initialized) return;
  initialized = true;

  // 1) Bootstrap from any existing session (persisted in localStorage).
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session;
    if (data.session?.user) {
      void loadUser(data.session.user.id);
    }
  });

  // 2) Subscribe to subsequent changes.
  const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession;
    if (newSession?.user) {
      void loadUser(newSession.user.id);
    } else {
      clearUser();
    }
  });
  subscription = data.subscription;
}

function teardown() {
  if (refCount > 0) return;
  subscription?.unsubscribe();
  subscription = null;
  initialized = false;
}

export function useAuth() {
  refCount++;
  init();

  onScopeDispose(() => {
    refCount--;
    if (refCount <= 0) teardown();
  });

  const authUser = computed(() => session.value?.user ?? null);
  const isAuthenticated = computed(() => session.value !== null && user.value !== null);
  const isEditorOrAbove = computed(() => {
    const r = user.value?.role;
    return r === 'editor' || r === 'admin';
  });
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function signInWithPassword(email: string, password: string) {
    error.value = null;
    loading.value = true;
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) throw signInErr;
      session.value = data.session;
      if (data.user) await loadUser(data.user.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ไม่สามารถเข้าสู่ระบบได้';
      // Translate the most common Supabase auth errors to Thai.
      if (/invalid login credentials/i.test(msg)) {
        error.value = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      } else if (/email not confirmed/i.test(msg)) {
        error.value = 'กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ (ตรวจสอบ inbox)';
      } else {
        error.value = msg;
      }
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    loading.value = true;
    try {
      await supabase.auth.signOut();
    } finally {
      loading.value = false;
    }
  }

  async function updateDisplayName(name: string) {
    if (!user.value) return;
    const { error: updateErr } = await supabase
      .from('ptc_user')
      .update({ display_name: name })
      .eq('user_id', user.value.userId);
    if (updateErr) {
      error.value = `ไม่สามารถอัปเดตชื่อที่แสดงได้: ${updateErr.message}`;
      return;
    }
    if (user.value) {
      user.value = { ...user.value, displayName: name };
    }
  }

  return {
    session: readonly(session),
    authUser,
    user: readonly(user),
    isAuthenticated,
    isEditorOrAbove,
    isAdmin,
    loading: readonly(loading),
    error: readonly(error),
    signInWithPassword,
    signOut,
    updateDisplayName,
  };
}
