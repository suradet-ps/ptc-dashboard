// src/composables/use-focus-trap.ts
import { onScopeDispose, type Ref } from 'vue';

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

export function useFocusTrap(
  container: Ref<HTMLElement | null>,
  options?: { onEscape?: () => void },
) {
  let previouslyFocused: HTMLElement | null = null;
  let active = false;

  function focusables(): HTMLElement[] {
    if (!container.value) return [];
    return Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('inert') && el.offsetParent !== null,
    );
  }

  function onKeydown(e: KeyboardEvent) {
    if (!active) return;
    if (e.key === 'Escape' && options?.onEscape) {
      e.stopPropagation();
      options.onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    const list = focusables();
    if (list.length === 0) {
      e.preventDefault();
      container.value?.focus();
      return;
    }
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function activate() {
    if (active) return;
    active = true;
    previouslyFocused = document.activeElement as HTMLElement | null;
    document.addEventListener('keydown', onKeydown, true);
    // Defer focus so the panel is fully rendered
    requestAnimationFrame(() => {
      const list = focusables();
      if (list[0]) {
        list[0].focus();
      } else {
        container.value?.focus();
      }
    });
  }

  function deactivate() {
    if (!active) return;
    active = false;
    document.removeEventListener('keydown', onKeydown, true);
    previouslyFocused?.focus?.();
    previouslyFocused = null;
  }

  onScopeDispose(deactivate);

  return { activate, deactivate };
}
