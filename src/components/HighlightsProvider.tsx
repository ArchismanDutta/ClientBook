import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  removeHighlight: (id: string) => void;
  updateComment: (id: string, text: string) => void;
  removeComment: (id: string) => void;
  openPopup: (target: PopupTarget) => void;
  closePopup: () => void;
  getForKey: (hlKey: string) => Highlight[];
  getById: (id: string) => Highlight | undefined;
  getGroup: (id: string) => Highlight[];
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
  removeHighlight: () => {},
  updateComment: () => {},
  removeComment: () => {},
  openPopup: () => {},
  closePopup: () => {},
  getForKey: () => [],
  getById: () => undefined,
  getGroup: () => [],
};

// Every highlightable text unit in the book (see Highlightable.tsx).
const UNIT_SELECTOR = '.book-flipper [data-hl-key]';

export function useHighlights(): Ctx {
  const ctx = useContext(HighlightsContext);
  return ctx ?? NOOP_CTX;
}

// Matches a highlight and the other pieces of the same selection.
function inGroupOf(target: Highlight | undefined) {
  return (h: Highlight) =>
    !!target && (h.id === target.id || (!!target.groupId && h.groupId === target.groupId));
}

export function HighlightsProvider({ children }: { children: ReactNode }) {
  const [highlights, setHighlights] = useState<Highlight[]>(() => loadHighlights());
  const [mode, setMode] = useState(false);
  const [color, setColor] = useState<HighlightColor>('yellow');
  const [popup, setPopup] = useState<PopupTarget | null>(null);
  const colorRef = useRef(color);
  colorRef.current = color;

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
      `${UNIT_SELECTOR}, .book-flipper .lede, .book-flipper .callout, .book-flipper .toc-title, ` +
      '.book-flipper .list, .book-flipper .table, .book-flipper .figure';
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

  // Turn a finished selection into highlights: one per text unit it touches,
  // grouped when the selection spans several (e.g. a heading and a paragraph).
  useEffect(() => {
    if (!mode) return;
    function onMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const pieces = selectedPieces(range);
      if (pieces.length === 0) return;

      // Snapshot the range's rect BEFORE we clear the selection.
      const anchor = range.getBoundingClientRect();
      const groupId = pieces.length > 1 ? newHighlightId() : undefined;
      const createdAt = Date.now();
      const created: Highlight[] = pieces.map(p => ({
        ...p,
        id: newHighlightId(),
        groupId,
        color: colorRef.current,
        createdAt,
      }));
      setHighlights(prev => [...prev, ...created]);
      sel.removeAllRanges();

      // Open the popup once the new marks have rendered.
      requestAnimationFrame(() => setPopup({ highlightId: created[0].id, anchor }));
    }
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [mode]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => {
      const same = inGroupOf(prev.find(h => h.id === id));
      return prev.filter(h => !same(h));
    });
    setPopup(p => (p && p.highlightId === id ? null : p));
  }, []);

  const updateComment = useCallback((id: string, text: string) => {
    setHighlights(prev => {
      const same = inGroupOf(prev.find(h => h.id === id));
      return prev.map(h => (same(h) ? { ...h, comment: { text, lastEditedAt: Date.now() } } : h));
    });
  }, []);

  const removeComment = useCallback((id: string) => {
    setHighlights(prev => {
      const same = inGroupOf(prev.find(h => h.id === id));
      return prev.map(h => (same(h) ? { ...h, comment: undefined } : h));
    });
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
    removeHighlight,
    updateComment,
    removeComment,
    openPopup,
    closePopup,
    getForKey: (hlKey) => highlights.filter(h => h.hlKey === hlKey),
    getById: (id) => highlights.find(h => h.id === id),
    getGroup: (id) => highlights.filter(inGroupOf(highlights.find(h => h.id === id))),
  }), [highlights, mode, color, popup, removeHighlight, updateComment, removeComment, openPopup, closePopup]);

  return <HighlightsContext.Provider value={value}>{children}</HighlightsContext.Provider>;
}

type Piece = Pick<Highlight, 'hlKey' | 'startOffset' | 'endOffset' | 'text'>;

// The part of each highlightable unit covered by `range`, in document order.
function selectedPieces(range: Range): Piece[] {
  const common = range.commonAncestorContainer;
  const commonEl = common.nodeType === Node.ELEMENT_NODE ? (common as Element) : common.parentElement;
  if (!commonEl) return [];

  const enclosing = commonEl.closest(UNIT_SELECTOR);
  const units = enclosing ? [enclosing] : Array.from(commonEl.querySelectorAll(UNIT_SELECTOR));

  const pieces: Piece[] = [];
  for (const el of units) {
    if (!(el instanceof HTMLElement) || !range.intersectsNode(el)) continue;
    const hlKey = el.dataset.hlKey;
    if (!hlKey) continue;
    const full = el.textContent ?? '';
    const start = el.contains(range.startContainer) ? offsetWithin(el, range.startContainer, range.startOffset) : 0;
    const end = el.contains(range.endContainer) ? offsetWithin(el, range.endContainer, range.endOffset) : full.length;
    if (end <= start) continue;
    const text = full.slice(start, end);
    if (!text.trim()) continue;
    pieces.push({ hlKey, startOffset: start, endOffset: end, text });
  }
  return pieces;
}

// Plain-text character offset of a DOM position inside `root`.
function offsetWithin(root: Node, node: Node, offset: number): number {
  const r = document.createRange();
  r.setStart(root, 0);
  r.setEnd(node, offset);
  return r.toString().length;
}
