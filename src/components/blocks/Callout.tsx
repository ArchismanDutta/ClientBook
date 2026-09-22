import type { CalloutBlock, InlineRun } from '../../types/book';

export function Callout({ block }: { block: CalloutBlock }) {
  return (
    <aside className="callout">
      <span className="callout-label">{block.label}</span>
      <span className="callout-body">{block.body.map((r, i) => renderRun(r, i))}</span>
    </aside>
  );
}
function renderRun(r: InlineRun, i: number) {
  let node: React.ReactNode = r.text;
  if (r.bold) node = <strong key={i}>{node}</strong>;
  if (r.italic) node = <em key={i}>{node}</em>;
  return <span key={i}>{node}</span>;
}
