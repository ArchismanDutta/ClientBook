import type { Block, ParaBlock } from '../../types/book';

export function isKeepWithNext(b: Block): boolean {
  return b.type === 'heading';
}

export function isAtomic(b: Block): boolean {
  return b.type === 'callout' || b.type === 'image';
}

export function wouldOrphan(blocksOnPage: Block[]): boolean {
  if (blocksOnPage.length === 0) return false;
  const last = blocksOnPage[blocksOnPage.length - 1];
  return last.type === 'heading';
}

export function splitParagraph(p: ParaBlock, cutRatio: number): { first: ParaBlock; rest: ParaBlock } {
  const fullText = p.runs.map((r) => r.text).join('');
  const targetIdx = Math.floor(fullText.length * cutRatio);

  const sentenceEnds: number[] = [];
  const re = /[.!?](\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fullText)) !== null) sentenceEnds.push(m.index + 1);

  if (sentenceEnds.length === 0) {
    return { first: p, rest: { type: 'para', runs: [{ text: '' }] } };
  }

  let cutAt = sentenceEnds[0];
  for (const idx of sentenceEnds) {
    if (Math.abs(idx - targetIdx) < Math.abs(cutAt - targetIdx)) cutAt = idx;
  }

  const firstText = fullText.slice(0, cutAt);
  const restText = fullText.slice(cutAt);

  const first: ParaBlock = { type: 'para', runs: [{ text: firstText }] };
  const rest: ParaBlock = { type: 'para', runs: [{ text: restText }] };
  return { first, rest };
}
