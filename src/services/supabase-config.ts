// src/services/supabase-config.ts
import { supabase } from './supabase';
import type { ActionStatus } from '@/types';

export type RecommendationRow = {
  no: number;
  title: string;
  short_title: string;
  color_key: string;
  hex_color: string;
  created_at: string;
};

export type StatusCatalogRow = {
  status_key: ActionStatus;
  label: string;
  color_class: string;
  bg_class: string;
  dot_class: string;
  border_class: string;
  hex_color: string;
  sort_order: number;
};

export type FiscalMonthRow = {
  month_no: number;
  short_label: string;
  calendar_month: number;
};

export async function fetchRecommendations(): Promise<RecommendationRow[]> {
  const { data, error } = await supabase
    .from('ptc_recommendations')
    .select('*')
    .order('no', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchStatusCatalog(): Promise<StatusCatalogRow[]> {
  const { data, error } = await supabase
    .from('ptc_status_catalog')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchFiscalMonths(): Promise<FiscalMonthRow[]> {
  const { data, error } = await supabase
    .from('ptc_fiscal_months')
    .select('*')
    .order('month_no', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
