import { useMemo, useRef, type MouseEvent } from 'react';
import type { InlineRun, ParaBlock } from '../../types/book';
import type { Highlight } from '../../lib/highlights/types';
import { makeHlKey } from '../../lib/highlights/store';
import { useHighlights } from '../HighlightsProvider';
import { usePageContext } from '../PageContext';

type Segment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
  hl?: Highlight;
};

export function Paragraph({ block }: { block: ParaBlock }) {
  const pageCtx = usePageContext();
  const { mode, color, addHighlight, openPopup, getForKey } = useHighlights();
  const paraRef = useRef<HTMLParagraphElement>(null);

  const plainText = useMemo(
    () => block.runs.map(r => r.text).join(''),
    [block.runs],
  );

  const hlKey = pageCtx ? makeHlKey(pageCtx.sectionId, plainText) : '';
  const myHighlights = hlKey ? getForKey(hlKey) : [];

  const segments = useMemo(
    () => buildSegments(block.runs, myHighlights),
    [block.runs, myHighlights],
  );

  const onMouseUp = (e: MouseEvent<HTMLParagraphElement>) => {
    if (!mode || !hlKey) return;
    const paraEl = paraRef.current;
    if (!paraEl) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // Selection must be inside this paragraph only.
    if (!paraEl.contains(range.startContainer) || !paraEl.contains(range.endContainer)) return;

    const start = textOffsetOf(paraEl, range.startContainer, range.startOffset);
    const end = textOffsetOf(paraEl, range.endContainer, range.endOffset);
    if (start < 0 || end < 0 || end <= start) return;

    const selectedText = plainText.slice(start, end).trim();
    if (!selectedText) return;

    // Snapshot the range's rect BEFORE we clear the selection.
    const anchorRect = range.getBoundingClientRect();

    const created = addHighlight({
      hlKey,
      startOffset: start,
      endOffset: end,
      text: plainText.slice(start, end),
      color,
    });

    sel.removeAllRanges();

    // Open the popup immediately, anchored at the selection's rect.
    // rAF avoids reading a stale rect before the next commit.
    requestAnimationFrame(() => {
      openPopup({ highlightId: created.id, anchor: anchorRect });
    });

    // Prevent the click-to-flip behavior from firing right after the selection.
    e.stopPropagation();
  };

  // In highlight mode, absorb clicks so page-flip's click-to-turn does not fire.
  const onClickAbsorb = mode
    ? (e: MouseEvent<HTMLParagraphElement>) => e.stopPropagation()
    : undefined;

  return (
    <p
      ref={paraRef}
      className={`para ${mode ? 'is-highlight-mode' : ''}`}
      onMouseUp={onMouseUp}
      onClick={onClickAbsorb}
    >
      {segments.map((seg, i) => renderSegment(seg, i, openPopup))}
    </p>
  );
}

function renderSegment(
  seg: Segment,
  i: number,
  openPopup: ReturnType<typeof useHighlights>['openPopup'],
) {
  let node: React.ReactNode = seg.text;
  if (seg.bold) node = <strong>{node}</strong>;
  if (seg.italic) node = <em>{node}</em>;
  if (seg.href) node = <a href={seg.href} target="_blank" rel="noreferrer">{node}</a>;

  if (seg.hl) {
    const hl = seg.hl;
    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      openPopup({ highlightId: hl.id, anchor: rect });
    };
    return (
      <mark
        key={i}
        className={`hl hl-${hl.color}${hl.comment ? ' has-comment' : ''}`}
        data-highlight-id={hl.id}
        onClick={handleClick}
        title={hl.comment ? hl.comment.text : 'Click to add a note'}
      >
        {node}
      </mark>
    );
  }
  return <span key={i}>{node}</span>;
}

// Split runs into segments broken at every highlight boundary.
function buildSegments(runs: InlineRun[], highlights: Highlight[]): Segment[] {
  // Compute per-run offsets in the paragraph plain text.
  const runOffsets: number[] = [];
  let offset = 0;
  for (const r of runs) {
    runOffsets.push(offset);
    offset += r.text.length;
  }

  const boundaries = new Set<number>();
  for (const h of highlights) {
    boundaries.add(h.startOffset);
    boundaries.add(h.endOffset);
  }

  const segments: Segment[] = [];
  for (let ri = 0; ri < runs.length; ri++) {
    const run = runs[ri];
    const runStart = runOffsets[ri];
    const runEnd = runStart + run.text.length;

    // Collect boundaries within this run.
    const cuts = [runStart, runEnd, ...Array.from(boundaries).filter(b => b > runStart && b < runEnd)];
    cuts.sort((a, b) => a - b);

    for (let ci = 0; ci < cuts.length - 1; ci++) {
      const from = cuts[ci];
      const to = cuts[ci + 1];
      const local = { start: from - runStart, end: to - runStart };
      const activeHl = highlights.find(h => h.startOffset <= from && h.endOffset >= to);
      segments.push({
        text: run.text.slice(local.start, local.end),
        bold: run.bold,
        italic: run.italic,
        href: run.href,
        hl: activeHl,
      });
    }
  }

  // Drop empty segments (can occur if boundaries coincide with run edges).
  return segments.filter(s => s.text.length > 0);
}

// Compute the plain-text character offset within `root` for a given DOM position.
function textOffsetOf(root: HTMLElement, node: Node, offset: number): number {
  let count = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const tn = walker.currentNode as Text;
    if (tn === node) return count + offset;
    // If the target is inside a non-text node whose descendants we've passed:
    // (fallback path; usually the direct text node is found above.)
    count += tn.textContent?.length ?? 0;
  }
  // Fallback for boundary cases (e.g. selection ends at end of element).
  if (root === node) {
    return Math.min(offset, root.textContent?.length ?? 0);
  }
  return count;
}
