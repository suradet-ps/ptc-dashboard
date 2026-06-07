<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

import { useAuth } from '@/composables/use-auth';
import { useNow } from '@/composables/use-now';
import { useDashboardStore } from '@/stores/dashboard';

const store = useDashboardStore();
const { loading, lastSync, error, summary } = storeToRefs(store);

const now = useNow();
const {
  profile,
  isAuthenticated,
  isEditorOrAbove,
  loading: authLoading,
  magicLinkSent,
  error: authError,
  signInWithMagicLink,
  signOut,
} = useAuth();

const showSignIn = ref(false);
const emailInput = ref('');

async function handleSignIn() {
  const email = emailInput.value.trim();
  if (!email) return;
  await signInWithMagicLink(email);
}

function handleSignOut() {
  void signOut();
}

const roleLabel = (role: string) => {
  if (role === 'admin') return 'ผู้ดูแล';
  if (role === 'editor') return 'ผู้แก้ไข';
  return 'ผู้อ่าน';
};

function formatTime(d: Date) {
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
function formatDate(d: Date) {
  return d.toLocaleDateString('th-TH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
function formatSync(d: Date | null) {
  if (!d) return 'ยังไม่ได้ซิงค์';
  return `ซิงค์ ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
}
</script>

<template>
  <header class="sticky top-0 z-40 bg-white backdrop-blur-md border-b border-[var(--color-border)] shadow-sm">
    <div class="max-w-screen-2xl mx-auto px-6 h-16 flex items-center gap-6">
      <!-- Brand -->
      <router-link to="/" class="flex flex-col shrink-0 hover:opacity-80 transition-opacity">
        <div class="font-black text-xl leading-none tracking-tight text-[var(--color-signal)]">
          PTC Monitor
        </div>
        <div class="text-[0.65rem] font-bold tracking-wide uppercase mt-1 text-[var(--color-dim)]">
          รพ.สระโบสถ์
        </div>
      </router-link>

      <!-- Navigation Links -->
      <nav class="flex items-center gap-2 ml-4" aria-label="เมนูหลัก">
        <router-link
          to="/"
          class="text-sm font-semibold transition-colors px-3 py-1.5 rounded-md text-[var(--color-dim)] hover:bg-[var(--color-surface)]"
          active-class="text-[var(--color-signal)] bg-[var(--color-void)] border border-[var(--color-border)] shadow-sm"
        >
          Dashboard
        </router-link>
        <router-link
          to="/smart-ptc"
          class="text-sm font-semibold transition-colors px-3 py-1.5 rounded-md text-[var(--color-dim)] hover:bg-[var(--color-surface)]"
          active-class="text-[var(--color-signal)] bg-[var(--color-void)] border border-[var(--color-border)] shadow-sm"
        >
          Smart PTC
        </router-link>
      </nav>

      <!-- Separator -->
      <div class="h-6 w-px bg-[var(--color-border)] hidden md:block ml-2" />

      <!-- Center flex spacer -->
      <div class="flex-1 min-w-0 hidden md:block" />

      <!-- Right section -->
      <div class="flex items-center gap-4 shrink-0">
        <!-- Overall progress pill -->
        <div class="hidden lg:flex items-center gap-2 px-3 py-1 bg-[var(--color-void)] border border-[var(--color-border)] rounded-full shadow-inner">
          <div class="w-2 h-2 rounded-full animate-pulse bg-[var(--color-pulse)]" />
          <span class="text-xs font-semibold text-[var(--color-muted)]">ภาพรวม</span>
          <span class="num font-bold text-sm text-[var(--color-signal)]">{{ summary.overallPct }}%</span>
        </div>

        <!-- Sync button -->
        <button
          class="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full transition-all border shadow-sm"
          :class="loading
            ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-dim)] cursor-wait'
            : 'bg-white border-[var(--color-border)] text-[var(--color-text-sub)] hover:bg-[var(--color-void)] hover:border-[var(--color-dim)]'"
          :disabled="loading"
          :aria-label="`ซิงค์ข้อมูลจากเซิร์ฟเวอร์, ${formatSync(lastSync)}`"
          @click="store.syncFromServer()"
        >
          <svg
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin text-[var(--color-pulse)]': loading }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21v-5h5" />
          </svg>
          <span class="hidden sm:inline">{{ formatSync(lastSync) }}</span>
        </button>

        <!-- Error indicator -->
        <div
          v-if="error"
          class="w-2.5 h-2.5 rounded-full animate-ping bg-[var(--color-danger)]"
          :title="error"
        />

        <!-- Auth: signed-in user OR sign-in form -->
        <div v-if="isAuthenticated && profile" class="flex items-center gap-2">
          <div class="hidden md:flex flex-col items-end leading-tight">
            <span class="text-xs font-semibold" style="color: var(--color-text)">
              {{ profile.displayName }}
            </span>
            <span
              class="text-[0.65rem] font-bold uppercase tracking-wide"
              :style="`color: ${
                isEditorOrAbove ? 'var(--color-signal)' : 'var(--color-muted)'
              };`"
            >
              {{ roleLabel(profile.role) }}
            </span>
          </div>
          <button
            type="button"
            class="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-dim)] hover:bg-[var(--color-surface)]"
            :disabled="authLoading"
            :aria-label="`ออกจากระบบ (${profile.email})`"
            @click="handleSignOut"
          >
            ออกจากระบบ
          </button>
        </div>

        <div v-else>
          <button
            v-if="!showSignIn"
            type="button"
            class="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-signal)] text-[var(--color-signal)] hover:bg-[var(--color-signal)] hover:text-white transition-colors"
            aria-label="เข้าสู่ระบบ"
            @click="showSignIn = true"
          >
            เข้าสู่ระบบ
          </button>
          <form
            v-else
            class="flex items-center gap-2"
            @submit.prevent="handleSignIn"
          >
            <label for="signin-email" class="sr-only">อีเมลสำหรับรับลิงก์เข้าสู่ระบบ</label>
            <input
              id="signin-email"
              v-model="emailInput"
              type="email"
              required
              class="text-xs px-2 py-1.5 rounded border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-signal)]"
              style="width: 200px"
              placeholder="email@hospital.go.th"
            >
            <button
              type="submit"
              class="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-signal)] bg-[var(--color-signal)] text-white hover:opacity-90 disabled:opacity-50"
              :disabled="authLoading"
            >
              {{ authLoading ? 'กำลังส่ง...' : 'ส่งลิงก์' }}
            </button>
            <button
              type="button"
              class="text-xs text-[var(--color-muted)] hover:text-[var(--color-dim)]"
              :disabled="authLoading"
              aria-label="ยกเลิกการเข้าสู่ระบบ"
              @click="showSignIn = false"
            >
              ✕
            </button>
          </form>
        </div>

        <!-- Sign-in feedback (toast-like inline messages) -->
        <div
          v-if="!isAuthenticated && (magicLinkSent || authError)"
          class="sr-only"
          role="status"
          aria-live="polite"
        >
          <span v-if="magicLinkSent">ส่งลิงก์เข้าสู่ระบบไปยังอีเมลแล้ว กรุณาตรวจสอบ inbox</span>
          <span v-else-if="authError">{{ authError }}</span>
        </div>

        <!-- Clock -->
          <div class="text-right hidden sm:block pl-3 border-l border-[var(--color-border)]">
            <div class="num text-sm font-bold leading-tight text-[var(--color-signal)]">
              {{ formatTime(new Date(now)) }}
            </div>
            <div class="text-[0.65rem] font-bold leading-tight text-[var(--color-muted)] uppercase mt-0.5">
              {{ formatDate(new Date(now)) }}
            </div>
          </div>
      </div>
    </div>

    <!-- Bottom progress bar -->
    <div class="h-[3px] w-full bg-[var(--color-surface)]">
      <div
        class="h-full bg-[var(--color-signal)]"
        style="transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"
        :style="`width: ${summary.overallPct}%;`"
      />
    </div>
  </header>
</template>
