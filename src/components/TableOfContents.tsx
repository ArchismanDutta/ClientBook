import type { Page, Section } from '../types/book';

export type TocEntry = { title: string; pageNumber: number; sectionId: string };

export function buildTocEntries(sections: Section[], pages: Page[]): TocEntry[] {
  return sections.flatMap(section => {
    const first = pages.find(page => page.sectionId === section.id);
    return first ? [{ title: section.title, pageNumber: first.pageNumber, sectionId: section.id }] : [];
  });
}

export function TableOfContents({ entries, onJump, index = 0, total = 1 }: {
  entries: TocEntry[];
  onJump: (pageNumber: number) => void;
  index?: number;
  total?: number;
}) {
  return (
    <div className="page toc-page" data-kind="toc">
      <header className="running-head">
        <span>Preneur Gate · SOW</span><span>Index</span>
      </header>
      <div className="page-body">
        <span className="kicker">{index === 0 ? 'Explore the document' : 'Explore the document · continued'}</span>
        <h1 className="h1">Contents.</h1>
        <ol className="toc-list">
          {entries.map(entry => (
            <li key={entry.sectionId}>
              <button className="toc-entry" onClick={() => onJump(entry.pageNumber)}>
                <span className="toc-title">{entry.title}</span>
                <span className="toc-num">{entry.pageNumber}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
      <footer className="page-num"><span>Choose a chapter</span><span>{index + 1} / {total}</span></footer>
    </div>
  );
}
