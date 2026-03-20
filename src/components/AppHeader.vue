<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { storeToRefs } from 'pinia'

const store = useDashboardStore()
const { loading, lastSync, error, summary } = storeToRefs(store)

const now = ref(new Date())
let timer: number
onMounted(() => { timer = setInterval(() => now.value = new Date(), 1000) })
onUnmounted(() => clearInterval(timer))

function formatTime(d: Date) {
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}
function formatDate(d: Date) {
  return d.toLocaleDateString('th-TH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}
function formatSync(d: Date | null) {
  if (!d) return 'ยังไม่ได้ sync'
  return `sync ล่าสุด ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`
}
</script>

<template>
  <header class="sticky top-0 z-40" style="background: rgba(5,11,15,0.92); backdrop-filter: blur(16px); border-bottom: 1px solid var(--color-border);">
    <div class="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-6">

      <!-- Logo -->
      <div class="flex items-center gap-3 shrink-0">
        <div class="relative w-8 h-8">
          <div class="absolute inset-0 rounded-lg" style="background: linear-gradient(135deg, var(--color-signal), var(--color-signal2)); opacity: 0.2;"></div>
          <div class="absolute inset-0 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-signal)" stroke-width="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
        </div>
        <div>
          <div class="text-sm font-semibold leading-tight" style="color: var(--color-signal);">PTC Monitor</div>
          <div class="text-xs leading-tight" style="color: var(--color-dim);">รพ.สระโบสถ์</div>
        </div>
      </div>

      <!-- Center title -->
      <div class="flex-1 text-center hidden md:block">
        <span class="text-sm font-medium" style="color: #7a9aaa;">ระบบติดตามแผนพัฒนาคุณภาพยา · ปีงบ 2568 · HA II-6</span>
      </div>

      <!-- Right: status + clock -->
      <div class="flex items-center gap-4 shrink-0">

        <!-- Overall progress pill -->
        <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full" style="background: rgba(0,212,170,0.08); border: 1px solid rgba(0,212,170,0.2);">
          <span class="text-xs" style="color: var(--color-dim);">ภาพรวม</span>
          <span class="num font-bold text-sm" style="color: var(--color-signal);">{{ summary.overallPct }}%</span>
        </div>

        <!-- Sync button -->
        <button
          class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
          :style="loading ? 'color: var(--color-signal); background: rgba(0,212,170,0.08);' : 'color: var(--color-dim); background: rgba(255,255,255,0.04);'"
          :disabled="loading"
          @click="store.syncFromSheet()"
        >
          <svg class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
          </svg>
          {{ formatSync(lastSync) }}
        </button>

        <!-- Error indicator -->
        <div v-if="error" class="w-2 h-2 rounded-full glow-danger" style="background: var(--color-danger); animation: ping 1s ease-out infinite;"></div>

        <!-- Clock -->
        <div class="text-right hidden sm:block">
          <div class="num text-sm font-medium" style="color: #c8dde8;">{{ formatTime(now) }}</div>
          <div class="text-xs" style="color: var(--color-dim);">{{ formatDate(now) }}</div>
        </div>
      </div>
    </div>

    <!-- Progress bar header -->
    <div class="h-0.5 w-full" style="background: var(--color-border);">
      <div
        class="h-full transition-all duration-1000"
        :style="`width: ${summary.overallPct}%; background: linear-gradient(90deg, var(--color-signal), var(--color-signal2));`"
      ></div>
    </div>
  </header>
</template>
