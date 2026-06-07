// src/composables/use-auth.ts
import type { Session, Subscription } from '@supabase/supabase-js';
import { computed, onScopeDispose, readonly, ref, shallowRef } from 'vue';

import { supabase } from '@/services/supabase';
import type { UserProfile, UserRole } from '@/types';

// ─────────────────────────────────────────────────────────────────
// Module-level singleton state.
// All components calling useAuth() share the same user/profile
// state and the same auth subscription. This is intentional —
// auth state is global and reactive, like a Pinia store, but
// scoped tightly to auth concerns (no business state).
// ─────────────────────────────────────────────────────────────────
const session = shallowRef<Session | null>(null);
const profile = ref<UserProfile | null>(null);
const loading = ref(false);
const magicLinkSent = ref(false);
const error = ref<string | null>(null);

let initialized = false;
let subscription: Subscription | null = null;
let refCount = 0;

async function loadProfile(userId: string, email: string) {
  const { data, error: profileErr } = await supabase
    .from('ptc_profiles')
    .select('user_id, email, display_name, role')
    .eq('user_id', userId)
    .maybeSingle();

  if (profileErr) {
    error.value = `ไม่สามารถโหลดข้อมูลโปรไฟล์ได้: ${profileErr.message}`;
    profile.value = null;
    return;
  }

  if (!data) {
    // Profile is normally created by the auth.users trigger.
    // If it's missing (e.g. trigger wasn't installed), fall back
    // to a safe editor-role stub so the UI stays functional.
    profile.value = {
      userId,
      email,
      displayName: email.split('@')[0] ?? email,
      role: 'editor',
    };
    return;
  }

  profile.value = {
    userId: data.user_id,
    email: data.email,
    displayName: data.display_name || data.email.split('@')[0] || data.email,
    role: (data.role as UserRole) ?? 'editor',
  };
}

function clearProfile() {
  profile.value = null;
  magicLinkSent.value = false;
  error.value = null;
}

function init() {
  if (initialized) return;
  initialized = true;

  // 1) Bootstrap from any existing session (persisted in localStorage).
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session;
    if (data.session?.user) {
      void loadProfile(data.session.user.id, data.session.user.email ?? '');
    }
  });

  // 2) Subscribe to subsequent changes.
  const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession;
    if (newSession?.user) {
      void loadProfile(newSession.user.id, newSession.user.email ?? '');
    } else {
      clearProfile();
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

  const user = computed(() => session.value?.user ?? null);
  const isAuthenticated = computed(() => session.value !== null);
  const isEditorOrAbove = computed(() => {
    const r = profile.value?.role;
    return r === 'editor' || r === 'admin';
  });
  const isAdmin = computed(() => profile.value?.role === 'admin');

  async function signInWithMagicLink(email: string) {
    error.value = null;
    magicLinkSent.value = false;
    loading.value = true;
    try {
      const { error: signInErr } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (signInErr) throw signInErr;
      magicLinkSent.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'ไม่สามารถส่งลิงก์เข้าสู่ระบบได้';
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
      .from('ptc_profiles')
      .update({ display_name: name })
      .eq('user_id', user.value.id);
    if (updateErr) {
      error.value = `ไม่สามารถอัปเดตชื่อที่แสดงได้: ${updateErr.message}`;
      return;
    }
    if (profile.value) {
      profile.value = { ...profile.value, displayName: name };
    }
  }

  return {
    session: readonly(session),
    user,
    profile: readonly(profile),
    isAuthenticated,
    isEditorOrAbove,
    isAdmin,
    loading: readonly(loading),
    magicLinkSent: readonly(magicLinkSent),
    error: readonly(error),
    signInWithMagicLink,
    signOut,
    updateDisplayName,
  };
}
