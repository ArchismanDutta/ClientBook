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
    const ends = [...text.matchAll(/\S+\s*/g)].map(match => match.index! + match[0].length);
    count = ends.length;
    split = n => [
      { ...block, runs: sliceRuns(block.runs, 0, ends[n - 1]) },
      { ...block, runs: sliceRuns(block.runs, ends[n - 1], text.length) },
    ];
  } else return null;

  let low = 1, high = count - 1, best = 0;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (fits(split(mid)[0])) { best = mid; low = mid + 1; }
    else high = mid - 1;
  }
  return best ? split(best) : null;
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
          // A single unbreakable item (e.g. a tall table row) stays accessible.
          let first = block;
          if (block.type === 'table' && block.rows.length > 1) {
            first = { ...block, rows: block.rows.slice(0, 1) };
            pending.unshift({ ...block, rows: block.rows.slice(1) });
          } else if (block.type === 'list' && block.items.length > 1) {
            first = { ...block, items: block.items.slice(0, 1) };
            pending.unshift({ ...block, items: block.items.slice(1), start: (block.start ?? 1) + 1 });
          }
          blocks = [...headings, first];
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
