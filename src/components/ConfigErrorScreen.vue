<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useConfigStore } from '@/stores/config';

const configStore = useConfigStore();
const { loadError, loading } = storeToRefs(configStore);

async function retry() {
  await configStore.load(true);
}
</script>

<template>
  <div
    v-if="loadError"
    class="min-h-screen flex flex-col items-center justify-center p-6"
    role="alert"
  >
    <div class="card max-w-md w-full p-8 text-center">
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        style="background: rgba(220, 53, 69, 0.1)"
        aria-hidden="true"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-danger)"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h1 class="text-lg font-bold mb-2" style="color: var(--color-danger)">
        ไม่สามารถโหลดข้อมูลเริ่มต้นได้
      </h1>
      <p class="text-sm mb-4" style="color: var(--color-dim)">
        การเชื่อมต่อฐานข้อมูลล้มเหลว กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
        และลองใหม่อีกครั้ง
      </p>
      <p
        v-if="loadError"
        class="text-xs font-mono mb-5 px-3 py-2 rounded text-left"
        style="background: var(--color-surface); color: var(--color-muted)"
      >
        {{ loadError }}
      </p>
      <button type="button" class="btn-primary w-full" :disabled="loading" @click="retry">
        {{ loading ? 'กำลังลองใหม่...' : 'ลองใหม่อีกครั้ง' }}
      </button>
    </div>
  </div>
</template>
