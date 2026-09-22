import type { CalloutBlock } from '../../types/book';
import { Highlightable, textRuns } from '../Highlightable';

export function Callout({ block }: { block: CalloutBlock }) {
  return (
    <aside className="callout">
      <Highlightable as="span" className="callout-label" scope="callout-label" runs={textRuns(block.label)} />
      <Highlightable as="span" className="callout-body" scope="callout" runs={block.body} />
    </aside>
  );
}
