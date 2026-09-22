import type { TableBlock } from '../../types/book';

export function Table({ block }: { block: TableBlock }) {
  return (
    <table className={`table${(block.header?.length ?? 0) >= 3 ? ' table-wide' : ''}`}>
      {block.header && (
        <thead>
          <tr>{block.header.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
      )}
      <tbody>
        {block.rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j} data-label={block.header?.[j]}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
