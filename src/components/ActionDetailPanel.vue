<script setup lang="ts">
import { ref, watch } from "vue";
import type { ActionItem, ActionStatus } from "@/types";
import { STATUS_CONFIG } from "@/data/planData";
import { useDashboardStore } from "@/stores/dashboard";

const props = defineProps<{ action: ActionItem | null; recColor: string }>();
const emit = defineEmits<{ (e: "close"): void }>();
const store = useDashboardStore();

const localStatus = ref<ActionStatus>("not_started");
const localPct = ref(0);
const localActual = ref("");
const localNotes = ref("");
const localBlockers = ref("");

watch(
  () => props.action,
  (a) => {
    if (!a) return;
    localStatus.value = a.status;
    localPct.value = a.progressPct;
    localActual.value = a.actualValue;
    localNotes.value = a.notes;
    localBlockers.value = a.blockers;
  },
  { immediate: true },
);

async function save() {
  if (!props.action) return;
  await store.saveAction(props.action.id, {
    status: localStatus.value,
    progressPct: localPct.value,
    actualValue: localActual.value,
    notes: localNotes.value,
    blockers: localBlockers.value,
  });
  emit("close");
}

function cfg(s: ActionStatus) {
  return STATUS_CONFIG[s];
}
const statusOptions: ActionStatus[] = [
  "not_started",
  "in_progress",
  "completed",
  "delayed",
  "blocked",
];
</script>

<template>
  <Transition name="modal-slide">
    <div
      v-if="action"
      class="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
      style="
        width: min(480px, 100vw);
        background: var(--color-deep);
        border-left: 1px solid var(--color-border);
        box-shadow: -20px 0 60px rgba(0, 0, 0, 0.5);
      "
    >
      <!-- Header -->
      <div
        class="p-5 shrink-0"
        style="border-bottom: 1px solid var(--color-border)"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span
              class="num text-xs font-bold px-2 py-1 rounded"
              :style="`background: ${recColor}18; color: ${recColor};`"
              >{{ action.id }}</span
            >
            <span class="text-xs" style="color: var(--color-dim)">{{
              action.haRef
            }}</span>
          </div>
          <button class="btn-ghost py-1! px-2!" @click="emit('close')">
            ✕
          </button>
        </div>
        <h2 class="text-sm font-semibold leading-snug" style="color: #c8dde8">
          {{ action.plan }}
        </h2>
      </div>

      <!-- Scrollable body -->
      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        <!-- Sub-items -->
        <div>
          <div
            class="text-xs font-semibold mb-2"
            style="color: var(--color-dim)"
          >
            กิจกรรมย่อย
          </div>
          <ul class="space-y-1.5">
            <li
              v-for="sub in action.subItems"
              :key="sub"
              class="flex items-start gap-2 text-xs"
              style="color: #7a9aaa"
            >
              <span :style="`color: ${recColor};`" class="mt-0.5">–</span>
              {{ sub }}
            </li>
          </ul>
        </div>

        <!-- Timeline & owners -->
        <div class="grid grid-cols-2 gap-3">
          <div
            class="p-3 rounded-lg"
            style="
              background: var(--color-surface);
              border: 1px solid var(--color-border);
            "
          >
            <div class="text-xs mb-1" style="color: var(--color-dim)">
              ระยะเวลา
            </div>
            <div class="text-sm font-medium" style="color: #c8dde8">
              {{ action.timeline }}
            </div>
          </div>
          <div
            class="p-3 rounded-lg"
            style="
              background: var(--color-surface);
              border: 1px solid var(--color-border);
            "
          >
            <div class="text-xs mb-1" style="color: var(--color-dim)">
              รอบรายงาน
            </div>
            <div class="text-xs" style="color: #7a9aaa">
              {{ action.reportCycle }}
            </div>
          </div>
        </div>

        <!-- Owners -->
        <div>
          <div
            class="text-xs font-semibold mb-2"
            style="color: var(--color-dim)"
          >
            ผู้รับผิดชอบ
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="owner in action.owners"
              :key="owner"
              class="text-xs px-2.5 py-1 rounded-full"
              :style="`background: ${recColor}10; color: ${recColor}; border: 1px solid ${recColor}30;`"
              >{{ owner }}</span
            >
          </div>
        </div>

        <!-- KPIs -->
        <div>
          <div
            class="text-xs font-semibold mb-2"
            style="color: var(--color-dim)"
          >
            ตัวชี้วัด (KPI)
          </div>
          <ul class="space-y-1">
            <li
              v-for="kpi in action.kpis"
              :key="kpi"
              class="text-xs flex items-start gap-2"
              style="color: #7a9aaa"
            >
              <span :style="`color: ${recColor};`">◆</span>{{ kpi }}
            </li>
          </ul>
          <div class="mt-2 text-xs" style="color: var(--color-dim)">
            เป้าหมาย:
            <span class="font-bold" :style="`color: ${recColor};`">{{
              action.target
            }}</span>
          </div>
        </div>

        <hr style="border-color: var(--color-border)" />

        <!-- Edit fields -->
        <div>
          <div
            class="text-xs font-semibold mb-3"
            style="color: var(--color-signal)"
          >
            อัปเดตความคืบหน้า
          </div>

          <div class="space-y-3">
            <!-- Status -->
            <div>
              <label class="text-xs mb-1 block" style="color: var(--color-dim)"
                >สถานะ</label
              >
              <select v-model="localStatus" class="field">
                <option v-for="s in statusOptions" :key="s" :value="s">
                  {{ cfg(s).label }}
                </option>
              </select>
            </div>

            <!-- Progress -->
            <div>
              <label
                class="text-xs mb-1 flex justify-between"
                style="color: var(--color-dim)"
              >
                <span>ความคืบหน้า</span>
                <span class="num font-bold" :style="`color: ${recColor};`"
                  >{{ localPct }}%</span
                >
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                v-model.number="localPct"
                class="w-full"
                :style="`accent-color: ${recColor};`"
              />
            </div>

            <!-- Actual value -->
            <div>
              <label class="text-xs mb-1 block" style="color: var(--color-dim)"
                >ค่าจริงที่วัดได้ (Actual KPI Value)</label
              >
              <input
                v-model="localActual"
                type="text"
                class="field"
                placeholder="เช่น 87%, 3 ครั้ง, ไม่มีข้อบกพร่อง"
              />
            </div>

            <!-- Notes -->
            <div>
              <label class="text-xs mb-1 block" style="color: var(--color-dim)"
                >บันทึก / ความก้าวหน้า</label
              >
              <textarea
                v-model="localNotes"
                class="field"
                rows="3"
                placeholder="สรุปสิ่งที่ดำเนินการแล้ว..."
              ></textarea>
            </div>

            <!-- Blockers -->
            <div>
              <label
                class="text-xs mb-1 block"
                style="color: var(--color-danger)"
                >อุปสรรค / ติดขัด (ถ้ามี)</label
              >
              <textarea
                v-model="localBlockers"
                class="field"
                rows="2"
                placeholder="ระบุปัญหาและผู้ที่ต้องช่วยแก้ไข..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer actions -->
      <div
        class="p-5 shrink-0 flex gap-3"
        style="border-top: 1px solid var(--color-border)"
      >
        <button class="btn-ghost flex-1" @click="emit('close')">ยกเลิก</button>
        <button
          class="btn-primary flex-1"
          :disabled="store.saving === action.id"
          @click="save"
        >
          {{
            store.saving === action.id
              ? "กำลังบันทึก..."
              : "บันทึก → Google Sheets"
          }}
        </button>
      </div>
    </div>
  </Transition>
</template>
