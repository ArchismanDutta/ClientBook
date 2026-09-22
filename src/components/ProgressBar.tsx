export function ProgressBar({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const pct = totalPages > 0 ? Math.min(100, Math.max(0, (currentPage / totalPages) * 100)) : 0;
  return (
    <div className="progress-track" aria-hidden>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
