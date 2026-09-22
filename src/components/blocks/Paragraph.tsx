import type { ParaBlock } from '../../types/book';
import { Highlightable } from '../Highlightable';

export function Paragraph({ block }: { block: ParaBlock }) {
  return <Highlightable as="p" className="para" runs={block.runs} />;
}
