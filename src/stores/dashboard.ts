// src/stores/dashboard.ts

import type { RealtimeChannel } from '@supabase/supabase-js';
import { defineStore } from 'pinia';
import { computed, onScopeDispose, ref } from 'vue';
import { supabase } from '@/services/supabase';
import {
  type ActionPatch,
  fetchAllActions,
  updateActionProgress,
} from '@/services/supabase-actions';
import { useConfigStore } from '@/stores/config';
import type { ActionItem, DashboardSummary, RecommendationGroup, RecommendationNo } from '@/types';

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

  let realtimeChannel: RealtimeChannel | null = null;
  // Echo-suppression: ignore realtime payloads for the action the current
  // client just wrote for a short window, so we don't refetch the whole
  // list immediately after our own write.
  const ECHO_WINDOW_MS = 1500;
  const recentWrites = new Map<string, number>();

  const summary = computed<DashboardSummary>(() => {
    const all = actions.value;
    let completed = 0;
    let inProgress = 0;
    let delayed = 0;
    let blocked = 0;
    let notStarted = 0;
    let totalPct = 0;
    for (const a of all) {
      switch (a.status) {
        case 'completed':
          completed++;
          break;
        case 'in_progress':
          inProgress++;
          break;
        case 'delayed':
          delayed++;
          break;
        case 'blocked':
          blocked++;
          break;
        default:
          notStarted++;
          break;
      }
      totalPct += a.progressPct;
    }
    const overallPct = all.length === 0 ? 0 : Math.round(totalPct / all.length);
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

  const byRecommendation = computed<RecommendationGroup[]>(() =>
    configStore.recommendations.map((rec) => {
      const recActions = actions.value.filter((a) => a.recNo === rec.no);
      const pct =
        recActions.length === 0
          ? 0
          : Math.round(recActions.reduce((s, a) => s + a.progressPct, 0) / recActions.length);
      const group: RecommendationGroup = {
        no: rec.no as RecommendationNo,
        title: rec.title,
        shortTitle: rec.short_title,
        color: rec.color_key,
        hexColor: rec.hex_color,
        actions: recActions,
        pct,
      };
      return group;
    }),
  );

  const blockedActions = computed(() => actions.value.filter((a) => a.status === 'blocked'));
  const delayedActions = computed(() => actions.value.filter((a) => a.status === 'delayed'));

  async function refetchActions(): Promise<void> {
    actions.value = await fetchAllActions();
    lastSync.value = new Date();
  }

  function isEcho(actionId: string): boolean {
    const ts = recentWrites.get(actionId);
    if (ts === undefined) return false;
    if (Date.now() - ts > ECHO_WINDOW_MS) {
      recentWrites.delete(actionId);
      return false;
    }
    return true;
  }

  function ensureRealtimeSubscription(): void {
    if (realtimeChannel) return;
    realtimeChannel = supabase
      .channel('ptc_action_progress_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ptc_action_progress' },
        (payload) => {
          const incomingId =
            (payload.new as { action_id?: string } | null)?.action_id ??
            (payload.old as { action_id?: string } | null)?.action_id;
          if (incomingId && isEcho(incomingId)) return;
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
    recentWrites.clear();
  }

  async function saveAction(id: string, patch: Partial<ActionPatch>): Promise<void> {
    const action = actions.value.find((a) => a.id === id);
    if (!action) return;

    // RLS: ptc_action_progress is editor+ only. The DB will reject
    // unauthenticated writes with a 401/403; surface a clear error
    // up-front so the UI can show a sign-in prompt.
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const e = new Error('ต้องเข้าสู่ระบบก่อนจึงจะบันทึกได้');
      error.value = e.message;
      throw e;
    }

    const previous = { ...action };
    Object.assign(action, patch);
    saving.value = id;
    error.value = null;
    recentWrites.set(id, Date.now());

    try {
      await updateActionProgress(id, patch);
      // last_updated + updated_by are written by the DB trigger from
      // auth.jwt(). Refetch this single row to pick up the canonical
      // values instead of guessing them client-side.
      const { data: refreshed, error: refreshErr } = await supabase
        .from('ptc_action_progress')
        .select('last_updated, updated_by')
        .eq('action_id', id)
        .single();
      if (!refreshErr && refreshed) {
        action.lastUpdated = refreshed.last_updated ?? action.lastUpdated;
        action.updatedBy = refreshed.updated_by ?? sessionData.session.user.email ?? '';
      } else {
        action.lastUpdated = new Date().toISOString();
        action.updatedBy = sessionData.session.user.email ?? '';
      }
    } catch (e) {
      Object.assign(action, previous);
      recentWrites.delete(id);
      error.value = toErrorMessage(e);
      throw e;
    } finally {
      saving.value = null;
    }
  }

  onScopeDispose(() => {
    teardownRealtime();
  });

  return {
    actions,
    loading,
    saving,
    error,
    lastSync,
    summary,
    byRecommendation,
    blockedActions,
    delayedActions,
    syncFromServer,
    saveAction,
    teardownRealtime,
  };
});
