import { describe, it, expect } from 'vitest';
import { htmlToBlocks } from './blocks';

describe('htmlToBlocks', () => {
  it('emits headings with stable ids', () => {
    const blocks = htmlToBlocks('<h1>Chapter One</h1>');
    expect(blocks).toEqual([{ type: 'heading', level: 1, text: 'Chapter One', id: 'chapter-one' }]);
  });

  it('emits paragraphs with inline runs', () => {
    const blocks = htmlToBlocks('<p>Hello <strong>world</strong></p>');
    expect(blocks).toEqual([
      { type: 'para', runs: [{ text: 'Hello ' }, { text: 'world', bold: true }] },
    ]);
  });

  it('emits bullet lists', () => {
    const blocks = htmlToBlocks('<ul><li>one</li><li>two</li></ul>');
    expect(blocks).toEqual([
      {
        type: 'list',
        style: 'bullet',
        items: [[{ text: 'one' }], [{ text: 'two' }]],
      },
    ]);
  });

  it('emits numbered lists', () => {
    const blocks = htmlToBlocks('<ol><li>a</li><li>b</li></ol>');
    expect(blocks[0]).toMatchObject({ type: 'list', style: 'number' });
  });

  it('emits tables with a header row when first row is bold', () => {
    const html = '<table><tr><td><strong>H1</strong></td><td><strong>H2</strong></td></tr><tr><td>a</td><td>b</td></tr></table>';
    expect(htmlToBlocks(html)).toEqual([
      { type: 'table', header: ['H1', 'H2'], rows: [['a', 'b']] },
    ]);
  });

  it('merges an UPPERCASE label paragraph with the next paragraph into a callout', () => {
    const html = '<p>IMPORTANT</p><p>Do not do the thing.</p>';
    expect(htmlToBlocks(html)).toEqual([
      { type: 'callout', label: 'IMPORTANT', body: [{ text: 'Do not do the thing.' }] },
    ]);
  });

  it('does not treat long uppercase text as a label', () => {
    const html = '<p>ALL CAPS PARAGRAPHS THAT ARE LONGER THAN SIX WORDS SHOULD STAY PARAGRAPHS</p><p>Next.</p>';
    const blocks = htmlToBlocks(html);
    expect(blocks[0].type).toBe('para');
  });

  it('emits images with resolved src', () => {
    const html = '<img src="assets/book-images/img-abc.webp" alt="fig 1" width="800" height="500" />';
    expect(htmlToBlocks(html)).toEqual([
      { type: 'image', src: '/assets/book-images/img-abc.webp', alt: 'fig 1', w: 800, h: 500 },
    ]);
  });
});
