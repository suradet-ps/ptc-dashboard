<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useNow } from '@/composables/use-now';
import { useConfigStore } from '@/stores/config';
import { useDashboardStore } from '@/stores/dashboard';
import {
  ACTION_STATUSES,
  type ActionItem,
  type ActionStatus,
  STATUS_DOT_COLORS,
  STATUS_STYLES,
} from '@/types';

const props = defineProps<{ action: ActionItem; recColor: string }>();
const emit = defineEmits<{ select: [action: ActionItem] }>();

const store = useDashboardStore();
const configStore = useConfigStore();
const { statusCatalog } = storeToRefs(configStore);
const isSaving = computed(() => store.saving === props.action.id);

const statusOptions = ACTION_STATUSES;

function cfg(s: ActionStatus) {
  return statusCatalog.value[s];
}

function onStatusChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value as ActionStatus;
  store.saveAction(props.action.id, { status: val });
}

function onCardKeydown(e: KeyboardEvent) {
  // Don't hijack form-element keys
  if (e.target instanceof HTMLElement && e.target.closest('select, input, textarea, button')) {
    return;
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    emit('select', props.action);
  }
}

const now = useNow();

const timeAgo = computed(() => {
  if (!props.action.lastUpdated) return null;
  const diff = now.value - new Date(props.action.lastUpdated).getTime();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d} วันที่แล้ว`;
  if (h > 0) return `${h} ชม.ที่แล้ว`;
  return 'เมื่อกี้';
});

const statusColors = STATUS_STYLES;
const statusDotColor = STATUS_DOT_COLORS;
</script>

<template>
  <div
    class="card cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-signal)]"
    :class="{
      'glow-danger': action.status === 'blocked',
      'glow-warn': action.status === 'delayed',
    }"
    style="border-top-width: 3px"
    :style="`border-top: 3px solid ${recColor}; border-top-left-radius: 14px; border-top-right-radius: 14px;`"
    role="button"
    tabindex="0"
    :aria-label="`เปิดรายละเอียดแผน ${action.id}: ${action.plan}, สถานะ ${cfg(action.status).label}, ความคืบหน้า ${action.progressPct} เปอร์เซ็นต์`"
    @click="emit('select', action)"
    @keydown="onCardKeydown"
  >
    <div class="p-4">
      <!-- Top row: ID + title + spinner -->
      <div class="flex items-start gap-2.5 mb-3">
        <div
          class="shrink-0 num font-bold text-xs px-2 py-1 rounded-md leading-tight mt-0.5"
          :style="`background: ${recColor}18; color: ${recColor};`"
        >
          {{ action.id }}
        </div>
        <p
          class="flex-1 text-sm font-medium leading-snug"
          style="color: var(--color-text)"
        >
          {{ action.plan }}
        </p>
        <div v-if="isSaving" class="shrink-0 w-4 h-4 mt-0.5">
          <svg
            class="animate-spin w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            :stroke="recColor"
            stroke-width="2.5"
          >
            <circle cx="12" cy="12" r="10" stroke-opacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
      </div>

      <!-- Status row -->
      <div class="flex items-center gap-2 mb-3" @click.stop>
        <!-- Status badge (read display) -->
        <div
          class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0"
          :style="`
            background: ${statusColors[action.status].bg};
            color: ${statusColors[action.status].text};
            border: 1px solid ${statusColors[action.status].border};
          `"
        >
          <div
            class="pulse-dot"
            :class="{ active: action.status === 'in_progress' }"
            :style="`
              background: ${statusDotColor[action.status]};
              color: ${statusDotColor[action.status]};
              width: 7px; height: 7px;
            `"
          />
          {{ cfg(action.status).label }}
        </div>

        <!-- Status quick-change select -->
        <label class="sr-only" :for="`card-status-${action.id}`">
          เปลี่ยนสถานะของ {{ action.id }}
        </label>
        <select
          :id="`card-status-${action.id}`"
          :value="action.status"
          class="field flex-1 text-sm"
          style="padding: 6px 30px 6px 10px; font-size: 13px"
          :aria-label="`เปลี่ยนสถานะของแผน ${action.id}`"
          @change="onStatusChange"
        >
          <option v-for="s in statusOptions" :key="s" :value="s">
            {{ cfg(s).label }}
          </option>
        </select>
      </div>

      <!-- Progress -->
      <div class="mb-3" @click.stop>
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium" style="color: var(--color-dim)">ความคืบหน้า</span>
          <span
            class="num font-bold text-base leading-none"
            :style="`color: ${recColor};`"
          >
            {{ action.progressPct }}%
          </span>
        </div>

        <!-- Stacked bar (View Only) -->
        <div class="relative" style="height: 22px">
          <!-- Visual track + fill -->
          <div
            class="absolute left-0 right-0 rounded-full overflow-hidden"
            style="
              top: 50%;
              transform: translateY(-50%);
              height: 10px;
              background: var(--color-border);
            "
          >
            <div
              class="h-full rounded-full"
              :style="`
                width: ${action.progressPct}%;
                background: linear-gradient(90deg, ${recColor}cc, ${recColor});
                transition: width 0.45s ease;
              `"
            />
          </div>
        </div>
      </div>

      <!-- KPI chips -->
      <div v-if="action.kpis.length" class="flex flex-wrap gap-1.5 mb-3">
        <span
          v-for="kpi in action.kpis.slice(0, 2)"
          :key="kpi"
          class="text-xs px-2.5 py-1 rounded-full truncate max-w-40"
          style="
            background: var(--color-surface);
            color: var(--color-dim);
            border: 1px solid var(--color-border);
          "
        >{{ kpi }}</span>
        <span
          v-if="action.kpis.length > 2"
          class="text-xs px-2 py-1 rounded-full"
          style="
            background: var(--color-surface);
            color: var(--color-muted);
            border: 1px solid var(--color-border);
          "
        >+{{ action.kpis.length - 2 }}</span>
      </div>

      <!-- Blocker alert -->
      <div
        v-if="action.blockers"
        class="blocker-box flex items-start gap-2 mb-3"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="shrink-0 mt-0.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
        <span class="text-xs leading-snug">{{ action.blockers }}</span>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between pt-2.5"
        style="border-top: 1px solid var(--color-border)"
      >
        <div
          class="flex items-center gap-1.5 text-sm"
          style="color: var(--color-dim)"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {{ action.timeline }}
        </div>
        <div v-if="timeAgo" class="text-xs" style="color: var(--color-muted)">
          {{ timeAgo }}
        </div>
      </div>
    </div>
  </div>
</template>
