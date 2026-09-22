import type { Book } from '../types/book';

export function BackCover({ book, totalPages }: { book: Book; totalPages: number }) {
  const genDate = new Date(book.meta.generatedAt).toISOString().slice(0, 10);
  return (
    <div className="cover" style={{ borderRadius: '16px 8px 8px 16px' }}>
      <div style={{
        margin: 'auto',
        textAlign: 'center',
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        letterSpacing: '.28em',
        textTransform: 'uppercase',
        opacity: .55,
        lineHeight: 2,
      }}>
        <p>{book.title}</p>
        <p>{book.subtitle}</p>
        <p>Version {book.meta.version} · MMXXVI</p>
        <p>{totalPages} pages</p>
        <p style={{ marginTop: 24, opacity: .5 }}>Generated from source DOCX {genDate}</p>
      </div>
    </div>
  );
}
