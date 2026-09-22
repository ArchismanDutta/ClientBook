export function PagePlaceholder({ pageNumber }: { pageNumber: number }) {
  return (
    <div className="page page-placeholder" data-kind="placeholder">
      <div className="page-body" style={{ opacity: .35, display: 'grid', placeItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24 }}>{pageNumber}</span>
      </div>
    </div>
  );
}
