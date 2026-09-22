import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Book } from '../types/book';
import type { Questionnaire } from '../types/questionnaire';
import { allQuestions, countAnswered } from '../lib/questionnaire/store';
import { Cover } from './Cover';
import { QuestionnaireCover } from './questionnaire/QuestionnaireCovers';
import { useQuestionnaire } from './questionnaire/QuestionnaireProvider';

export type BookId = 'sow' | 'questionnaire';

// The start screen: both closed books side by side, the statement of work on
// the left and the questionnaire on the right. Each cover is drawn at the real
// page size and scaled down, so picking one can grow it back to scale 1 in the
// exact spot where that book's own closed cover sits before the live book
// replaces it.
export function BookShelf({ book, questionnaire, pageW, pageH, sowPages, opening, cameFrom, onOpen }: {
  book: Book;
  questionnaire: Questionnaire;
  pageW: number;
  pageH: number;
  sowPages: number;
  opening: BookId | null;
  cameFrom: BookId | null;
  onOpen: (id: BookId) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(() => document.documentElement.clientWidth || window.innerWidth);
  const { answers } = useQuestionnaire();
  const questions = allQuestions(questionnaire.sections);
  const answered = countAnswered(questions.map(q => q.id), answers);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => setWidth(el.clientWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const gap = width < 600 ? 14 : 64;
  const scale = Math.max(0.2, Math.min(0.88, (width - gap) / (2 * pageW)));
  const style = {
    '--page-w': `${pageW}px`,
    '--page-h': `${pageH}px`,
    '--shelf-scale': scale,
    '--shelf-shift': `${(pageW * scale + gap) / 2}px`,
  } as CSSProperties;

  return (
    <div ref={ref} className="book-shelf" style={style} data-opening={opening ?? undefined} data-came-from={cameFrom ?? undefined}>
      <ShelfBook id="sow" label="Open the statement of work" caption="Statement of work" detail={sowPages ? `${sowPages} pages` : 'Read inside'} onOpen={onOpen} disabled={Boolean(opening)}>
        <Cover book={book} />
      </ShelfBook>
      <ShelfBook id="questionnaire" label={`Open the client onboarding questionnaire, ${answered} of ${questions.length} answered`}
        caption="Client questionnaire" detail={answered ? `${answered} of ${questions.length} answered` : `${questions.length} questions`} onOpen={onOpen} disabled={Boolean(opening)}>
        <QuestionnaireCover questionnaire={questionnaire} />
      </ShelfBook>
    </div>
  );
}

function ShelfBook({ id, label, caption, detail, disabled, onOpen, children }: {
  id: BookId;
  label: string;
  caption: string;
  detail: string;
  disabled: boolean;
  onOpen: (id: BookId) => void;
  children: ReactNode;
}) {
  // The cover is only a picture here; a clear button laid over it does the work.
  return (
    <>
      <div className="shelf-book" data-book={id}>
        <div className="shelf-page" aria-hidden="true">{children}</div>
        <button type="button" className="shelf-hit" aria-label={label} disabled={disabled} onClick={() => onOpen(id)} />
      </div>
      <span className="shelf-caption" data-book={id} aria-hidden="true">
        <strong>{caption}</strong>
        <span>{detail}</span>
      </span>
    </>
  );
}
