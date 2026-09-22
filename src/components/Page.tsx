import type { Page as PageT } from '../types/book';
import { BlockRenderer } from './blocks/BlockRenderer';
import { PageContextProvider } from './PageContext';
import { Highlightable, textRuns } from './Highlightable';

export function Page({ page, total }: { page: PageT; total: number }) {
  return (
    <div className="page" data-kind={page.kind}>
      <RunningHead page={page} />
      <PageContextProvider sectionId={page.sectionId} pageNumber={page.pageNumber}>
        <div className={`page-body${page.overflow ? ' page-body-scroll' : ''}`} tabIndex={page.overflow ? 0 : undefined} role={page.overflow ? 'region' : undefined} aria-label={page.overflow ? 'Scrollable page content' : undefined}>
          {page.opener && page.blocks[0]?.type === 'heading' ? (
            <ChapterOpener page={page} />
          ) : (
            page.blocks.map((b, i) => <BlockRenderer key={i} block={b} />)
          )}
        </div>
      </PageContextProvider>
      <PageFooter page={page} total={total} />
    </div>
  );
}

function RunningHead({ page }: { page: PageT }) {
  return (
    <header className="running-head">
      <span>Preneur Gate · SOW</span>
      <Barcode />
      <span>§ {String(page.pageNumber).padStart(2, '0')}</span>
    </header>
  );
}

function Barcode() {
  return (
    <span className="barcode" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => <i key={i} />)}
    </span>
  );
}

function ChapterOpener({ page }: { page: PageT }) {
  const [head, ...rest] = page.blocks;
  if (head.type !== 'heading') return null;
  return (
    <>
      <Highlightable as="span" className="kicker" scope="kicker" runs={textRuns(chapterLabel(page.sectionTitle))} />
      <Highlightable as="h1" className="h1 opener" scope="h" runs={textRuns(head.text)} />
      {rest.map((b, i) => <BlockRenderer key={i} block={b} />)}
    </>
  );
}

function chapterLabel(title: string) {
  const numbered = title.match(/^(\d+)\./);
  if (numbered) return `Chapter ${numbered[1].padStart(2, '0')}`;
  const appendix = title.match(/^Appendix [A-Z]/);
  if (appendix) return appendix[0];
  return title.startsWith('A.') ? 'Document control' : title;
}

function PageFooter({ page, total }: { page: PageT; total: number }) {
  return (
    <footer className="page-num">
      <span>{page.overflow ? 'Scroll to read more' : 'Preneur Gate'}</span>
      <span className="n">{page.pageNumber}</span>
      <span>of {total}</span>
    </footer>
  );
}
