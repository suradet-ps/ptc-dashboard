<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { storeToRefs } from 'pinia'
import { useCountUp } from '@/composables/useCountUp'
import SparklineChart from './SparklineChart.vue'

const { summary, byRecommendation } = storeToRefs(useDashboardStore())

// Animated counters
const animCompleted  = useCountUp(() => summary.value.completed)
const animInProgress = useCountUp(() => summary.value.inProgress)
const animDelayed    = useCountUp(() => summary.value.delayed)
const animBlocked    = useCountUp(() => summary.value.blocked)
const animOverall    = useCountUp(() => summary.value.overallPct)

const cards = computed(() => [
  {
    label: 'เสร็จสิ้น', value: animCompleted,
    raw: summary.value.completed, total: summary.value.totalActions,
    color: 'var(--color-ok)', icon: '✓',
    spark: [0, 0, 0, Math.round(summary.value.completed / summary.value.totalActions * 40),
            Math.round(summary.value.completed / summary.value.totalActions * 70),
            Math.round(summary.value.completed / summary.value.totalActions * 100)]
  },
  {
    label: 'กำลังดำเนินการ', value: animInProgress,
    raw: summary.value.inProgress, total: summary.value.totalActions,
    color: 'var(--color-signal)', icon: '▶',
    spark: [0, 10, 25, 40, Math.round(summary.value.inProgress / summary.value.totalActions * 80),
            Math.round(summary.value.inProgress / summary.value.totalActions * 100)]
  },
  {
    label: 'ล่าช้า', value: animDelayed,
    raw: summary.value.delayed, total: summary.value.totalActions,
    color: 'var(--color-warn)', icon: '⚠',
    spark: [0, 0, 5, Math.round(summary.value.delayed / summary.value.totalActions * 60),
            Math.round(summary.value.delayed / summary.value.totalActions * 80),
            Math.round(summary.value.delayed / summary.value.totalActions * 100)]
  },
  {
    label: 'ติดขัด', value: animBlocked,
    raw: summary.value.blocked, total: summary.value.totalActions,
    color: 'var(--color-danger)', icon: '✕',
    spark: [0, 0, 0, Math.round(summary.value.blocked / summary.value.totalActions * 40),
            Math.round(summary.value.blocked / summary.value.totalActions * 70),
            Math.round(summary.value.blocked / summary.value.totalActions * 100)]
  },
])

function recColor(no: number) {
  return ['var(--color-rec1)', 'var(--color-rec2)', 'var(--color-rec3)'][no - 1]
}
</script>

<template>
  <div class="space-y-4">

    <!-- Overall progress hero card -->
    <div class="card p-5 relative overflow-hidden"
      style="background: linear-gradient(135deg, #0d1f2d 0%, #091218 100%);">
      <div class="ekg-line"></div>
      <div class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="text-xs font-medium mb-1" style="color: var(--color-dim);">
            ความคืบหน้าโดยรวม · HA II-6 · ปีงบ 2568
          </div>
          <div class="flex items-end gap-3 flex-wrap">
            <span class="num font-bold text-glow-signal"
              style="font-size: clamp(36px, 6vw, 52px); line-height: 1; color: var(--color-signal);">
              {{ animOverall }}
            </span>
            <span class="text-2xl mb-1" style="color: var(--color-signal);">%</span>
            <span class="mb-1 text-sm" style="color: var(--color-dim);">
              {{ summary.completed }} / {{ summary.totalActions }} แผน
            </span>
          </div>
        </div>

        <!-- Circular arc progress -->
        <div class="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 96 96" class="w-full h-full -rotate-90">
            <circle cx="48" cy="48" r="40" fill="none"
              stroke="var(--color-border)" stroke-width="7"/>
            <circle cx="48" cy="48" r="40" fill="none"
              stroke="var(--color-signal)" stroke-width="7"
              stroke-linecap="round"
              :stroke-dasharray="`${summary.overallPct * 2.513} 251.3`"
              style="transition: stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1);"/>
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="num text-xs font-bold" style="color: var(--color-signal);">
              {{ summary.overallPct }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="progress-track mt-4">
        <div class="progress-fill"
          :style="`width: ${summary.overallPct}%;
            background: linear-gradient(90deg, var(--color-signal), var(--color-signal2));`">
        </div>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="card in cards" :key="card.label" class="card p-4 group">
        <div class="flex items-start justify-between mb-2">
          <span class="text-xs" style="color: var(--color-dim);">{{ card.label }}</span>
          <SparklineChart
            :values="card.spark"
            :color="card.color"
            :width="52"
            :height="20"
          />
        </div>
        <div class="flex items-end gap-1.5 mb-3">
          <span class="num font-bold text-3xl" :style="`color: ${card.color};`">
            {{ card.value }}
          </span>
          <span class="num text-sm mb-1" style="color: var(--color-muted);">
            / {{ card.total }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="progress-track flex-1">
            <div class="progress-fill"
              :style="`width: ${card.total ? Math.round(card.raw / card.total * 100) : 0}%;
                background: ${card.color};`">
            </div>
          </div>
          <span class="num text-xs font-bold shrink-0" :style="`color: ${card.color};`">
            {{ card.total ? Math.round(card.raw / card.total * 100) : 0 }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Per-recommendation progress -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div v-for="rec in byRecommendation" :key="rec.no" class="card p-4">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-1 h-12 rounded-full shrink-0 mt-0.5"
            :style="`background: ${recColor(rec.no)};`">
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-0.5">
              <span class="text-xs font-bold" :style="`color: ${recColor(rec.no)};`">
                ข้อที่ {{ rec.no }}
              </span>
              <span class="num text-lg font-bold" :style="`color: ${recColor(rec.no)};`">
                {{ rec.pct }}%
              </span>
            </div>
            <p class="text-xs leading-snug" style="color: var(--color-dim);">
              {{ rec.shortTitle }}
            </p>
          </div>
        </div>

        <!-- Action pips -->
        <div class="flex gap-1.5 mb-3">
          <div v-for="action in rec.actions" :key="action.id"
            class="tooltip flex-1">
            <div class="h-2 rounded-sm transition-all"
              :style="`background: ${
                action.status === 'completed'   ? 'var(--color-ok)'     :
                action.status === 'in_progress' ? recColor(rec.no)      :
                action.status === 'delayed'     ? 'var(--color-warn)'   :
                action.status === 'blocked'     ? 'var(--color-danger)' :
                'var(--color-muted)'
              }; opacity: ${action.status === 'not_started' ? 0.3 : 1};`">
            </div>
            <span class="tip">
              {{ action.id }} · {{ action.progressPct }}% · {{ action.plan.slice(0, 28) }}…
            </span>
          </div>
        </div>

        <div class="progress-track">
          <div class="progress-fill"
            :style="`width: ${rec.pct}%; background: ${recColor(rec.no)};`">
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
