import type { Block, InlineRun, Page, Section } from '../../types/book';
import { createPageMeasurer, type PageDims } from './measure';
import type { TocEntry } from '../../components/TableOfContents';

// Slice text without dropping the source's bold, italic or link formatting.
function sliceRuns(runs: InlineRun[], start: number, end: number): InlineRun[] {
  let offset = 0;
  return runs.flatMap(run => {
    const from = Math.max(0, start - offset);
    const to = Math.min(run.text.length, end - offset);
    offset += run.text.length;
    return to > from ? [{ ...run, text: run.text.slice(from, to) }] : [];
  });
}

// Same as sliceRuns, for the cells of a table row read as one continuous text.
function sliceCells(cells: string[], start: number, end: number): string[] {
  let offset = 0;
  return cells.map(cell => {
    const from = Math.max(0, start - offset);
    const to = Math.min(cell.length, end - offset);
    offset += cell.length;
    return to > from ? cell.slice(from, to) : '';
  });
}

const wordEnds = (text: string) => [...text.matchAll(/\S+\s*/g)].map(match => match.index! + match[0].length);

// The largest n in 1..count-1 whose first part still fits, or null.
function bestSplit(count: number, split: (n: number) => [Block, Block], fits: (block: Block) => boolean) {
  let low = 1, high = count - 1, best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (fits(split(mid)[0])) { best = mid; low = mid + 1; }
    else high = mid - 1;
  }
  return best ? split(best) : null;
}

// Split one indivisible unit (a single table row, list item or callout) at a word,
// so content taller than a page continues overleaf instead of scrolling.
function splitWithinUnit(block: Block, fits: (block: Block) => boolean): [Block, Block] | null {
  if (block.type === 'table' && block.rows.length === 1) {
    const cells = block.rows[0];
    const total = cells.join('').length;
    const ends = wordEnds(cells.join(''));
    return bestSplit(ends.length, n => [
      { ...block, rows: [sliceCells(cells, 0, ends[n - 1])] },
      { ...block, rows: [sliceCells(cells, ends[n - 1], total)] },
    ], fits);
  }
  if (block.type === 'list' && block.items.length === 1) {
    const runs = block.items[0];
    const total = runs.map(run => run.text).join('').length;
    const ends = wordEnds(runs.map(run => run.text).join(''));
    return bestSplit(ends.length, n => [
      { ...block, items: [sliceRuns(runs, 0, ends[n - 1])] },
      { ...block, items: [sliceRuns(runs, ends[n - 1], total)], continued: true },
    ], fits);
  }
  if (block.type === 'callout') {
    const total = block.body.map(run => run.text).join('').length;
    const ends = wordEnds(block.body.map(run => run.text).join(''));
    return bestSplit(ends.length, n => [
      { ...block, body: sliceRuns(block.body, 0, ends[n - 1]) },
      { ...block, body: sliceRuns(block.body, ends[n - 1], total) },
    ], fits);
  }
  return null;
}

function splitToFit(block: Block, fits: (block: Block) => boolean): [Block, Block] | null {
  let count: number;
  let split: (n: number) => [Block, Block];
  if (block.type === 'list') {
    count = block.items.length;
    split = n => [
      { ...block, items: block.items.slice(0, n) },
      { ...block, items: block.items.slice(n), start: (block.start ?? 1) + n },
    ];
  } else if (block.type === 'table') {
    count = block.rows.length;
    split = n => [{ ...block, rows: block.rows.slice(0, n) }, { ...block, rows: block.rows.slice(n) }];
  } else if (block.type === 'para') {
    const text = block.runs.map(run => run.text).join('');
    const ends = wordEnds(text);
    count = ends.length;
    split = n => [
      { ...block, runs: sliceRuns(block.runs, 0, ends[n - 1]) },
      { ...block, runs: sliceRuns(block.runs, ends[n - 1], text.length) },
    ];
  } else return null;

  return bestSplit(count, split, fits);
}

export function paginate(sections: Section[], dims: PageDims): Page[] {
  const pages: Page[] = [];
  const measure = createPageMeasurer(dims);
  try {
    for (const section of sections) {
      const pending: Block[] = [{ type: 'heading', level: 1, text: section.title, id: section.id }, ...section.blocks];
      let blocks: Block[] = [];
      let opener = true;
      const page = (content: Block[]): Page => ({
        blocks: content, sectionId: section.id, sectionTitle: section.title,
        pageNumber: pages.length + 1, opener: opener || undefined,
        kind: opener ? 'opener' : 'body',
      });
      const fits = (content: Block[]) => measure.fitsPage(page(content));
      const commit = (overflow = false) => {
        if (!blocks.length) return;
        pages.push({ ...page(blocks), overflow: overflow || undefined });
        blocks = [];
        opener = false;
      };

      while (pending.length) {
        const block = pending.shift()!;
        if (fits([...blocks, block])) { blocks.push(block); continue; }
        const split = splitToFit(block, first => fits([...blocks, first]));
        if (split) {
          blocks.push(split[0]);
          commit();
          pending.unshift(split[1]);
          continue;
        }
        // Carry headings forward with their first content, never strand them.
        const headings: Block[] = [];
        while (blocks.at(-1)?.type === 'heading') headings.unshift(blocks.pop()!);
        if (blocks.length) {
          commit();
          pending.unshift(...headings, block);
        } else {
          // Not even one row or item fits beneath the headings.
          let first = block;
          if (block.type === 'table' && block.rows.length > 1) {
            first = { ...block, rows: block.rows.slice(0, 1) };
            pending.unshift({ ...block, rows: block.rows.slice(1) });
          } else if (block.type === 'list' && block.items.length > 1) {
            first = { ...block, items: block.items.slice(0, 1) };
            pending.unshift({ ...block, items: block.items.slice(1), start: (block.start ?? 1) + 1 });
          }
          // A chapter title may stand alone on its opener page if the row then fits overleaf.
          if (opener && headings.length && fits([first])) {
            blocks = headings;
            commit();
            pending.unshift(first);
            continue;
          }
          const within = splitWithinUnit(first, part => fits([...headings, part]));
          if (within) {
            blocks = [...headings, within[0]];
            commit();
            pending.unshift(within[1]);
            continue;
          }
          if (headings.length) {
            blocks = headings;
            commit();
            pending.unshift(first);
            continue;
          }
          // Last resort for content that cannot be divided at all: keep it reachable.
          blocks = [first];
          commit(true);
        }
      }
      commit();
    }
  } finally { measure.dispose(); }
  return pages;
}

export function paginateToc(entries: TocEntry[], dims: PageDims): TocEntry[][] {
  const result: TocEntry[][] = [];
  const measure = createPageMeasurer(dims);
  let current: TocEntry[] = [];
  try {
    for (const entry of entries) {
      if (current.length && !measure.fitsToc([...current, entry])) {
        result.push(current);
        current = [];
      }
      current.push(entry);
    }
    if (current.length) result.push(current);
  } finally { measure.dispose(); }
  return result;
}
