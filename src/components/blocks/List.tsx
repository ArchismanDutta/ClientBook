import type { ListBlock, InlineRun } from '../../types/book';

const COLORS = ['var(--yellow)', 'var(--pink)', 'var(--blue)', 'var(--mint)'];

export function List({ block }: { block: ListBlock }) {
  if (block.style === 'number') {
    return (
      <ol className="list list-number" start={block.start ?? 1} style={{ counterReset: `n ${(block.start ?? 1) - 1}` }}>
        {block.items.map((item, i) => <li key={i}>{item.map((r, j) => renderRun(r, j))}</li>)}
      </ol>
    );
  }
  return (
    <ul className="list list-bullet">
      {block.items.map((item, i) => (
        <li key={i} style={{ ['--bullet' as string]: COLORS[i % COLORS.length] }}>
          {item.map((r, j) => renderRun(r, j))}
        </li>
      ))}
    </ul>
  );
}

function renderRun(r: InlineRun, i: number) {
  let node: React.ReactNode = r.text;
  if (r.bold) node = <strong key={i}>{node}</strong>;
  if (r.italic) node = <em key={i}>{node}</em>;
  return <span key={i}>{node}</span>;
}
