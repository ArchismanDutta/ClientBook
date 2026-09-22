import { parseFragment, serialize, DefaultTreeAdapterMap } from 'parse5';
import type { Block, InlineRun } from '../../src/types/book';
import { htmlToRuns } from './inline-runs';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];
type DocumentFragment = DefaultTreeAdapterMap['documentFragment'];

const CALLOUT_MAX_WORDS = 6;

export function htmlToBlocks(html: string): Block[] {
  const doc = parseFragment(html) as unknown as Element;
  const raw: Block[] = [];
  for (const child of doc.childNodes) {
    if (child.nodeName === '#text') continue;
    const el = child as Element;
    const b = elementToBlock(el);
    if (b) raw.push(...b);
  }
  return mergeCallouts(raw);
}

function elementToBlock(el: Element): Block[] | null {
  const tag = el.tagName;
  const inner = childrenHtml(el);
  if (tag === 'h1' || tag === 'h2') {
    const text = textOf(el).trim();
    return [{
      type: 'heading',
      level: tag === 'h1' ? 1 : 2,
      text,
      id: slug(text),
    }];
  }
  if (tag === 'p') {
    const runs = htmlToRuns(inner);
    if (runs.every((r) => r.text.trim() === '')) return null;
    return [{ type: 'para', runs }];
  }
  if (tag === 'ul' || tag === 'ol') {
    const items: InlineRun[][] = [];
    for (const li of el.childNodes) {
      if (li.nodeName !== 'li') continue;
      items.push(htmlToRuns(childrenHtml(li as Element)));
    }
    return [{ type: 'list', style: tag === 'ol' ? 'number' : 'bullet', items }];
  }
  if (tag === 'table') {
    const calloutBlocks = tryCalloutFromTable(el);
    if (calloutBlocks) return calloutBlocks;
    return [tableFromEl(el)];
  }
  if (tag === 'img') {
    const src = attr(el, 'src') ?? '';
    const alt = attr(el, 'alt') ?? '';
    const w = Number(attr(el, 'width') ?? 0);
    const h = Number(attr(el, 'height') ?? 0);
    return [{ type: 'image', src: '/' + src.replace(/^\//, ''), alt, w, h }];
  }
  return null;
}

function tryCalloutFromTable(el: Element): Block[] | null {
  const trs = findAll(el, 'tr');
  if (trs.length !== 1) return null;
  const tds = findAll(trs[0], 'td');
  if (tds.length !== 1) return null;
  // Collect direct paragraph children of the cell without invoking the callout merger.
  const paras: InlineRun[][] = [];
  for (const child of tds[0].childNodes) {
    if (child.nodeName === '#text') continue;
    const c = child as Element;
    if (c.tagName === 'p') paras.push(htmlToRuns(childrenHtml(c)));
  }
  if (paras.length < 2) return null;
  const label = paras[0].map((r) => r.text).join('').trim();
  const isLabel =
    label.length > 0 &&
    label === label.toUpperCase() &&
    /[A-Z]/.test(label) &&
    label.split(/\s+/).length <= CALLOUT_MAX_WORDS;
  if (!isLabel) return null;
  // If there are 2+ body paragraphs, join them with a paragraph break (double newline via space).
  // For now we take the second paragraph as the body; subsequent paragraphs (if any) are emitted as regular paragraphs after.
  const body = paras[1];
  const rest: Block[] = [];
  for (let i = 2; i < paras.length; i++) rest.push({ type: 'para', runs: paras[i] });
  return [{ type: 'callout', label, body }, ...rest];
}

function tableFromEl(el: Element): Block {
  const rowsRaw: string[][] = [];
  const boldFlags: boolean[] = [];
  const trs = findAll(el, 'tr');
  for (const tr of trs) {
    const cells = findAll(tr, 'td').concat(findAll(tr, 'th'));
    const rowText = cells.map((c) => textOf(c).trim());
    const rowBold = cells.every((c) => findAll(c, 'strong').length > 0 || findAll(c, 'b').length > 0);
    rowsRaw.push(rowText);
    boldFlags.push(rowBold);
  }
  if (rowsRaw.length > 0 && boldFlags[0]) {
    return { type: 'table', header: rowsRaw[0], rows: rowsRaw.slice(1) };
  }
  return { type: 'table', rows: rowsRaw };
}

function mergeCallouts(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'para') {
      const text = b.runs.map((r) => r.text).join('').trim();
      const isLabel =
        text.length > 0 &&
        text === text.toUpperCase() &&
        /[A-Z]/.test(text) &&
        text.split(/\s+/).length <= CALLOUT_MAX_WORDS;
      const next = blocks[i + 1];
      if (isLabel && next && next.type === 'para') {
        out.push({ type: 'callout', label: text, body: next.runs });
        i++; // skip next
        continue;
      }
    }
    out.push(b);
  }
  return out;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function attr(el: Element, name: string): string | undefined {
  return el.attrs.find((a) => a.name === name)?.value;
}

function textOf(node: Node): string {
  let s = '';
  if ('childNodes' in node && node.childNodes) {
    for (const c of node.childNodes) {
      if (c.nodeName === '#text') s += (c as unknown as { value: string }).value;
      else s += textOf(c);
    }
  }
  return s;
}

function childrenHtml(el: Element): string {
  // parse5's `serialize` takes a parent node and serializes its children.
  // For an Element, this returns just the inner HTML — exactly what we need.
  return serialize(el as unknown as DocumentFragment);
}

function findAll(root: Element, tagName: string): Element[] {
  const out: Element[] = [];
  function visit(node: Node) {
    if ('childNodes' in node && node.childNodes) {
      for (const c of node.childNodes) {
        if (c.nodeName === '#text') continue;
        const el = c as Element;
        if (el.tagName === tagName) out.push(el);
        visit(el);
      }
    }
  }
  visit(root);
  return out;
}
