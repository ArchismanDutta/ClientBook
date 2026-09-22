import { describe, it, expect } from 'vitest';
import { measureBlocks } from './measure';
import type { Block } from '../../types/book';

describe('measureBlocks', () => {
  it('returns a positive height for a paragraph', () => {
    const blocks: Block[] = [{ type: 'para', runs: [{ text: 'Hello world.' }] }];
    const heights = measureBlocks(blocks, { pageW: 480, pageH: 672 });
    expect(heights).toHaveLength(1);
    expect(heights[0]).toBeGreaterThan(0);
  });

  it('returns larger height for a longer paragraph', () => {
    const short: Block[] = [{ type: 'para', runs: [{ text: 'Short.' }] }];
    const long: Block[] = [{ type: 'para', runs: [{ text: 'Hello world. '.repeat(60) }] }];
    const [s] = measureBlocks(short, { pageW: 480, pageH: 672 });
    const [l] = measureBlocks(long, { pageW: 480, pageH: 672 });
    expect(l).toBeGreaterThan(s);
  });
});
