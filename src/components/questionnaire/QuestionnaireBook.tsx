import { useEffect, useMemo, useRef } from 'react';
import type { Questionnaire } from '../../types/questionnaire';
import type { PreparedQuestionnaire } from '../../hooks/useQuestionnaireBook';
import { BookShell, type BookShellHandle } from '../BookShell';
import { QuestionnairePageView } from './QuestionnairePage';
import { QuestionnaireBackCover, QuestionnaireCover } from './QuestionnaireCovers';

// Anything a reader clicks or types into.
const CONTROLS = 'input, textarea, select, button, label, a[href], [contenteditable="true"]';

export function QuestionnaireBook({ questionnaire, prepared, closed, handleRef, onFlip }: {
  questionnaire: Questionnaire;
  prepared: PreparedQuestionnaire | null;
  closed: boolean;
  handleRef: React.RefObject<BookShellHandle | null>;
  onFlip: (pageIndex: number) => void;
}) {
  const shieldRef = useRef<HTMLDivElement>(null);

  // page-flip treats every mousedown / touchstart inside the book as the start
  // of a page turn and cancels the browser's default action, so inputs would
  // never get focus and each click would flip the page. Catch those events on
  // the way down and keep them away from page-flip when they start on a control.
  useEffect(() => {
    const el = shieldRef.current;
    if (!el) return;
    const shield = (e: Event) => {
      if (e.target instanceof Element && e.target.closest(CONTROLS)) e.stopPropagation();
    };
    el.addEventListener('mousedown', shield, true);
    el.addEventListener('touchstart', shield, { capture: true, passive: true });
    return () => {
      el.removeEventListener('mousedown', shield, true);
      el.removeEventListener('touchstart', shield, true);
    };
  }, []);

  // Built once per pagination so turning the other book never re-renders these.
  const leaves = useMemo(() => {
    if (!prepared) return null;
    const jump = (pageNumber: number) => handleRef.current?.turnTo(pageNumber);
    return [
      <div key="cover" className="pf-page" data-density="hard"><QuestionnaireCover questionnaire={questionnaire} /></div>,
      ...prepared.pages.map(page => (
        <div key={`q-${page.pageNumber}`} className="pf-page" data-density="soft">
          <QuestionnairePageView page={page} total={prepared.pages.length} questionnaire={questionnaire}
            sectionPages={prepared.sectionPages} onJump={jump} />
        </div>
      )),
      <div key="back" className="pf-page" data-density="hard"><QuestionnaireBackCover questionnaire={questionnaire} /></div>,
    ];
  }, [prepared, questionnaire, handleRef]);

  return (
    <div ref={shieldRef} className="q-book">
      {!prepared || !leaves ? <div className="reader-loading" role="status">Preparing the questionnaire…</div> : (
        <BookShell key={prepared.revision} {...prepared.layout} initialPage={prepared.start} closed={closed}
          handleRef={handleRef} onFlip={onFlip} clickToFlip={false}>
          {leaves}
        </BookShell>
      )}
    </div>
  );
}
