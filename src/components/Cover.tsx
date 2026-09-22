import type { Book } from '../types/book';

export function Cover({ book }: { book: Book }) {
  return (
    <div className="cover">
      <header className="cover-top">
        <span>{book.meta.imprint} · Vol. I</span>
        <Barcode />
        <span>MMXXVI · No. 01</span>
      </header>

      <div className="cover-title">
        <h1>
          Preneur<br />
          <span className="cover-it">Gate.</span>
        </h1>
        <p>Gateway to Entrepreneurship — a Statement of Work for the premium learning platform.</p>
      </div>

      <div className="cover-emblem">
        <img src="/assets/logo.png" alt="PreneurGate" />
      </div>

      <div className="cover-bottom">
        <div className="cover-chips">
          <span className="chip chip-pink">3 Modules</span>
          <span className="chip chip-blue">45–60 Days</span>
          <span className="chip chip-yellow">Version {book.meta.version}</span>
        </div>
        <div className="cover-strip">
          <span className="cover-strip-k">{book.subtitle}</span>
          <span className="cover-strip-v">Read Inside →</span>
        </div>
      </div>
    </div>
  );
}

function Barcode() {
  return (
    <span className="barcode" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => <i key={i} />)}
    </span>
  );
}
