// src/composables/use-count-up.ts
import { ref, watch } from 'vue';

export function useCountUp(target: () => number, duration = 600) {
  const display = ref(target());

  watch(target, (to, from, onCleanup) => {
    const start = from ?? 0;
    const startTime = performance.now();
    let raf = 0;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - (1 - progress) ** 3;
      display.value = Math.round(start + (to - start) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    onCleanup(() => {
      if (raf) cancelAnimationFrame(raf);
    });

    raf = requestAnimationFrame(tick);
  });

  return display;
}
