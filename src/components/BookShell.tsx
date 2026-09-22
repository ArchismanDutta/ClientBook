import { useEffect, useRef, type CSSProperties } from 'react';
import { PageFlip } from 'page-flip';

export type BookShellHandle = {
  next: () => void;
  prev: () => void;
  turnTo: (pageIndex: number) => void;
  getCurrent: () => number;
  getTotal: () => number;
};

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
      useMouseEvents: true, mobileScrollSupport: false,
      disableFlipByClick: singlePage || !clickToFlip, showPageCorners: !singlePage,
      swipeDistance: 40,
    });
    // page-flip reads its settings on every click, so the front and back covers
    // can always open with a plain click even when inner pages only turn from
    // their corners.
    const syncClickToFlip = (index: number) => {
      const onCover = index === 0 || index === flip.getPageCount() - 1;
      flip.getSettings().disableFlipByClick = singlePage || (!clickToFlip && !onCover);
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
    return () => {
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
