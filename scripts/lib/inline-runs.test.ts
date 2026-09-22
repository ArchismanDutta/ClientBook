import { describe, it, expect } from 'vitest';
import { htmlToRuns } from './inline-runs';

describe('htmlToRuns', () => {
  it('handles plain text', () => {
    expect(htmlToRuns('Hello world')).toEqual([{ text: 'Hello world' }]);
  });

  it('preserves bold', () => {
    expect(htmlToRuns('Hello <strong>bold</strong> world')).toEqual([
      { text: 'Hello ' },
      { text: 'bold', bold: true },
      { text: ' world' },
    ]);
  });

  it('preserves italic', () => {
    expect(htmlToRuns('Hello <em>ital</em>')).toEqual([
      { text: 'Hello ' },
      { text: 'ital', italic: true },
    ]);
  });

  it('preserves nested bold+italic', () => {
    expect(htmlToRuns('<strong><em>both</em></strong>')).toEqual([
      { text: 'both', bold: true, italic: true },
    ]);
  });

  it('preserves links', () => {
    expect(htmlToRuns('see <a href="https://example.com">here</a>')).toEqual([
      { text: 'see ' },
      { text: 'here', href: 'https://example.com' },
    ]);
  });

  it('decodes entities', () => {
    expect(htmlToRuns('A &amp; B')).toEqual([{ text: 'A & B' }]);
  });

  it('collapses whitespace between adjacent identical runs', () => {
    expect(htmlToRuns('<strong>hi</strong><strong> there</strong>')).toEqual([
      { text: 'hi there', bold: true },
    ]);
  });
});
