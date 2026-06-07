<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import AppHeader from '@/components/AppHeader.vue';
import { useConfigStore } from '@/stores/config';
import { useDashboardStore } from '@/stores/dashboard';

const route = useRoute();
const isPrintView = computed(() => route.name === 'smart-ptc-meeting-print');

const configStore = useConfigStore();
const dashboardStore = useDashboardStore();
const { error: configError } = storeToRefs(configStore);
const { error: dashboardError, loading: dashboardLoading, lastSync } = storeToRefs(dashboardStore);

const hasError = computed(() => Boolean(configError.value || dashboardError.value));
const errorMessage = computed(() => configError.value || dashboardError.value);

function dismissError() {
  configStore.error = null;
  dashboardStore.error = null;
}

function retrySync() {
  void dashboardStore.syncFromServer();
}
</script>

<template>
  <div v-if="isPrintView">
    <!-- Clean layout for print views -->
    <router-view />
  </div>
  <div v-else class="noise-bg min-h-screen" style="background: var(--color-void)">
    <!-- Subtle grid pattern -->
    <div
      class="fixed inset-0 pointer-events-none"
      style="
        background-image:
          linear-gradient(rgba(108, 194, 74, 0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(108, 194, 74, 0.02) 1px, transparent 1px);
        background-size: 44px 44px;
        z-index: 0;
      "
    />

    <!-- Top-right warm glow -->
    <div
      class="fixed top-0 right-0 w-150 h-150 pointer-events-none"
      style="
        background: radial-gradient(
          ellipse at top right,
          rgba(108, 194, 74, 0.04) 0%,
          transparent 68%
        );
        z-index: 0;
      "
    />

    <!-- Bottom-left olive glow -->
    <div
      class="fixed bottom-0 left-0 w-125 h-125 pointer-events-none"
      style="
        background: radial-gradient(
          ellipse at bottom left,
          rgba(108, 194, 74, 0.03) 0%,
          transparent 65%
        );
        z-index: 0;
      "
    />

    <!-- Center warmth -->
    <div
      class="fixed inset-0 pointer-events-none"
      style="
        background: radial-gradient(
          ellipse at 50% 30%,
          rgba(108, 194, 74, 0.02) 0%,
          transparent 60%
        );
        z-index: 0;
      "
    />

    <!-- Error banner -->
    <div
      v-if="hasError"
      class="sticky top-0 z-50 px-4 py-3 flex items-start gap-3"
      style="
        background: rgba(220, 53, 69, 0.12);
        border-bottom: 1px solid rgba(220, 53, 69, 0.35);
        color: #963020;
      "
    >
      <div class="shrink-0 mt-0.5 text-base font-bold">⚠</div>
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-sm">เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase</div>
        <div class="text-xs mt-0.5 break-words font-mono">{{ errorMessage }}</div>
      </div>
      <button
        v-if="dashboardError"
        class="text-xs px-3 py-1 rounded-md font-semibold shrink-0"
        style="background: rgba(220, 53, 69, 0.18); color: #963020"
        @click="retrySync"
      >
        ลองใหม่
      </button>
      <button
        class="text-xs px-2 py-1 rounded shrink-0"
        style="color: #963020"
        @click="dismissError"
      >
        ✕
      </button>
    </div>

    <!-- Content -->
    <div class="relative z-10">
      <AppHeader />
      <router-view />
    </div>
  </div>
</template>
