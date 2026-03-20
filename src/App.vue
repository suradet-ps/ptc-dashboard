<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import DashboardView from '@/views/DashboardView.vue'
</script>

<template>
  <div class="noise-bg min-h-screen">
    <!-- Background grid pattern -->
    <div class="fixed inset-0 pointer-events-none" style="
      background-image:
        linear-gradient(rgba(0,212,170,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,212,170,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      z-index: 0;
    "></div>

    <!-- Corner glow -->
    <div class="fixed top-0 right-0 w-96 h-96 pointer-events-none" style="
      background: radial-gradient(ellipse at top right, rgba(0,184,240,0.06) 0%, transparent 70%);
      z-index: 0;
    "></div>
    <div class="fixed bottom-0 left-0 w-96 h-96 pointer-events-none" style="
      background: radial-gradient(ellipse at bottom left, rgba(0,212,170,0.04) 0%, transparent 70%);
      z-index: 0;
    "></div>

    <!-- Content -->
    <div class="relative z-10">
      <AppHeader />
      <DashboardView />
    </div>
  </div>
</template>
