import { useEffect, useRef } from 'react';

export function useKeyboardNav({
  next, prev, onHome, onEnd, onEscape,
}: {
  next: () => void;
  prev: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onEscape?: () => void;
}) {
  // Hold callbacks in a ref so the listener is bound once and never rebinds
  const cbsRef = useRef({ next, prev, onHome, onEnd, onEscape });
  cbsRef.current = { next, prev, onHome, onEnd, onEscape };

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Events dispatched on window itself have no element target.
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      if (target?.closest('.page-body-scroll, .q-body-scroll') && ['PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) return;
      const cbs = cbsRef.current;
      if (['ArrowRight', 'ArrowLeft', 'PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) e.preventDefault();
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown': cbs.next(); break;
        case 'ArrowLeft':
        case 'PageUp': cbs.prev(); break;
        case 'Home': cbs.onHome?.(); break;
        case 'End': cbs.onEnd?.(); break;
        case 'Escape': cbs.onEscape?.(); break;
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
