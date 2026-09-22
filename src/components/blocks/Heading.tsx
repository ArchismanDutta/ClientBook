import type { HeadingBlock } from '../../types/book';
import { Highlightable, textRuns } from '../Highlightable';

export function Heading({ block }: { block: HeadingBlock }) {
  if (block.level === 1) return <Highlightable as="h1" className="h1" scope="h" runs={textRuns(block.text)} />;
  return <Highlightable as="h2" className="h2" scope="h" runs={textRuns(block.text)} />;
}
