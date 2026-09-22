import type { ListBlock } from '../../types/book';
import { Highlightable } from '../Highlightable';

const COLORS = ['var(--yellow)', 'var(--pink)', 'var(--blue)', 'var(--mint)'];

export function List({ block }: { block: ListBlock }) {
  const cont = (i: number) => (block.continued && i === 0 ? 'list-cont' : undefined);
  if (block.style === 'number') {
    return (
      <ol className="list list-number" start={block.start ?? 1} style={{ counterReset: `n ${(block.start ?? 1) - 1}` }}>
        {block.items.map((item, i) => <Highlightable key={i} as="li" scope="li" runs={item} className={cont(i)} />)}
      </ol>
    );
  }
  return (
    <ul className="list list-bullet">
      {block.items.map((item, i) => (
        <Highlightable key={i} as="li" scope="li" runs={item} className={cont(i)} style={{ ['--bullet' as string]: COLORS[i % COLORS.length] }} />
      ))}
    </ul>
  );
}
