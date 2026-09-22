import { useEffect, useRef, type CSSProperties } from 'react';
import { PageFlip } from 'page-flip';

export type BookShellHandle = {
  next: () => void;
  prev: () => void;
  turnTo: (pageIndex: number) => void;
  getCurrent: () => number;
  getTotal: () => number;
};

const SWIPE_DISTANCE = 45;   // px of horizontal travel that counts as a swipe
const SWIPE_MAX_TIME = 1200; // ms: longer than this is a press, not a swipe

// Turn the page on a horizontal swipe, whatever its speed. Gestures that belong
// to something else — selecting text, opening a note, pressing a control — are
// left alone.
export function attachSwipe(container: HTMLElement, turn: { back: () => void; forward: () => void }) {
  let start: { x: number; y: number; at: number } | null = null;

  const onStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement | null;
    const onText = document.body.dataset.highlightMode === 'on' && !!target?.closest('[data-hl-key]');
    if (e.touches.length !== 1 || onText || target?.closest('mark.hl, a, button')) {
      start = null;
      return;
    }
    const touch = e.touches[0];
    start = { x: touch.clientX, y: touch.clientY, at: Date.now() };
  };

  const onEnd = (e: TouchEvent) => {
    const from = start;
    start = null;
    const touch = e.changedTouches[0];
    if (!from || !touch) return;
    const dx = touch.clientX - from.x;
    const dy = touch.clientY - from.y;
    if (Date.now() - from.at > SWIPE_MAX_TIME) return;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dy) > Math.abs(dx)) return;
    if (!window.getSelection()?.isCollapsed) return; // the reader is selecting text
    if (dx > 0) turn.back();
    else turn.forward();
  };

  const onCancel = () => { start = null; };
  container.addEventListener('touchstart', onStart, { passive: true });
  container.addEventListener('touchend', onEnd, { passive: true });
  container.addEventListener('touchcancel', onCancel, { passive: true });
  return () => {
    container.removeEventListener('touchstart', onStart);
    container.removeEventListener('touchend', onEnd);
    container.removeEventListener('touchcancel', onCancel);
  };
}

export function BookShell({ children, pageW, pageH, singlePage, initialPage, closed, onFlip, handleRef, clickToFlip = true }: {
  children: React.ReactNode;
  pageW: number;
  pageH: number;
  singlePage: boolean;
  initialPage: number;
  closed: boolean;
  onFlip: (pageIndex: number) => void;
  handleRef: React.RefObject<BookShellHandle | null>;
  clickToFlip?: boolean; // false: on inner pages a plain click turns the page only at its corners
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // The open page, so the book stays put if this effect ever runs again on the
  // same pages (React Fast Refresh does that after an edit during development).
  const pageRef = useRef(initialPage);
  useEffect(() => {
    const container = containerRef.current;
    const viewport = container?.parentElement;
    if (!container || !viewport) return;
    const pages = Array.from(container.querySelectorAll<HTMLElement>('.pf-page'));
    // Nothing to turn, e.g. a teardown from older code already took the pages.
    if (!pages.length) return;
    // Read before page-flip starts: loading announces page 0 and would overwrite it.
    const startPage = pageRef.current;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const flip = new PageFlip(container, {
      width: pageW, height: pageH, size: 'fixed', autoSize: false,
      drawShadow: true, maxShadowOpacity: .3, showCover: true,
      usePortrait: singlePage, flippingTime: reducedMotion ? 1 : 550,
      // On a phone the swipes below replace page-flip's own touch handling,
      // which only turns back from a fast flick near the page's left edge.
      useMouseEvents: !singlePage, mobileScrollSupport: false,
      disableFlipByClick: !singlePage && !clickToFlip, showPageCorners: !singlePage,
      swipeDistance: 40,
    });
    // page-flip reads its settings on every click, so the front and back covers
    // can always open with a plain click even when inner pages only turn from
    // their corners. On a phone it stays off: page-flip sees no clicks there,
    // and it also refuses flipPrev() — the arrows and swipes — while it is on.
    const syncClickToFlip = (index: number) => {
      const onCover = index === 0 || index === flip.getPageCount() - 1;
      flip.getSettings().disableFlipByClick = !singlePage && !clickToFlip && !onCover;
    };
    flip.on('flip', e => { pageRef.current = e.data; syncClickToFlip(e.data); onFlip(e.data); });
    const pageClasses = pages.map(page => page.className);
    flip.loadFromHTML(pages);
    const turnTo = (index: number) => flip.turnToPage(Math.max(0, Math.min(index, flip.getPageCount() - 1)));
    turnTo(startPage);
    syncClickToFlip(flip.getCurrentPageIndex());
    onFlip(flip.getCurrentPageIndex());
    handleRef.current = {
      next: () => flip.flipNext(), prev: () => flip.flipPrev(), turnTo,
      getCurrent: () => flip.getCurrentPageIndex(), getTotal: () => flip.getPageCount(),
    };

    // Swipes on a phone, in place of page-flip's: a turn should not depend on
    // how fast the finger moved or where on the page it started.
    const detachSwipe = singlePage ? attachSwipe(container, {
      back: () => flip.flipPrev(),
      forward: () => flip.flipNext(),
    }) : undefined;

    return () => {
      detachSwipe?.();
      handleRef.current = null;
      // page-flip never stops its drawing loop; mute it so it cannot keep
      // restyling these pages after teardown.
      flip.getRender().render = () => {};
      flip.destroy();
      // destroy() also removes the pages and this container from the DOM.
      // Put back exactly what React rendered so the effect can run again.
      pages.forEach((page, i) => {
        page.className = pageClasses[i];
        page.removeAttribute('style');
        container.appendChild(page);
      });
      if (container.parentElement !== viewport) viewport.appendChild(container);
    };
    // The parent keys this component by the complete measured layout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = {
    width: pageW * (singlePage ? 1 : 2), height: pageH,
    '--page-w': `${pageW}px`, '--page-h': `${pageH}px`,
  } as CSSProperties;
  // page-flip owns the inner node; React owns this outer wrapper, so teardown
  // cannot remove a node that React is itself in the process of replacing.
  return (
    <div className="book-viewport" style={style} data-closed={closed && !singlePage ? 'true' : undefined}>
      <div ref={containerRef} className="book-flipper" style={{ width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}
