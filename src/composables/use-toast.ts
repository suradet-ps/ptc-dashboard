// src/composables/use-toast.ts
import { reactive, readonly } from 'vue';

export type ToastVariant = 'info' | 'success' | 'error';

export type Toast = {
  id: number;
  type: ToastVariant;
  message: string;
  expiresAt: number;
};

const state = reactive<{ items: Toast[] }>({ items: [] });
let nextId = 1;

const TOAST_TTL_MS = 4500;

function dismiss(id: number): void {
  const i = state.items.findIndex((t) => t.id === id);
  if (i !== -1) state.items.splice(i, 1);
}

function push(opts: { type?: ToastVariant; message: string; ttlMs?: number }): number {
  const id = nextId++;
  const ttl = opts.ttlMs ?? TOAST_TTL_MS;
  state.items.push({
    id,
    type: opts.type ?? 'info',
    message: opts.message,
    expiresAt: Date.now() + ttl,
  });
  setTimeout(() => dismiss(id), ttl);
  return id;
}

export function useToasts() {
  return {
    items: readonly(state.items),
    push,
    dismiss,
  };
}

export function toMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return typeof e === 'string' ? e : 'Unknown error';
}
