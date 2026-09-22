import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { Block, Page as PageT } from '../../types/book';
import { BlockRenderer } from '../../components/blocks/BlockRenderer';
import { Page } from '../../components/Page';
import { TableOfContents, type TocEntry } from '../../components/TableOfContents';

export type PageDims = { pageW: number; pageH: number };

function estimateHeight(b: Block, dims: PageDims): number {
  const width = Math.max(1, dims.pageW - 64);
  const textHeight = (text: string) => Math.max(1, Math.ceil(text.length * 7 / width)) * 23;
  switch (b.type) {
    case 'heading': return textHeight(b.text) * (b.level === 1 ? 1.8 : 1.2) + 24;
    case 'para': return textHeight(b.runs.map(r => r.text).join('')) + 10;
    case 'list': return b.items.reduce((n, item) => n + textHeight(item.map(r => r.text).join('')) + 5, 16);
    case 'table': return b.rows.reduce((n, row) => n + textHeight(row.join(' ')) + 16, b.header ? 44 : 16);
    case 'callout': return textHeight(b.body.map(r => r.text).join('')) + 64;
    case 'image': return b.w > 0 ? width * b.h / b.w + 36 : 200;
  }
}

// Render the very same page as the reader, including its opener, margins,
// running head and footer. Keep one root for the entire pagination pass.
export function createPageMeasurer(dims: PageDims) {
  const host = document.createElement('div');
  host.className = 'page-measure';
  host.style.cssText = `position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;width:${dims.pageW}px;--page-w:${dims.pageW}px;--page-h:${dims.pageH}px`;
  document.body.appendChild(host);
  const root = createRoot(host);
  const fits = () => {
    const body = host.querySelector<HTMLElement>('.page-body')!;
    if (!body.clientHeight) return null; // jsdom: use deterministic estimates.
    const bottom = body.getBoundingClientRect().bottom;
    return body.scrollHeight <= body.clientHeight + 1 &&
      Array.from(body.children).every(child => child.getBoundingClientRect().bottom <= bottom + .5);
  };
  return {
    fitsPage(page: PageT) {
      flushSync(() => root.render(<Page page={page} total={999} />));
      return fits() ?? page.blocks.reduce((h, block) => h + estimateHeight(block, dims), page.opener ? 36 : 0) <= dims.pageH - 166;
    },
    fitsToc(entries: TocEntry[]) {
      flushSync(() => root.render(<TableOfContents entries={entries} onJump={() => {}} />));
      return fits() ?? entries.reduce((h, entry) => h + Math.ceil(entry.title.length * 8 / (dims.pageW - 90)) * 22 + 16, 80) <= dims.pageH - 166;
    },
    dispose() { root.unmount(); host.remove(); },
  };
}

export function measureBlocks(blocks: Block[], dims: PageDims): number[] {
  const host = document.createElement('div');
  host.className = 'page page-measure';
  host.style.cssText = `position:fixed;left:-10000px;visibility:hidden;--page-w:${dims.pageW}px;--page-h:${dims.pageH}px`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    return blocks.map(block => {
      flushSync(() => root.render(<div className="page-body"><BlockRenderer block={block} /></div>));
      const el = host.querySelector('.page-body')!.firstElementChild as HTMLElement;
      const rect = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return Math.ceil(rect.height ? rect.height + parseFloat(css.marginTop || '0') + parseFloat(css.marginBottom || '0') : estimateHeight(block, dims));
    });
  } finally { root.unmount(); host.remove(); }
}
