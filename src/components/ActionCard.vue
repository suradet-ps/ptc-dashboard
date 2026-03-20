<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ActionItem, ActionStatus } from '@/types'
import { STATUS_CONFIG } from '@/data/planData'
import { useDashboardStore } from '@/stores/dashboard'

const props = defineProps<{ action: ActionItem; recColor: string }>()
const emit = defineEmits<{ (e: 'select', action: ActionItem): void }>()

const store = useDashboardStore()
const isSaving = computed(() => store.saving === props.action.id)

const statusOptions: ActionStatus[] = ['not_started','in_progress','completed','delayed','blocked']

function cfg(s: ActionStatus) { return STATUS_CONFIG[s] }

function onStatusChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value as ActionStatus
  store.saveAction(props.action.id, { status: val })
}

function onProgressChange(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  store.saveAction(props.action.id, { progressPct: val })
}

const timeAgo = computed(() => {
  if (!props.action.lastUpdated) return null
  const diff = Date.now() - new Date(props.action.lastUpdated).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d} วันที่แล้ว`
  if (h > 0) return `${h} ชม.ที่แล้ว`
  return 'เมื่อกี้'
})
</script>

<template>
  <div
    class="card p-4 cursor-pointer group transition-all"
    :class="{ 'glow-danger': action.status === 'blocked', 'glow-warn': action.status === 'delayed' }"
    :style="action.status === 'blocked' ? 'border-color: rgba(255,77,109,0.4);' : action.status === 'delayed' ? 'border-color: rgba(245,166,35,0.3);' : ''"
    @click="emit('select', action)"
  >
    <div class="ekg-line" v-if="action.status === 'in_progress'"></div>

    <!-- Top row -->
    <div class="flex items-start gap-2 mb-3">
      <!-- ID badge -->
      <div class="shrink-0 px-2 py-0.5 rounded text-xs num font-bold" :style="`background: ${recColor}18; color: ${recColor};`">
        {{ action.id }}
      </div>
      <!-- Title -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium leading-snug" style="color: #c8dde8;">{{ action.plan }}</p>
      </div>
      <!-- Saving indicator -->
      <div v-if="isSaving" class="w-4 h-4 shrink-0">
        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--color-signal)" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
      </div>
    </div>

    <!-- Status + progress controls -->
    <div class="flex items-center gap-2 mb-3" @click.stop>
      <!-- Status select -->
      <select
        :value="action.status"
        class="field py-1.5 text-xs flex-1"
        style="font-size: 12px;"
        @change="onStatusChange"
      >
        <option v-for="s in statusOptions" :key="s" :value="s">{{ cfg(s).label }}</option>
      </select>

      <!-- Status dot -->
      <div class="pulse-dot shrink-0" :class="[cfg(action.status).dot, action.status === 'in_progress' ? 'active' : '']"></div>
    </div>

    <!-- Progress slider -->
    <div class="mb-3" @click.stop>
      <div class="flex justify-between text-xs mb-1" style="color: var(--color-dim);">
        <span>ความคืบหน้า</span>
        <span class="num font-bold" :style="`color: ${recColor};`">{{ action.progressPct }}%</span>
      </div>
      <input
        type="range" min="0" max="100" step="5"
        :value="action.progressPct"
        class="w-full h-1 rounded appearance-none cursor-pointer"
        :style="`accent-color: ${recColor};`"
        @change="onProgressChange"
      />
    </div>

    <!-- KPI chips -->
    <div class="flex flex-wrap gap-1 mb-3">
      <span
        v-for="kpi in action.kpis"
        :key="kpi"
        class="text-xs px-2 py-0.5 rounded-full"
        style="background: rgba(255,255,255,0.04); color: var(--color-dim); border: 1px solid var(--color-border);"
      >{{ kpi }}</span>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between pt-2" style="border-top: 1px solid var(--color-border);">
      <div class="flex items-center gap-1.5 text-xs" style="color: var(--color-dim);">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        {{ action.timeline }}
      </div>
      <div v-if="timeAgo" class="text-xs" style="color: var(--color-muted);">{{ timeAgo }}</div>
    </div>

    <!-- Blocker alert -->
    <div v-if="action.blockers" class="mt-2 p-2 rounded text-xs" style="background: rgba(255,77,109,0.08); border: 1px solid rgba(255,77,109,0.2); color: #ff9aaa;">
      ⚠ {{ action.blockers }}
    </div>
  </div>
</template>
