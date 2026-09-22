import type { InlineRun } from '../../src/types/book';
import { parseFragment, DefaultTreeAdapterMap } from 'parse5';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

export function htmlToRuns(html: string): InlineRun[] {
  const doc = parseFragment(html);
  const raw: InlineRun[] = [];
  walk(doc as unknown as Element, {}, raw);
  return merge(raw);
}

function walk(node: Node, ctx: Omit<InlineRun, 'text'>, out: InlineRun[]) {
  if ('childNodes' in node && node.childNodes) {
    for (const child of node.childNodes) {
      if (child.nodeName === '#text') {
        // @ts-expect-error parse5 text node
        const text: string = child.value;
        if (text.length > 0) out.push({ text, ...ctx });
        continue;
      }
      const el = child as Element;
      const tag = el.tagName;
      const nextCtx = { ...ctx };
      if (tag === 'strong' || tag === 'b') nextCtx.bold = true;
      if (tag === 'em' || tag === 'i') nextCtx.italic = true;
      if (tag === 'a') {
        const href = el.attrs.find((a) => a.name === 'href')?.value;
        if (href) nextCtx.href = href;
      }
      walk(el, nextCtx, out);
    }
  }
}

function merge(runs: InlineRun[]): InlineRun[] {
  const out: InlineRun[] = [];
  for (const r of runs) {
    const prev = out[out.length - 1];
    if (
      prev &&
      !!prev.bold === !!r.bold &&
      !!prev.italic === !!r.italic &&
      prev.href === r.href
    ) {
      prev.text += r.text;
    } else {
      const clean: InlineRun = { text: r.text };
      if (r.bold) clean.bold = true;
      if (r.italic) clean.italic = true;
      if (r.href) clean.href = r.href;
      out.push(clean);
    }
  }
  return out;
}
