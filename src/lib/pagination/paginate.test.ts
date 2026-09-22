import { describe, it, expect } from 'vitest';
import { paginate } from './paginate';
import type { Section } from '../../types/book';

describe('paginate', () => {
  it('emits at least one page per section', () => {
    const sections: Section[] = [
      { id: 's1', level: 1, title: 'Chapter One', blocks: [
        { type: 'para', runs: [{ text: 'Hi.' }] },
      ]},
      { id: 's2', level: 1, title: 'Chapter Two', blocks: [
        { type: 'para', runs: [{ text: 'Ho.' }] },
      ]},
    ];
    const pages = paginate(sections, { pageW: 480, pageH: 672 });
    expect(pages.length).toBeGreaterThanOrEqual(2);
    const openers = pages.filter((p) => p.opener);
    expect(openers.length).toBe(2);
  });

  it('assigns sequential page numbers starting at 1', () => {
    const sections: Section[] = [{
      id: 's1', level: 1, title: 'X', blocks: [{ type: 'para', runs: [{ text: 'x' }] }],
    }];
    const pages = paginate(sections, { pageW: 480, pageH: 672 });
    expect(pages[0].pageNumber).toBe(1);
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i].pageNumber).toBe(pages[i - 1].pageNumber + 1);
    }
  });
});

describe('responsive page breaks', () => {
  const dims = { pageW: 320, pageH: 540 };

  it('splits long lists without losing items or restarting numbering', () => {
    const items = Array.from({ length: 75 }, (_, i) => [{ text: `Item ${i + 1}: a retained requirement.` }]);
    const pages = paginate([{ id: 'list', title: 'Requirements', level: 1, blocks: [{ type: 'list', style: 'number', items }] }], dims);
    const lists = pages.flatMap(p => p.blocks).filter(b => b.type === 'list');
    expect(lists.length).toBeGreaterThan(1);
    expect(lists.flatMap(b => b.items)).toEqual(items);
    let start = 1;
    for (const list of lists) {
      expect(list.start ?? 1).toBe(start);
      start += list.items.length;
    }
  });

  it('splits tables at rows and repeats column headings', () => {
    const header = ['Capability', 'Owner'];
    const rows = Array.from({ length: 50 }, (_, i) => [`Requirement ${i}`, 'Platform']);
    const pages = paginate([{ id: 'table', title: 'Scope', level: 1, blocks: [{ type: 'table', header, rows }] }], dims);
    const tables = pages.flatMap(p => p.blocks).filter(b => b.type === 'table');
    expect(tables.length).toBeGreaterThan(1);
    expect(tables.flatMap(b => b.rows)).toEqual(rows);
    for (const table of tables) expect(table.header).toEqual(header);
  });

  it('preserves every character and inline formatting when splitting long paragraphs', () => {
    const runs = [{ text: 'Important requirement. '.repeat(100), bold: true }, { text: 'Linked detail. '.repeat(60), href: 'https://example.com' }];
    const pages = paginate([{ id: 'para', title: 'Details', level: 1, blocks: [{ type: 'para', runs }] }], dims);
    const paragraphs = pages.flatMap(p => p.blocks).filter(b => b.type === 'para');
    expect(paragraphs.length).toBeGreaterThan(1);
    expect(paragraphs.flatMap(b => b.runs).map(r => r.text).join('')).toBe(runs.map(r => r.text).join(''));
    const rendered = paragraphs.flatMap(b => b.runs);
    expect(rendered.filter(r => r.bold).map(r => r.text).join('')).toBe(runs[0].text);
    expect(rendered.filter(r => r.href).map(r => r.text).join('')).toBe(runs[1].text);
  });

  it('keeps subsection headings with the content that follows', () => {
    const pages = paginate([{ id: 'headings', title: 'Chapter', level: 1, blocks: [
      { type: 'para', runs: [{ text: 'An introductory paragraph. '.repeat(14) }] },
      { type: 'heading', level: 2, id: 'next', text: 'Next topic' },
      { type: 'list', style: 'bullet', items: Array.from({ length: 20 }, () => [{ text: 'A complete requirement.' }]) },
    ] }], dims);
    for (const page of pages) expect(page.blocks.at(-1)?.type).not.toBe('heading');
  });

  it('gives a chapter title its own page rather than scrolling when the first row only fits overleaf', () => {
    const rows = [['Module 1', 'Word '.repeat(84)], ['Module 2', 'Short']];
    const pages = paginate([{ id: 'ch', title: 'Chapter', level: 1, blocks: [{ type: 'table', header: ['A', 'B'], rows }] }], dims);
    expect(pages.some(p => p.overflow)).toBe(false);
    expect(pages[0].blocks.map(b => b.type)).toEqual(['heading']);
    expect(pages.flatMap(p => p.blocks.flatMap(b => (b.type === 'table' ? b.rows : [])))).toEqual(rows);
  });

  it('continues a table row taller than a page overleaf instead of scrolling', () => {
    const row = ['Module 1', 'Purpose '.repeat(200), 'Areas '.repeat(200)];
    const pages = paginate([{ id: 'tall', title: 'Tall', level: 1, blocks: [{ type: 'table', header: ['A', 'B', 'C'], rows: [row] }] }], dims);
    expect(pages.length).toBeGreaterThan(2);
    expect(pages.some(p => p.overflow)).toBe(false);
    const parts = pages.flatMap(p => p.blocks.flatMap(b => (b.type === 'table' ? b.rows : [])));
    expect(parts.map(r => r.join('')).join('')).toBe(row.join(''));
  });

  it('continues a list item taller than a page without repeating its marker', () => {
    const item = [{ text: 'A very long requirement. '.repeat(150) }];
    const pages = paginate([{ id: 'li', title: 'Long', level: 1, blocks: [{ type: 'list', style: 'number', start: 4, items: [item] }] }], dims);
    const lists = pages.flatMap(p => p.blocks.filter(b => b.type === 'list'));
    expect(pages.some(p => p.overflow)).toBe(false);
    expect(lists.length).toBeGreaterThan(1);
    expect(lists.map(l => l.continued ?? false)).toEqual([false, ...lists.slice(1).map(() => true)]);
    expect(lists.every(l => l.start === 4)).toBe(true);
    expect(lists.flatMap(l => l.items.flat()).map(r => r.text).join('')).toBe(item[0].text);
  });
});
