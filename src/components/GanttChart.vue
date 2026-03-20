<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { storeToRefs } from 'pinia'
import { FISCAL_MONTHS, STATUS_CONFIG } from '@/data/planData'

const { byRecommendation } = storeToRefs(useDashboardStore())

// Current fiscal month (Oct=1, ..., Sep=12)
const currentFiscalMonth = computed(() => {
  const m = new Date().getMonth() + 1 // 1-12
  return m >= 10 ? m - 9 : m + 3
})

function recColor(no: number) {
  return ['#ff6b6b', '#10d98a', '#f5a623'][no - 1]
}

function barLeft(start: number) {
  return `${((start - 1) / 12) * 100}%`
}
function barWidth(start: number, end: number) {
  return `${((end - start + 1) / 12) * 100}%`
}
function barOpacity(status: string) {
  if (status === 'completed') return 1
  if (status === 'in_progress') return 0.85
  if (status === 'not_started') return 0.35
  return 0.7
}
</script>

<template>
  <div class="card p-5">
    <div class="flex items-center justify-between mb-5">
      <h2 class="text-sm font-semibold" style="color: #c8dde8;">
        แผนเวลาดำเนินงาน (ปีงบประมาณ 2568)
      </h2>
      <span class="text-xs num px-2 py-1 rounded" style="background: rgba(0,212,170,0.08); color: var(--color-signal);">
        เดือน {{ FISCAL_MONTHS[currentFiscalMonth - 1] }}
      </span>
    </div>

    <!-- Month header -->
    <div class="relative mb-2">
      <div class="grid" style="grid-template-columns: 200px 1fr;">
        <div></div>
        <div class="relative">
          <div class="flex">
            <div
              v-for="(m, i) in FISCAL_MONTHS"
              :key="i"
              class="flex-1 text-center text-xs pb-2"
              :style="`color: ${i + 1 === currentFiscalMonth ? 'var(--color-signal)' : 'var(--color-dim)'}; font-weight: ${i + 1 === currentFiscalMonth ? '700' : '400'};`"
            >{{ m }}</div>
          </div>
          <!-- Current month line -->
          <div
            class="absolute top-0 bottom-0 w-px"
            :style="`left: ${((currentFiscalMonth - 0.5) / 12) * 100}%; background: var(--color-signal); opacity: 0.4;`"
          ></div>
        </div>
      </div>
    </div>

    <!-- Rows -->
    <div class="space-y-1">
      <template v-for="rec in byRecommendation" :key="rec.no">
        <!-- Rec header row -->
        <div class="grid" style="grid-template-columns: 200px 1fr;">
          <div class="flex items-center gap-2 pr-3 py-1">
            <div class="w-1.5 h-1.5 rounded-full shrink-0" :style="`background: ${recColor(rec.no)};`"></div>
            <span class="text-xs font-bold" :style="`color: ${recColor(rec.no)};`">ข้อที่ {{ rec.no }}</span>
          </div>
          <div class="relative h-1 rounded-full my-3" style="background: var(--color-border);">
            <div class="absolute inset-y-0 rounded-full" :style="`left: 0; width: ${rec.pct}%; background: ${recColor(rec.no)}; opacity: 0.3;`"></div>
          </div>
        </div>

        <!-- Action rows -->
        <div
          v-for="action in rec.actions"
          :key="action.id"
          class="grid group hover:bg-white/[0.02] rounded transition-colors"
          style="grid-template-columns: 200px 1fr;"
        >
          <div class="flex items-center gap-2 pr-3 py-1.5 min-w-0">
            <span class="text-xs num shrink-0" style="color: var(--color-dim);">{{ action.id }}</span>
            <span class="text-xs truncate" style="color: #7a9aaa;" :title="action.plan">{{ action.plan }}</span>
          </div>
          <div class="relative h-7 flex items-center">
            <!-- Track -->
            <div class="absolute inset-x-0 h-px" style="background: var(--color-border);"></div>
            <!-- Bar -->
            <div
              class="gantt-bar absolute"
              :style="`
                left: ${barLeft(action.startMonth)};
                width: ${barWidth(action.startMonth, action.endMonth)};
                background: ${recColor(rec.no)};
                opacity: ${barOpacity(action.status)};
                box-shadow: 0 0 6px ${recColor(rec.no)}40;
              `"
            >
              <!-- Progress fill -->
              <div
                class="absolute inset-y-0 left-0 rounded-l"
                :style="`width: ${action.progressPct}%; background: rgba(255,255,255,0.25);`"
              ></div>
              <!-- Status dot -->
              <div class="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                :style="`background: ${
                  action.status === 'blocked' ? 'var(--color-danger)' :
                  action.status === 'delayed' ? 'var(--color-warn)' :
                  'white'
                };`"
              ></div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Legend -->
    <div class="flex gap-4 mt-5 pt-4" style="border-top: 1px solid var(--color-border);">
      <div v-for="(cfg, key) in STATUS_CONFIG" :key="key" class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm" :style="`background: ${cfg.dot.replace('bg-','')};`"
          :class="cfg.dot"
        ></div>
        <span class="text-xs" style="color: var(--color-dim);">{{ cfg.label }}</span>
      </div>
    </div>
  </div>
</template>
