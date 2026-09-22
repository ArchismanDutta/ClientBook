import { describe, it, expect } from 'vitest';
import { splitParagraph, wouldOrphan, isKeepWithNext } from './rules';
import type { Block, ParaBlock } from '../../types/book';

describe('splitParagraph', () => {
  it('splits at the nearest sentence boundary to `cutRatio`', () => {
    const p: ParaBlock = {
      type: 'para',
      runs: [{ text: 'Alpha. Beta. Gamma. Delta.' }],
    };
    const { first, rest } = splitParagraph(p, 0.5);
    expect(first.runs.map(r => r.text).join('')).toBe('Alpha. Beta.');
    expect(rest.runs.map(r => r.text).join('')).toBe(' Gamma. Delta.');
  });

  it('does not split if only one sentence', () => {
    const p: ParaBlock = { type: 'para', runs: [{ text: 'One long thought without period at end' }] };
    const { first, rest } = splitParagraph(p, 0.5);
    expect(first.runs.map(r => r.text).join('')).toBe('One long thought without period at end');
    expect(rest.runs.map(r => r.text).join('')).toBe('');
  });
});

describe('wouldOrphan', () => {
  it('true when a heading is the last block on a page', () => {
    const blocks: Block[] = [{ type: 'heading', level: 2, text: 'X', id: 'x' }];
    expect(wouldOrphan(blocks)).toBe(true);
  });

  it('false when a heading is followed by content', () => {
    const blocks: Block[] = [
      { type: 'heading', level: 2, text: 'X', id: 'x' },
      { type: 'para', runs: [{ text: 'body' }] },
    ];
    expect(wouldOrphan(blocks)).toBe(false);
  });

  it('false for a body block last', () => {
    const blocks: Block[] = [{ type: 'para', runs: [{ text: 'body' }] }];
    expect(wouldOrphan(blocks)).toBe(false);
  });
});

describe('isKeepWithNext', () => {
  it('true for headings', () => {
    expect(isKeepWithNext({ type: 'heading', level: 1, text: 'X', id: 'x' })).toBe(true);
  });
  it('false for paragraphs', () => {
    expect(isKeepWithNext({ type: 'para', runs: [] })).toBe(false);
  });
});
