// src/composables/use-now.ts
import { onScopeDispose, ref } from 'vue';

const TICKERS = new Set<(now: number) => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function ensureInterval() {
  if (intervalId !== null) return;
  if (typeof window === 'undefined') return;
  intervalId = setInterval(() => {
    const n = Date.now();
    for (const cb of TICKERS) cb(n);
  }, 1000);
}

function teardownInterval() {
  if (TICKERS.size > 0) return;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function useNow(intervalMs = 1000) {
  const now = ref(Date.now());

  if (intervalMs !== 1000) {
    // Custom cadence: not supported by the shared singleton; spin our own.
    const id = setInterval(() => {
      now.value = Date.now();
    }, intervalMs);
    onScopeDispose(() => clearInterval(id));
    return now;
  }

  const cb = (n: number) => {
    now.value = n;
  };
  TICKERS.add(cb);
  ensureInterval();
  onScopeDispose(() => {
    TICKERS.delete(cb);
    teardownInterval();
  });

  return now;
}
