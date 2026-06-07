<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import AppHeader from '@/components/AppHeader.vue';
import ConfigErrorScreen from '@/components/ConfigErrorScreen.vue';
import ToastHost from '@/components/ToastHost.vue';
import { useConfigStore } from '@/stores/config';

const route = useRoute();
const configStore = useConfigStore();
const isPrintView = computed(
  () => route.name === 'smart-ptc-meeting-print' || route.name === 'smart-ptc-agenda-print',
);
const isLoginView = computed(() => route.name === 'login');
const hasConfigError = computed(() => Boolean(configStore.loadError));
</script>

<template>
  <ConfigErrorScreen v-if="hasConfigError" />
  <div v-else-if="isPrintView || isLoginView">
    <!-- Clean layout for print views and login (own background) -->
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

    <!-- Skip to main content (visible on focus) -->
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg"
      style="background: var(--color-signal); color: var(--color-void); font-weight: 700"
    >
      ข้ามไปยังเนื้อหาหลัก
    </a>

    <!-- Content -->
    <div class="relative z-10">
      <AppHeader />
      <main id="main-content" tabindex="-1">
        <router-view />
      </main>
    </div>
  </div>
  <ToastHost />
</template>
