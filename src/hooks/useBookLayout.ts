import { useEffect, useState } from 'react';

export function getBookLayout(width: number, height: number) {
  const singlePage = width < 960;
  const gutter = width < 600 ? 12 : 28;
  const availableHeight = height - (width < 600 ? 170 : 180);
  const pageW = singlePage
    ? Math.min(560, width - gutter * 2)
    : Math.floor(Math.min(600, (width - gutter * 2) / 2, Math.max(560, availableHeight) / 1.4));
  const pageH = singlePage
    ? Math.round(Math.max(540, Math.min(840, availableHeight)))
    : Math.round(pageW * 1.4);
  return { pageW, pageH, singlePage };
}

export function useBookLayout() {
  const readLayout = () => getBookLayout(document.documentElement.clientWidth || window.innerWidth, document.documentElement.clientHeight || window.innerHeight);
  const [layout, setLayout] = useState(readLayout);
  useEffect(() => {
    let timer: number;
    const update = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const next = readLayout();
        setLayout(prev => prev.pageW === next.pageW && prev.pageH === next.pageH && prev.singlePage === next.singlePage ? prev : next);
      }, 180);
    };
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('resize', update); window.clearTimeout(timer); };
  }, []);
  return layout;
}
