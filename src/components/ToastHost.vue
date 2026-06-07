<script setup lang="ts">
import { useToasts } from '@/composables/use-toast';

const { items, dismiss } = useToasts();
</script>

<template>
  <div
    class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in items"
        :key="t.id"
        class="pointer-events-auto card px-4 py-3 flex items-start gap-3 shadow-lg"
        :class="{
          'border-[var(--color-ok)]': t.type === 'success',
          'border-[var(--color-danger)]': t.type === 'error',
        }"
        role="status"
      >
        <span
          class="num text-sm font-bold leading-none mt-0.5"
          :style="{
            color:
              t.type === 'error'
                ? 'var(--color-danger)'
                : t.type === 'success'
                  ? 'var(--color-ok)'
                  : 'var(--color-signal)',
          }"
          aria-hidden="true"
        >
          {{
            t.type === 'error' ? '!' : t.type === 'success' ? '✓' : 'i'
          }}
        </span>
        <p class="text-sm leading-snug flex-1" style="color: var(--color-text)">
          {{ t.message }}
        </p>
        <button
          type="button"
          class="text-xs font-semibold opacity-60 hover:opacity-100"
          style="color: var(--color-dim)"
          :aria-label="`Dismiss notification: ${t.message}`"
          @click="dismiss(t.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    transform 0.22s ease,
    opacity 0.22s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
