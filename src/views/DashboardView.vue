<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { storeToRefs } from 'pinia'
import { PLAN_DATA, STATUS_CONFIG } from '@/data/planData'
import type { ActionItem } from '@/types'
import SummaryCards from '@/components/SummaryCards.vue'
import GanttChart from '@/components/GanttChart.vue'
import ActionCard from '@/components/ActionCard.vue'
import ActionDetailPanel from '@/components/ActionDetailPanel.vue'

const store = useDashboardStore()
const { byRecommendation, blockedActions, delayedActions } = storeToRefs(store)

// Navigation
const activeTab = ref<'all' | 'rec1' | 'rec2' | 'rec3' | 'alerts'>('all')

// Detail panel
const selectedAction = ref<ActionItem | null>(null)
const selectedRecColor = ref('#00d4aa')

function selectAction(action: ActionItem) {
  const rec = PLAN_DATA.find(r => r.no === action.recNo)
  selectedRecColor.value = recColor(action.recNo)
  selectedAction.value = action
}

function recColor(no: number) {
  return ['#ff6b6b', '#10d98a', '#f5a623'][no - 1]
}

// Filtered views
const visibleRecs = computed(() => {
  if (activeTab.value === 'all') return byRecommendation.value
  const no = parseInt(activeTab.value.replace('rec',''))
  return byRecommendation.value.filter(r => r.no === no)
})

const alertsCount = computed(() => blockedActions.value.length + delayedActions.value.length)

onMounted(() => store.syncFromSheet())
</script>

<template>
  <div class="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-6">

    <!-- Summary cards -->
    <SummaryCards />

    <!-- Gantt chart -->
    <GanttChart />

    <!-- Tab navigation -->
    <div class="flex items-center gap-2 overflow-x-auto pb-1">
      <button class="tab-pill" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
        ทั้งหมด
      </button>
      <button
        v-for="rec in byRecommendation"
        :key="rec.no"
        class="tab-pill flex items-center gap-1.5"
        :class="{ active: activeTab === `rec${rec.no}` }"
        @click="activeTab = `rec${rec.no}` as any"
      >
        <span class="w-2 h-2 rounded-full shrink-0" :style="`background: ${recColor(rec.no)};`"></span>
        ข้อที่ {{ rec.no }}
        <span class="num text-xs opacity-60">{{ rec.pct }}%</span>
      </button>
      <button
        class="tab-pill flex items-center gap-1.5"
        :class="{ active: activeTab === 'alerts' }"
        @click="activeTab = 'alerts'"
      >
        <span v-if="alertsCount > 0" class="w-4 h-4 rounded-full flex items-center justify-center text-xs num font-bold" style="background: var(--color-danger); color: white;">{{ alertsCount }}</span>
        แจ้งเตือน
      </button>
    </div>

    <!-- Alert view -->
    <div v-if="activeTab === 'alerts'" class="space-y-4">
      <!-- Blocked -->
      <div v-if="blockedActions.length">
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2" style="color: var(--color-danger);">
          <span class="pulse-dot active" style="background: var(--color-danger);"></span>
          ติดขัด ({{ blockedActions.length }} รายการ)
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <ActionCard
            v-for="action in blockedActions"
            :key="action.id"
            :action="action"
            :rec-color="recColor(action.recNo)"
            @select="selectAction"
          />
        </div>
      </div>

      <!-- Delayed -->
      <div v-if="delayedActions.length">
        <h3 class="text-sm font-semibold mb-3 flex items-center gap-2" style="color: var(--color-warn);">
          <span class="pulse-dot active" style="background: var(--color-warn);"></span>
          ล่าช้า ({{ delayedActions.length }} รายการ)
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <ActionCard
            v-for="action in delayedActions"
            :key="action.id"
            :action="action"
            :rec-color="recColor(action.recNo)"
            @select="selectAction"
          />
        </div>
      </div>

      <!-- No alerts -->
      <div v-if="!alertsCount" class="card p-12 text-center">
        <div class="text-3xl mb-3">✓</div>
        <div class="text-sm font-medium" style="color: var(--color-ok);">ไม่มีรายการที่ติดขัดหรือล่าช้า</div>
        <div class="text-xs mt-1" style="color: var(--color-dim);">ระบบทำงานปกติ</div>
      </div>
    </div>

    <!-- Main action grid -->
    <div v-else class="space-y-8">
      <div v-for="rec in visibleRecs" :key="rec.no">

        <!-- Rec header -->
        <div class="flex items-start gap-3 mb-4">
          <div class="w-1 h-12 rounded-full shrink-0 mt-1" :style="`background: ${recColor(rec.no)};`"></div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold num px-2 py-1 rounded" :style="`background: ${recColor(rec.no)}15; color: ${recColor(rec.no)};`">
                ข้อเสนอแนะที่ {{ rec.no }}
              </span>
              <span class="num text-xs" :style="`color: ${recColor(rec.no)};`">{{ rec.pct }}%</span>
            </div>
            <p class="text-sm mt-1 leading-relaxed" style="color: #7a9aaa; max-width: 72ch;">{{ rec.title }}</p>
          </div>
        </div>

        <!-- Action cards grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <ActionCard
            v-for="action in rec.actions"
            :key="action.id"
            :action="action"
            :rec-color="recColor(rec.no)"
            @select="selectAction"
          />
        </div>
      </div>
    </div>

  </div>

  <!-- Overlay -->
  <Transition name="overlay">
    <div
      v-if="selectedAction"
      class="fixed inset-0 z-40"
      style="background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);"
      @click="selectedAction = null"
    ></div>
  </Transition>

  <!-- Detail panel -->
  <ActionDetailPanel
    :action="selectedAction"
    :rec-color="selectedRecColor"
    @close="selectedAction = null"
  />
</template>
