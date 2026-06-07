// src/services/supabase-actions.ts

import type { ActionItem, ActionStatus, RecommendationNo } from '@/types';
import { supabase } from './supabase';

type ActionRow = {
  id: string;
  rec_no: number;
  action_no: number;
  plan: string;
  sub_items: string[];
  timeline: string;
  start_month: number;
  end_month: number;
  kpis: string[];
  target: string;
  owners: string[];
  report_cycle: string;
  ha_ref: string;
  status: ActionStatus | null;
  progress_pct: number | null;
  actual_value: string | null;
  notes: string | null;
  blockers: string | null;
  last_updated: string | null;
  updated_by: string | null;
};

function dbToActionItem(row: ActionRow): ActionItem {
  return {
    id: row.id,
    recNo: row.rec_no as RecommendationNo,
    no: row.action_no,
    plan: row.plan,
    subItems: row.sub_items ?? [],
    timeline: row.timeline,
    startMonth: row.start_month,
    endMonth: row.end_month,
    kpis: row.kpis ?? [],
    target: row.target,
    owners: row.owners ?? [],
    reportCycle: row.report_cycle,
    haRef: row.ha_ref,
    status: row.status ?? 'not_started',
    progressPct: row.progress_pct ?? 0,
    actualValue: row.actual_value ?? '',
    notes: row.notes ?? '',
    blockers: row.blockers ?? '',
    lastUpdated: row.last_updated ?? '',
    updatedBy: row.updated_by ?? 'PTC',
  };
}

export async function fetchAllActions(): Promise<ActionItem[]> {
  const { data, error } = await supabase
    .from('ptc_v_actions_full')
    .select('*')
    .order('rec_no', { ascending: true })
    .order('action_no', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(dbToActionItem);
}

export type ActionPatch = Pick<
  ActionItem,
  'status' | 'progressPct' | 'actualValue' | 'notes' | 'blockers'
>;

function toDbPatch(patch: Partial<ActionPatch>, updatedBy: string) {
  return {
    status: patch.status,
    progress_pct: patch.progressPct,
    actual_value: patch.actualValue,
    notes: patch.notes,
    blockers: patch.blockers,
    last_updated: new Date().toISOString(),
    updated_by: updatedBy,
  };
}

export async function updateActionProgress(
  actionId: string,
  patch: Partial<ActionPatch>,
  updatedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('ptc_action_progress')
    .update(toDbPatch(patch, updatedBy))
    .eq('action_id', actionId);

  if (error) throw new Error(error.message);
}
