import { useEffect, useRef } from 'react';

export function useHashRoute({
  onNavigate,
  currentPage,
  ready = true,
  key = 'p',
}: {
  onNavigate: (page: number) => void;
  currentPage: number;
  ready?: boolean;
  key?: string; // "#p=12" for the statement of work, "#q=3" for the questionnaire
}) {
  // Hold onNavigate in a ref so effects don't retrigger on every render
  const onNavRef = useRef(onNavigate);
  onNavRef.current = onNavigate;

  // Read hash on mount only; also respond to user-driven hashchange
  useEffect(() => {
    if (!ready) return;
    const pattern = new RegExp(`#${key}=(\\d+)`);
    function read() {
      const m = pattern.exec(window.location.hash);
      if (m) onNavRef.current(Number(m[1]));
    }
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [ready, key]);

  // Write hash when currentPage changes
  useEffect(() => {
    if (!ready) return;
    const desired = `#${key}=${currentPage}`;
    if (window.location.hash !== desired) {
      window.history.replaceState(null, '', desired);
    }
  }, [currentPage, ready, key]);
}
