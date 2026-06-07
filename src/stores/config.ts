// src/stores/config.ts
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  type FiscalMonthRow,
  fetchFiscalMonths,
  fetchRecommendations,
  fetchStatusCatalog,
  type RecommendationRow,
  type StatusCatalogRow,
} from '@/services/supabase-config';
import type { ActionStatus, RecommendationNo, StatusConfigMap } from '@/types';

export const useConfigStore = defineStore('config', () => {
  const recommendations = ref<RecommendationRow[]>([]);
  const statusCatalogRows = ref<StatusCatalogRow[]>([]);
  const fiscalMonthRows = ref<FiscalMonthRow[]>([]);

  const loading = ref(false);
  const loaded = ref(false);
  const error = ref<string | null>(null);
  // Distinguish a fatal first-load failure from later transient errors.
  const loadError = ref<string | null>(null);

  const statusCatalog = computed<StatusConfigMap>(() => {
    const map = {} as StatusConfigMap;
    for (const s of statusCatalogRows.value) {
      map[s.status_key as ActionStatus] = {
        label: s.label,
        color: s.color_class,
        bg: s.bg_class,
        dot: s.dot_class,
        border: s.border_class,
        hex: s.hex_color,
      };
    }
    return map;
  });

  const fiscalMonths = computed<string[]>(() => fiscalMonthRows.value.map((m) => m.short_label));

  const recColor = (no: RecommendationNo): string =>
    recommendations.value.find((r) => r.no === no)?.hex_color ?? '#6cc24a';

  async function load(force = false): Promise<void> {
    if (loaded.value && !force) return;
    loading.value = true;
    error.value = null;
    loadError.value = null;
    try {
      const [recs, statuses, months] = await Promise.all([
        fetchRecommendations(),
        fetchStatusCatalog(),
        fetchFiscalMonths(),
      ]);
      recommendations.value = recs;
      statusCatalogRows.value = statuses;
      fiscalMonthRows.value = months;
      loaded.value = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load config';
      error.value = msg;
      loadError.value = msg;
    } finally {
      loading.value = false;
    }
  }

  return {
    recommendations,
    statusCatalogRows,
    fiscalMonthRows,
    statusCatalog,
    fiscalMonths,
    loading,
    loaded,
    error,
    loadError,
    recColor,
    load,
  };
});
