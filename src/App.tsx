import { useEffect, useMemo, useRef, useState } from 'react';
import bookData from './content/book.json';
import questionnaireData from './content/questionnaire.json';
import type { Book, Page as PageT } from './types/book';
import type { Questionnaire } from './types/questionnaire';
import { paginate, paginateToc } from './lib/pagination/paginate';
import { BookShell, type BookShellHandle } from './components/BookShell';
import { Cover } from './components/Cover';
import { BackCover } from './components/BackCover';
import { Page } from './components/Page';
import { TableOfContents, buildTocEntries, type TocEntry } from './components/TableOfContents';
import { Controls } from './components/Controls';
import { ProgressBar } from './components/ProgressBar';
import { ReaderTools, type ReaderView } from './components/ReaderTools';
import { HighlighterToolbar } from './components/HighlighterToolbar';
import { CommentPopupHost } from './components/CommentPopup';
import { BookShelf, type BookId } from './components/BookShelf';
import { QuestionnaireBook } from './components/questionnaire/QuestionnaireBook';
import { useFontsReady } from './hooks/useFontsReady';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { useHashRoute } from './hooks/useHashRoute';
import { useBookLayout } from './hooks/useBookLayout';
import { useQuestionnaireBook } from './hooks/useQuestionnaireBook';

const book = bookData as Book;
const questionnaire = questionnaireData as Questionnaire;
type Layout = ReturnType<typeof useBookLayout>;
type PreparedBook = { pages: PageT[]; contents: TocEntry[][]; layout: Layout; start: number; revision: number };

// How long a cover takes to grow from the start screen into its reading spot.
const SHELF_OPEN_MS = 760;

