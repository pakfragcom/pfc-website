import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Traps Tab focus inside the returned ref's element, closes on Escape, and
// restores focus to whatever was focused before the modal opened.
export function useFocusTrap(active, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active) return;

    const container = ref.current;
    const previouslyFocused = document.activeElement;
    const first = container?.querySelector(FOCUSABLE);
    first?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const focusable = Array.from(container.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [active, onClose]);

  return ref;
}
