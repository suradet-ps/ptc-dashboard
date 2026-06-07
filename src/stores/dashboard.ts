// src/stores/dashboard.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  fetchAllActions,
  updateActionProgress,
  type ActionPatch,
} from '@/services/supabase-actions';
import { supabase } from '@/services/supabase';
import { useConfigStore } from '@/stores/config';
import type { ActionItem, DashboardSummary } from '@/types';

function toErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Unknown error';
}

export const useDashboardStore = defineStore('dashboard', () => {
  const configStore = useConfigStore();

  const actions = ref<ActionItem[]>([]);
  const loading = ref(false);
  const saving = ref<string | null>(null);
  const error = ref<string | null>(null);
  const lastSync = ref<Date | null>(null);
  const currentUser = ref('PTC');

  let realtimeChannel: RealtimeChannel | null = null;

  const summary = computed<DashboardSummary>(() => {
    const all = actions.value;
    const completed = all.filter(a => a.status === 'completed').length;
    const inProgress = all.filter(a => a.status === 'in_progress').length;
    const delayed = all.filter(a => a.status === 'delayed').length;
    const blocked = all.filter(a => a.status === 'blocked').length;
    const notStarted = all.filter(a => a.status === 'not_started').length;
    const overallPct
      = all.length === 0
        ? 0
        : Math.round(all.reduce((s, a) => s + a.progressPct, 0) / all.length);
    return {
      totalActions: all.length,
      completed,
      inProgress,
      delayed,
      blocked,
      notStarted,
      overallPct,
    };
  });

  const byRecommendation = computed(() =>
    configStore.recommendations.map(rec => {
      const recActions = actions.value.filter(a => a.recNo === rec.no);
      const pct
        = recActions.length === 0
          ? 0
          : Math.round(
              recActions.reduce((s, a) => s + a.progressPct, 0) / recActions.length,
            );
      return {
        no: rec.no,
        title: rec.title,
        shortTitle: rec.short_title,
        color: rec.color_key,
        hexColor: rec.hex_color,
        actions: recActions,
        pct,
      };
    }),
  );

  const blockedActions = computed(() =>
    actions.value.filter(a => a.status === 'blocked'),
  );
  const delayedActions = computed(() =>
    actions.value.filter(a => a.status === 'delayed'),
  );

  async function refetchActions(): Promise<void> {
    actions.value = await fetchAllActions();
    lastSync.value = new Date();
  }

  function ensureRealtimeSubscription(): void {
    if (realtimeChannel) return;
    realtimeChannel = supabase
      .channel('ptc_action_progress_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ptc_action_progress' },
        () => {
          refetchActions().catch((e: unknown) => {
            error.value = toErrorMessage(e);
          });
        },
      )
      .subscribe();
  }

  async function syncFromServer(): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      await refetchActions();
      ensureRealtimeSubscription();
    } catch (e) {
      error.value = toErrorMessage(e);
    } finally {
      loading.value = false;
    }
  }

  function teardownRealtime(): void {
    if (realtimeChannel) {
      void supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  }

  async function saveAction(
    id: string,
    patch: ActionPatch,
  ): Promise<void> {
    const action = actions.value.find(a => a.id === id);
    if (!action) return;

    const previous = { ...action };
    Object.assign(action, patch);
    saving.value = id;
    error.value = null;

    try {
      await updateActionProgress(id, patch, currentUser.value);
      action.lastUpdated = new Date().toISOString();
      action.updatedBy = currentUser.value;
    } catch (e) {
      Object.assign(action, previous);
      error.value = toErrorMessage(e);
    } finally {
      saving.value = null;
    }
  }

  return {
    actions,
    loading,
    saving,
    error,
    lastSync,
    currentUser,
    summary,
    byRecommendation,
    blockedActions,
    delayedActions,
    syncFromServer,
    saveAction,
    teardownRealtime,
  };
});
