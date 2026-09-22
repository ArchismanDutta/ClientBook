import { act, render } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { CommentPopupHost } from './CommentPopup';
import { HighlightsProvider, useHighlights } from './HighlightsProvider';
import { PageContextProvider } from './PageContext';
import { BlockRenderer } from './blocks/BlockRenderer';
import type { Block } from '../types/book';

// Highlight mode starts on; tests can turn it off through this handle.
const modeRef: { current: ((v: boolean) => void) | null } = { current: null };

function HighlightModeOn() {
  const { setMode } = useHighlights();
  const started = useRef(false);
  modeRef.current = setMode;
  useEffect(() => { if (!started.current) { started.current = true; setMode(true); } }, [setMode]);
  return null;
}

const blocks: Block[] = [
  { type: 'heading', level: 2, text: 'Scope of work', id: 'h' },
  { type: 'para', runs: [{ text: 'Plain intro ' }, { text: 'bold bit', bold: true }] },
  { type: 'list', style: 'bullet', items: [[{ text: 'First item' }], [{ text: 'Second item' }]] },
  { type: 'table', header: ['Name', 'Owner'], rows: [['Platform', 'Yes'], ['Mobile', 'Yes']] },
  { type: 'callout', label: 'Note', body: [{ text: 'Callout body text' }] },
];

function renderBook() {
  return render(
    <HighlightsProvider>
      <HighlightModeOn />
      <div className="book-flipper">
        <PageContextProvider sectionId="s1" pageNumber={1}>
          {blocks.map((b, i) => <BlockRenderer key={i} block={b} />)}
        </PageContextProvider>
      </div>
      <CommentPopupHost />
    </HighlightsProvider>,
  );
}

function textNode(container: HTMLElement, text: string): Text {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (walker.currentNode.textContent?.includes(text)) return walker.currentNode as Text;
  }
  throw new Error(`no text node containing "${text}"`);
}

function select(start: Text, startOffset: number, end: Text, endOffset: number) {
  const range = document.createRange();
  range.setStart(start, startOffset);
  range.setEnd(end, endOffset);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);
  act(() => { document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); });
}

const marks = (c: HTMLElement) => Array.from(c.querySelectorAll('mark.hl')).map(m => m.textContent);

describe('highlighting any book content', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom has no layout, so ranges have no geometry.
    Range.prototype.getBoundingClientRect ??= () => new DOMRect();
  });

  it.each([
    ['heading', 'Scope of work', 0, 5, 'Scope'],
    ['list item', 'Second item', 0, 6, 'Second'],
    ['table cell', 'Platform', 0, 4, 'Plat'],
    ['callout', 'Callout body text', 8, 12, 'body'],
  ])('highlights text in a %s', (_kind, text, from, to, expected) => {
    const { container } = renderBook();
    const node = textNode(container, text);
    select(node, from, node, to);
    expect(marks(container)).toEqual([expected]);
  });

  it('keeps equal table cells in different rows apart', () => {
    const { container } = renderBook();
    const cells = Array.from(container.querySelectorAll('td')).filter(td => td.textContent === 'Yes');
    const node = cells[1].firstChild!.firstChild as Text;
    select(node, 0, node, 3);
    expect(cells[0].querySelector('mark')).toBeNull();
    expect(cells[1].querySelector('mark')?.textContent).toBe('Yes');
  });

  it.each([true, false])('opens the note on a click without turning the page (highlight mode: %s)', (modeOn) => {
    const { container } = renderBook();
    const node = textNode(container, 'Plain intro');
    select(node, 0, node, 5);
    if (!modeOn) act(() => { modeRef.current!(false); });

    // page-flip starts a page turn from mousedown on its own container.
    const flipper = container.querySelector('.book-flipper')!;
    const flip = vi.fn();
    flipper.addEventListener('mousedown', flip);
    flipper.addEventListener('click', flip);

    const mark = container.querySelector('mark.hl')!;
    act(() => {
      mark.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      mark.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(flip).not.toHaveBeenCalled();
    expect(document.querySelector('.comment-popup')).not.toBeNull();
  });

  it('splits a selection across blocks into one grouped highlight', () => {
    const { container } = renderBook();
    select(textNode(container, 'Scope of work'), 6, textNode(container, 'First item'), 5);
    expect(marks(container)).toEqual(['of work', 'Plain intro ', 'bold bit', 'First']);

    const stored = JSON.parse(localStorage.getItem('preneur-gate:highlights:v1')!);
    expect(stored).toHaveLength(3);
    expect(new Set(stored.map((h: { groupId: string }) => h.groupId)).size).toBe(1);
  });
});
