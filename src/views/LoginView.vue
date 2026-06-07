<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAuth } from '@/composables/use-auth';

const router = useRouter();
const { signInWithPassword, loading, error, isAuthenticated, isAdmin, isEditorOrAbove } = useAuth();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const formRef = useTemplateRef<HTMLFormElement>('form');

async function handleSubmit() {
  if (!email.value || !password.value) return;
  try {
    await signInWithPassword(email.value.trim(), password.value);
  } catch {
    // error is surfaced via the `error` ref
  }
}

// If already authenticated, push the user to the right landing page
// (so refreshing /login while signed in doesn't strand them here).
watch(
  isAuthenticated,
  (yes) => {
    if (!yes) return;
    if (isAdmin.value || isEditorOrAbove.value) {
      void router.replace('/');
    } else {
      // viewer (or no ptc_user row) — read-only dashboard
      void router.replace('/');
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="login-shell">
    <div
      class="login-card"
      role="main"
      aria-labelledby="login-title"
    >
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">PTC</div>
        <h1 id="login-title" class="brand-title">PTC Monitor</h1>
        <p class="brand-sub">รพ.สระโบสถ์</p>
      </div>

      <form
        ref="form"
        class="form"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <div>
          <label for="login-email" class="label">อีเมล</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="field"
            placeholder="email@hospital.go.th"
          >
        </div>

        <div>
          <label for="login-password" class="label">รหัสผ่าน</label>
          <div class="password-row">
            <input
              id="login-password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              class="field"
              placeholder="••••••••"
            >
            <button
              type="button"
              class="reveal"
              :aria-label="showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
              :aria-pressed="showPassword"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'ซ่อน' : 'แสดง' }}
            </button>
          </div>
        </div>

        <p
          v-if="error"
          class="error"
          role="alert"
          aria-live="assertive"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          class="submit"
          :disabled="loading || !email || !password"
        >
          <span v-if="loading" class="spinner" aria-hidden="true" />
          {{ loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}
        </button>
      </form>

      <p class="hint">
        หากยังไม่มีบัญชี กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชีให้
      </p>
    </div>
  </div>
</template>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(ellipse at 30% 20%, rgba(108, 194, 74, 0.12) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 90%, rgba(46, 112, 40, 0.10) 0%, transparent 60%),
    var(--color-void);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 36px 32px 28px;
  box-shadow: 0 24px 60px rgba(30, 41, 16, 0.18);
}

.brand {
  text-align: center;
  margin-bottom: 28px;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-signal), #4a8a2a);
  color: white;
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 1px;
  margin-bottom: 14px;
  box-shadow: 0 6px 20px rgba(74, 138, 42, 0.35);
}

.brand-title {
  font-size: 24px;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.3px;
  margin: 0;
}

.brand-sub {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 4px 0 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-sub);
  margin-bottom: 6px;
}

.field {
  width: 100%;
  padding: 12px 14px;
  font-size: 15px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: var(--color-surface);
  color: var(--color-text);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.field:focus {
  outline: none;
  border-color: var(--color-signal);
  box-shadow: 0 0 0 3px rgba(108, 194, 74, 0.18);
}

.password-row {
  position: relative;
}

.password-row .field {
  padding-right: 64px;
}

.reveal {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 6px;
  background: transparent;
  color: var(--color-dim);
  border: none;
  cursor: pointer;
}

.reveal:hover {
  color: var(--color-text);
  background: var(--color-border);
}

.reveal:focus-visible {
  outline: 2px solid var(--color-signal);
  outline-offset: 1px;
}

.error {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-danger);
  background: rgba(150, 48, 32, 0.08);
  border: 1px solid rgba(150, 48, 32, 0.25);
  border-radius: 8px;
  padding: 10px 12px;
  margin: 0;
}

.submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px 18px;
  font-size: 15px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, var(--color-signal), #4a8a2a);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(74, 138, 42, 0.28);
  transition:
    transform 0.05s,
    box-shadow 0.15s,
    opacity 0.15s;
}

.submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(74, 138, 42, 0.35);
}

.submit:active:not(:disabled) {
  transform: translateY(0);
}

.submit:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.submit:focus-visible {
  outline: 3px solid rgba(108, 194, 74, 0.45);
  outline-offset: 2px;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hint {
  text-align: center;
  font-size: 12px;
  color: var(--color-muted);
  margin: 20px 0 0;
  line-height: 1.5;
}
</style>
