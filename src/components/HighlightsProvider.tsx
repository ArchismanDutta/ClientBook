import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Highlight, HighlightColor } from '../lib/highlights/types';
import { loadHighlights, newHighlightId, saveHighlights } from '../lib/highlights/store';

export type PopupTarget = {
  highlightId: string;
  anchor: DOMRect;
};

type Ctx = {
  highlights: Highlight[];
  mode: boolean;
  color: HighlightColor;
  popup: PopupTarget | null;
  setMode: (v: boolean) => void;
  setColor: (c: HighlightColor) => void;
  addHighlight: (h: Omit<Highlight, 'id' | 'createdAt'>) => Highlight;
  removeHighlight: (id: string) => void;
  updateComment: (id: string, text: string) => void;
  removeComment: (id: string) => void;
  openPopup: (target: PopupTarget) => void;
  closePopup: () => void;
  getForKey: (hlKey: string) => Highlight[];
  getById: (id: string) => Highlight | undefined;
};

const HighlightsContext = createContext<Ctx | null>(null);

// Inert stub used when the hook is called outside a provider
// (e.g. from the off-screen React root used by the pagination measurer).
const NOOP_CTX: Ctx = {
  highlights: [],
  mode: false,
  color: 'yellow',
  popup: null,
  setMode: () => {},
  setColor: () => {},
  addHighlight: (h) => ({ ...h, id: 'noop', createdAt: 0 }),
  removeHighlight: () => {},
  updateComment: () => {},
  removeComment: () => {},
  openPopup: () => {},
  closePopup: () => {},
  getForKey: () => [],
  getById: () => undefined,
};

export function useHighlights(): Ctx {
  const ctx = useContext(HighlightsContext);
  return ctx ?? NOOP_CTX;
}

export function HighlightsProvider({ children }: { children: ReactNode }) {
  const [highlights, setHighlights] = useState<Highlight[]>(() => loadHighlights());
  const [mode, setMode] = useState(false);
  const [color, setColor] = useState<HighlightColor>('yellow');
  const [popup, setPopup] = useState<PopupTarget | null>(null);

  useEffect(() => { saveHighlights(highlights); }, [highlights]);

  // Reflect highlight mode onto the body so CSS can enforce text selection
  // without relying on :has() browser support.
  useEffect(() => {
    if (mode) document.body.dataset.highlightMode = 'on';
    else delete document.body.dataset.highlightMode;
    return () => { delete document.body.dataset.highlightMode; };
  }, [mode]);

  // While highlight mode is on, absorb mouse events on text content before
  // page-flip's native listeners see them. page-flip binds mouse listeners
  // to its own container in the bubble phase, so a capture-phase document
  // listener that calls stopImmediatePropagation runs first and prevents
  // click-to-flip / drag-to-flip from firing on text.
  useEffect(() => {
    if (!mode) return;
    const TEXT_SELECTOR =
      '.book-flipper .para, .book-flipper .lede, .book-flipper .callout, ' +
      '.book-flipper .h1, .book-flipper .h2, .book-flipper .toc-title, ' +
      '.book-flipper .list, .book-flipper .table';
    function absorb(e: Event) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(TEXT_SELECTOR)) {
        e.stopPropagation();
      }
    }
    const events: (keyof DocumentEventMap)[] = ['mousedown', 'click', 'touchstart'];
    for (const ev of events) document.addEventListener(ev, absorb, true);
    return () => {
      for (const ev of events) document.removeEventListener(ev, absorb, true);
    };
  }, [mode]);

  const addHighlight = useCallback((h: Omit<Highlight, 'id' | 'createdAt'>): Highlight => {
    const full: Highlight = { ...h, id: newHighlightId(), createdAt: Date.now() };
    setHighlights(prev => [...prev, full]);
    return full;
  }, []);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
    setPopup(p => (p && p.highlightId === id ? null : p));
  }, []);

  const updateComment = useCallback((id: string, text: string) => {
    setHighlights(prev => prev.map(h =>
      h.id === id ? { ...h, comment: { text, lastEditedAt: Date.now() } } : h
    ));
  }, []);

  const removeComment = useCallback((id: string) => {
    setHighlights(prev => prev.map(h => (h.id === id ? { ...h, comment: undefined } : h)));
  }, []);

  const openPopup = useCallback((target: PopupTarget) => setPopup(target), []);
  const closePopup = useCallback(() => setPopup(null), []);

  const value = useMemo<Ctx>(() => ({
    highlights,
    mode,
    color,
    popup,
    setMode,
    setColor,
    addHighlight,
    removeHighlight,
    updateComment,
    removeComment,
    openPopup,
    closePopup,
    getForKey: (hlKey) => highlights.filter(h => h.hlKey === hlKey),
    getById: (id) => highlights.find(h => h.id === id),
  }), [highlights, mode, color, popup, addHighlight, removeHighlight, updateComment, removeComment, openPopup, closePopup]);

  return <HighlightsContext.Provider value={value}>{children}</HighlightsContext.Provider>;
}
