<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useAuth } from '@/composables/use-auth';
import { toMessage, useToasts } from '@/composables/use-toast';
import { supabase } from '@/services/supabase';
import type { UserRole } from '@/types';

type AdminUserRow = {
  user_id: string;
  email: string;
  display_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
};

const { isAdmin } = useAuth();
const { push: pushToast } = useToasts();

const users = ref<AdminUserRow[]>([]);
const loading = ref(false);
const saving = ref<string | null>(null);

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'viewer', label: 'ผู้อ่าน', description: 'ดูข้อมูลอย่างเดียว' },
  { value: 'editor', label: 'ผู้แก้ไข', description: 'แก้ไขข้อมูล runtime ได้' },
  { value: 'admin', label: 'ผู้ดูแล', description: 'เข้าถึงทุกอย่าง + จัดการผู้ใช้' },
];

async function loadUsers() {
  loading.value = true;
  try {
    const { data, error: loadErr } = await supabase
      .from('ptc_user')
      .select('user_id, email, display_name, role, is_active, created_at')
      .order('created_at', { ascending: true });
    if (loadErr) throw loadErr;
    users.value = (data ?? []) as AdminUserRow[];
  } catch (e) {
    pushToast({ type: 'error', message: `โหลดรายชื่อผู้ใช้ไม่สำเร็จ: ${toMessage(e)}` });
  } finally {
    loading.value = false;
  }
}

async function updateRole(userId: string, role: UserRole) {
  saving.value = userId;
  try {
    const { error: updateErr } = await supabase
      .from('ptc_user')
      .update({ role })
      .eq('user_id', userId);
    if (updateErr) throw updateErr;
    const target = users.value.find((u) => u.user_id === userId);
    if (target) target.role = role;
    pushToast({ type: 'success', message: `อัปเดตสิทธิ์เป็น "${roleLabel(role)}" แล้ว` });
  } catch (e) {
    pushToast({ type: 'error', message: toMessage(e) });
  } finally {
    saving.value = null;
  }
}

async function toggleActive(userId: string, isActive: boolean) {
  saving.value = userId;
  try {
    const { error: updateErr } = await supabase
      .from('ptc_user')
      .update({ is_active: isActive })
      .eq('user_id', userId);
    if (updateErr) throw updateErr;
    const target = users.value.find((u) => u.user_id === userId);
    if (target) target.is_active = isActive;
    pushToast({
      type: 'success',
      message: isActive ? 'เปิดใช้งานบัญชีแล้ว' : 'ระงับการใช้งานบัญชีแล้ว',
    });
  } catch (e) {
    pushToast({ type: 'error', message: toMessage(e) });
  } finally {
    saving.value = null;
  }
}

const roleLabel = (r: UserRole) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r;

function formatDate(s: string) {
  if (!s) return '—';
  return new Date(s).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

onMounted(loadUsers);

defineExpose({ isAdmin });
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-6 py-7 space-y-6">
    <header>
      <h1 class="text-2xl font-black" style="color: var(--color-text)">
        จัดการผู้ใช้
      </h1>
      <p class="text-sm mt-1" style="color: var(--color-muted)">
        เพิ่มผู้ใช้ใหม่ผ่าน
        <a
          href="https://supabase.com/dashboard/project/_/auth/users"
          target="_blank"
          rel="noopener"
          class="underline"
        >Supabase Dashboard → Authentication → Users</a>
        แล้วกำหนดสิทธิ์ที่นี่
      </p>
    </header>

    <div
      v-if="loading && users.length === 0"
      class="card p-12 text-center"
      style="color: var(--color-muted)"
    >
      กำลังโหลดรายชื่อผู้ใช้...
    </div>

    <div
      v-else-if="users.length === 0"
      class="card p-12 text-center"
      style="color: var(--color-muted)"
    >
      <p class="text-sm">ยังไม่มีผู้ใช้ในระบบ</p>
      <p class="text-xs mt-2">ไปที่ Supabase Authentication → Users → Add user เพื่อเริ่มต้น</p>
    </div>

    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr
            class="text-left text-xs font-bold uppercase tracking-wide"
            style="background: var(--color-void); color: var(--color-muted); border-bottom: 1px solid var(--color-border)"
          >
            <th class="px-4 py-3">ผู้ใช้</th>
            <th class="px-4 py-3">อีเมล</th>
            <th class="px-4 py-3">สิทธิ์</th>
            <th class="px-4 py-3">สถานะ</th>
            <th class="px-4 py-3">สร้างเมื่อ</th>
            <th class="px-4 py-3 text-right">การจัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in users"
            :key="u.user_id"
            style="border-top: 1px solid var(--color-border)"
            :class="{ 'opacity-60': !u.is_active }"
          >
            <td class="px-4 py-3">
              <div class="font-semibold" style="color: var(--color-text)">
                {{ u.display_name || u.email.split('@')[0] }}
              </div>
            </td>
            <td class="px-4 py-3 font-mono text-xs" style="color: var(--color-dim)">
              {{ u.email }}
            </td>
            <td class="px-4 py-3">
              <label :for="`role-${u.user_id}`" class="sr-only">
                สิทธิ์ของ {{ u.email }}
              </label>
              <select
                :id="`role-${u.user_id}`"
                :value="u.role"
                :disabled="saving === u.user_id"
                class="field text-sm"
                style="padding: 6px 28px 6px 10px; min-width: 130px"
                :aria-label="`เปลี่ยนสิทธิ์ของ ${u.email}`"
                @change="(e) => updateRole(u.user_id, (e.target as HTMLSelectElement).value as UserRole)"
              >
                <option v-for="o in ROLE_OPTIONS" :key="o.value" :value="o.value">
                  {{ o.label }} — {{ o.description }}
                </option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                :style="u.is_active
                  ? 'background: rgba(46,112,40,0.10); color: #2e7028; border: 1px solid rgba(46,112,40,0.28)'
                  : 'background: rgba(150,48,32,0.10); color: #963020; border: 1px solid rgba(150,48,32,0.28)'"
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :style="`background: ${u.is_active ? '#2e7028' : '#963020'}`"
                />
                {{ u.is_active ? 'ใช้งาน' : 'ระงับ' }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs" style="color: var(--color-muted)">
              {{ formatDate(u.created_at) }}
            </td>
            <td class="px-4 py-3 text-right">
              <button
                type="button"
                class="text-xs font-semibold px-3 py-1.5 rounded-full border"
                :style="u.is_active
                  ? 'border: 1px solid rgba(150,48,32,0.4); color: #963020; background: white'
                  : 'border: 1px solid rgba(46,112,40,0.4); color: #2e7028; background: white'"
                :disabled="saving === u.user_id"
                @click="toggleActive(u.user_id, !u.is_active)"
              >
                {{ u.is_active ? 'ระงับ' : 'เปิดใช้งาน' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