// "#p=12" opens the statement of work, "#q=3" the questionnaire; anything else
// starts on the screen with both books side by side.
function viewFromHash(): ReaderView {
  if (/^#q=\d+$/.test(window.location.hash)) return 'questionnaire';
  if (/^#p=\d+$/.test(window.location.hash)) return 'sow';
  return 'shelf';
}

export default function App() {
  const fontsReady = useFontsReady();
  const layout = useBookLayout();
  const [view, setView] = useState<ReaderView>(viewFromHash);
  const [opening, setOpening] = useState<{ book: BookId; landed: boolean } | null>(null);
  const [cameFrom, setCameFrom] = useState<BookId | null>(null);
  const [prepared, setPrepared] = useState<PreparedBook | null>(null);
  const [current, setCurrent] = useState(() => Number(window.location.hash.match(/^#p=(\d+)$/)?.[1] ?? 0));
  const [fullscreen, setFullscreen] = useState(false);
  const handleRef = useRef<BookShellHandle | null>(null);
  const readingRef = useRef({ current, prepared });
  readingRef.current = { current, prepared };
  // The questionnaire is laid out alongside the statement of work, so it is
  // ready by the time someone opens it.
  const q = useQuestionnaireBook({ questionnaire, layout, fontsReady, enabled: view !== 'sow' || Boolean(prepared) });

  useEffect(() => {
    if (!fontsReady) return;
    const timer = window.setTimeout(() => {
      const pages = paginate(book.sections, layout);
      const contents = paginateToc(buildTocEntries(book.sections, pages), layout);
      const previous = readingRef.current;
      let start = previous.current;
      if (previous.prepared) {
        const oldOffset = 1 + previous.prepared.contents.length;
        const oldPage = previous.prepared.pages[previous.current - oldOffset];
        if (oldPage) {
          const oldSection = previous.prepared.pages.filter(p => p.sectionId === oldPage.sectionId);
          const newSection = pages.filter(p => p.sectionId === oldPage.sectionId);
          const position = oldSection.indexOf(oldPage) / oldSection.length;
          const target = newSection[Math.min(newSection.length - 1, Math.floor(position * newSection.length))];
          start = 1 + contents.length + pages.indexOf(target);
        } else if (previous.current >= oldOffset + previous.prepared.pages.length) {
          start = 1 + contents.length + pages.length;
        } else if (previous.current > 0) start = Math.min(previous.current, contents.length);
      }
      start = Math.min(start, 1 + contents.length + pages.length);
      setPrepared({ pages, contents, layout, start, revision: (previous.prepared?.revision ?? 0) + 1 });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fontsReady, layout]);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  // A link or edited address such as "#q=4" switches to the matching book.
  useEffect(() => {
    const onHash = () => {
      const next = viewFromHash();
      if (next !== 'shelf') setView(next);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Once the picked cover has grown into place (and its book is laid out),
  // the live book takes over from the picture of its cover.
  useEffect(() => {
    if (!opening?.landed) return;
    if (!(opening.book === 'sow' ? prepared : q.prepared)) return;
    setView(opening.book);
    setOpening(null);
  }, [opening, prepared, q.prepared]);

  const openFromShelf = (id: BookId) => {
    if (opening) return;
    // Open at the cover, which is where the growing picture lands.
    (id === 'sow' ? handleRef : q.handleRef).current?.turnTo(0);
    setOpening({ book: id, landed: false });
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => setOpening(o => (o?.book === id ? { ...o, landed: true } : o)), instant ? 0 : SHELF_OPEN_MS);
  };

  const backToShelf = () => {
    if (view === 'shelf') return;
    setCameFrom(view);
    setView('shelf');
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  };

  const pages = prepared?.pages ?? [];
  const contents = prepared?.contents ?? [];
  const offset = 1 + contents.length;
  const totalLeaves = offset + pages.length + 1;
  const last = totalLeaves - 1;
  const enterFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen?.();
    } catch { /* The reader remains usable when the browser disallows fullscreen. */ }
  };

  const pageNumber = Math.min(pages.length, Math.max(0, current - offset + 1));
  const endNumber = Math.min(pages.length, pageNumber + (prepared?.layout.singlePage ? 0 : 1));
  const sowLabel = current === 0 ? 'Cover' : current < offset ? 'Contents' : current >= last ? 'End of document' :
    `${pageNumber}${endNumber > pageNumber ? `–${endNumber}` : ''} / ${pages.length}`;
  const sowAtEnd = current >= last || (!prepared?.layout.singlePage && current + 1 >= last);

  // Questionnaire: leaf 0 is the cover and inner page N is leaf N.
  const qTotal = q.prepared?.pages.length ?? 0;
  const qLast = qTotal + 1;
  const qSingle = q.prepared?.layout.singlePage ?? layout.singlePage;
  const qEnd = Math.min(qTotal, q.current + (qSingle ? 0 : 1));
  const qLabel = q.current === 0 ? 'Cover' : q.current >= qLast ? 'End of questionnaire' :
    `${q.current}${qEnd > q.current ? `–${qEnd}` : ''} / ${qTotal}`;
  const qAtEnd = q.current >= qLast || (!qSingle && q.current + 1 >= qLast);

  const isSow = view === 'sow';
  const onShelf = view === 'shelf';
  // On the start screen no book is open, so paging controls stay idle.
  const active = view === 'questionnaire'
    ? { handle: q.handleRef, current: q.current, last: qLast, ready: Boolean(q.prepared), label: qLabel, atEnd: qAtEnd, contentsLeaf: q.prepared?.contentsPage ?? 1 }
    : { handle: handleRef, current, last, ready: Boolean(prepared) && !onShelf, label: sowLabel, atEnd: sowAtEnd, contentsLeaf: 1 };
  const go = (delta: 1 | -1) => {
    if (onShelf) return;
    if (delta === 1) active.handle.current?.next();
    else active.handle.current?.prev();
  };

  useKeyboardNav({
    next: () => go(1), prev: () => go(-1),
    onHome: () => { if (!onShelf) active.handle.current?.turnTo(0); },
    onEnd: () => { if (!onShelf) active.handle.current?.turnTo(active.last); },
    onEscape: () => { if (document.fullscreenElement) void document.exitFullscreen(); },
  });
  useHashRoute({ key: isSow ? 'p' : 'q', currentPage: active.current, ready: active.ready, onNavigate: n => active.handle.current?.turnTo(n) });

  // Built once per pagination so flipping either book never re-renders every page.
  const sowLeaves = useMemo(() => {
    if (!prepared) return null;
    const tocOffset = 1 + prepared.contents.length;
    const jumpToPage = (number: number) => handleRef.current?.turnTo(tocOffset + number - 1);
    return [
      <div key="cover" className="pf-page" data-density="hard"><Cover book={book} /></div>,
      ...prepared.contents.map((entries, i) => <div key={`toc-${i}`} className="pf-page" data-density="soft">
        <TableOfContents entries={entries} index={i} total={prepared.contents.length} onJump={jumpToPage} />
      </div>),
      ...prepared.pages.map(page => <div key={`page-${page.pageNumber}`} className="pf-page" data-density="soft">
        <Page page={page} total={prepared.pages.length} />
      </div>),
      <div key="back" className="pf-page" data-density="hard"><BackCover book={book} totalPages={prepared.pages.length} /></div>,
    ];
  }, [prepared]);

  const hint = onShelf ? (layout.singlePage ? 'Tap a book to open it' : 'Choose a book to open it')
    : isSow ? (layout.singlePage ? 'Swipe or use the arrows to turn the page' : 'Turn a page with the corners, arrows, or your keyboard')
    : (layout.singlePage ? 'Answers save as you type — swipe or use the arrows to turn' : 'Answers save on this device as you type — turn pages with the corners or arrows');
  const slideState = (id: BookId) => view === id ? 'active' : onShelf ? 'shelved' : id === 'sow' ? 'off-left' : 'off-right';
  const mainLabel = onShelf ? 'Preneur Gate — choose a book' : isSow ? 'Preneur Gate statement of work' : 'Preneur Gate client onboarding questionnaire';

  return (
    <main className="book-stage" data-view={view} aria-label={mainLabel}>
      {!onShelf && <ProgressBar currentPage={active.current} totalPages={Math.max(1, active.last)} />}
      <header className="reader-heading" key={view}>
        {onShelf ? <>
          <strong>Preneur Gate</strong>
          <span className="reader-edition">Statement of work · Questionnaire · Website layout</span>
        </> : <>
          <strong>
            <button type="button" className="reader-home" onClick={backToShelf} aria-label="Preneur Gate: show both books" title="Show both books">Preneur Gate</button>
            {' '}<span aria-hidden="true">/</span> {isSow ? 'SOW' : 'Questionnaire'}
          </strong>
          <span className="reader-edition">{isSow ? `Statement of work · v${book.meta.version}` : 'Client onboarding · saved on this device'}</span>
        </>}
      </header>
      <div className="book-track">
        {/* A book not being read waits out of sight: the statement of work to the left, the questionnaire to the right. */}
        <section className="book-slide" data-state={slideState('sow')} inert={!isSow} aria-label="Statement of work">
          {!prepared || !sowLeaves ? (!onShelf && <div className="reader-loading" role="status">Preparing your document…</div>) : (
            <BookShell key={prepared.revision}
              {...prepared.layout} initialPage={prepared.start} closed={current === 0} handleRef={handleRef} onFlip={setCurrent}>
              {sowLeaves}
            </BookShell>
          )}
        </section>
        <section className="book-slide" data-state={slideState('questionnaire')} inert={view !== 'questionnaire'} aria-label="Client onboarding questionnaire">
          <QuestionnaireBook questionnaire={questionnaire} prepared={q.prepared} closed={q.current === 0}
            handleRef={q.handleRef} onFlip={q.setCurrent} />
        </section>
        {onShelf && (
          <BookShelf book={book} questionnaire={questionnaire} pageW={layout.pageW} pageH={layout.pageH}
            sowPages={pages.length} opening={opening?.book ?? null} cameFrom={cameFrom} onOpen={openFromShelf} />
        )}
      </div>
      <p className="reader-hint">{hint}</p>
      <Controls label={active.label} onPrev={() => go(-1)} onNext={() => go(1)}
        onToc={() => active.handle.current?.turnTo(active.contentsLeaf)}
        tocLabel={isSow || onShelf ? 'Contents' : 'Sections'} tocAriaLabel={isSow || onShelf ? 'Table of contents' : 'Questionnaire sections'}
        onFullscreen={enterFullscreen}
        canPrev={active.ready && active.current > 0} canNext={active.ready && !active.atEnd}
        fullscreen={fullscreen} fullscreenSupported={Boolean(document.fullscreenEnabled)}>
        {isSow && <HighlighterToolbar />}
      </Controls>
      <ReaderTools view={view} questionnaire={questionnaire} onToggleView={() => setView(v => (v === 'sow' ? 'questionnaire' : 'sow'))} />
      <CommentPopupHost />
    </main>
  );
}
