import { useMemo, type CSSProperties, type ReactNode } from 'react';
import type { InlineRun } from '../types/book';
import type { Highlight } from '../lib/highlights/types';
import { makeHlKey } from '../lib/highlights/store';
import { useHighlights } from './HighlightsProvider';
import { usePageContext } from './PageContext';

type Segment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
  hl?: Highlight;
};

type Tag = 'p' | 'span' | 'li' | 'td' | 'th' | 'h1' | 'h2' | 'figcaption';

// A unit of book text that can carry highlights. It renders as `as`, tagged with
// `data-hl-key` so the selection handler in HighlightsProvider can find it and
// map a DOM selection back to character offsets in `runs`.
//
// `scope` distinguishes kinds of content (list item, table cell, …) so equal
// text in different places does not share highlights.
export function Highlightable({
  as: Tag,
  runs,
  scope = '',
  className,
  style,
  attrs,
}: {
  as: Tag;
  runs: InlineRun[];
  scope?: string;
  className?: string;
  style?: CSSProperties;
  attrs?: Record<string, string | undefined>;
}) {
  const pageCtx = usePageContext();
  const { mode, getForKey } = useHighlights();

  const plainText = useMemo(() => runs.map(r => r.text).join(''), [runs]);
  // Paragraphs keep the unscoped key so highlights saved before scopes existed still match.
  const hlKey = pageCtx ? makeHlKey(pageCtx.sectionId, scope ? `${scope}\u0000${plainText}` : plainText) : '';
  const myHighlights = hlKey ? getForKey(hlKey) : [];

  const segments = useMemo(() => buildSegments(runs, myHighlights), [runs, myHighlights]);

  const classes = [className, mode ? 'is-highlight-mode' : ''].filter(Boolean).join(' ') || undefined;

  return (
    <Tag className={classes} style={style} data-hl-key={hlKey || undefined} {...attrs}>
      {segments.map(renderSegment)}
    </Tag>
  );
}

export function textRuns(text: string): InlineRun[] {
  return [{ text }];
}

function renderSegment(seg: Segment, i: number) {
  let node: ReactNode = seg.text;
  if (seg.bold) node = <strong>{node}</strong>;
  if (seg.italic) node = <em>{node}</em>;
  if (seg.href) node = <a href={seg.href} target="_blank" rel="noreferrer">{node}</a>;

  if (seg.hl) {
    const hl = seg.hl;
    // Clicks on marks are handled by HighlightsProvider, which claims them
    // before page-flip can read them as a page turn.
    return (
      <mark
        key={i}
        className={`hl hl-${hl.color}${hl.comment ? ' has-comment' : ''}`}
        data-highlight-id={hl.id}
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
  const boundaries = new Set<number>();
  for (const h of highlights) {
    boundaries.add(h.startOffset);
    boundaries.add(h.endOffset);
  }

  const segments: Segment[] = [];
  let runStart = 0;
  for (const run of runs) {
    const runEnd = runStart + run.text.length;
    const cuts = [runStart, runEnd, ...Array.from(boundaries).filter(b => b > runStart && b < runEnd)];
    cuts.sort((a, b) => a - b);

    for (let ci = 0; ci < cuts.length - 1; ci++) {
      const from = cuts[ci];
      const to = cuts[ci + 1];
      segments.push({
        text: run.text.slice(from - runStart, to - runStart),
        bold: run.bold,
        italic: run.italic,
        href: run.href,
        hl: highlights.find(h => h.startOffset <= from && h.endOffset >= to),
      });
    }
    runStart = runEnd;
  }

  // Drop empty segments (can occur if boundaries coincide with run edges).
  return segments.filter(s => s.text.length > 0);
}
