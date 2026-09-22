import type { TableBlock } from '../../types/book';
import { Highlightable, textRuns } from '../Highlightable';

export function Table({ block }: { block: TableBlock }) {
  return (
    <table className={`table${(block.header?.length ?? 0) >= 3 ? ' table-wide' : ''}`}>
      {block.header && (
        <thead>
          <tr>{block.header.map((h, i) => <Highlightable key={i} as="th" scope={`th:${i}`} runs={textRuns(h)} />)}</tr>
        </thead>
      )}
      <tbody>
        {block.rows.map((r, i) => {
          // Rows never split across pages, so the row's text keeps cell keys stable
          // under re-pagination while telling apart equal cells in different rows.
          const rowScope = `td:${r.join('\u0001')}`;
          return (
            <tr key={i}>
              {r.map((c, j) => (
                <Highlightable key={j} as="td" scope={`${rowScope}:${j}`} runs={textRuns(c)} attrs={{ 'data-label': block.header?.[j] }} />
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
