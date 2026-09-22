import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { Questionnaire } from '../types/questionnaire';
import { allQuestions, countAnswered } from '../lib/questionnaire/store';
import { useHighlights } from './HighlightsProvider';
import { useQuestionnaire } from './questionnaire/QuestionnaireProvider';
import { BackIcon, ClipboardIcon } from './questionnaire/Doodles';

export type ReaderView = 'shelf' | 'sow' | 'questionnaire';

// Floating button at the top right that switches between the statement of
// work and the questionnaire. The start screen, where both books sit side by
// side, does not show it.
export function ReaderTools({ view, onToggleView, questionnaire }: {
  view: ReaderView;
  onToggleView: () => void;
  questionnaire: Questionnaire;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { setMode, closePopup } = useHighlights();
  const { answers } = useQuestionnaire();
  const ids = useMemo(() => allQuestions(questionnaire.sections).map(q => q.id), [questionnaire]);
  const answered = countAnswered(ids, answers);
  const isSow = view === 'sow';

  // Highlighting only applies to the statement of work.
  useEffect(() => {
    if (isSow) return;
    setMode(false);
    closePopup();
  }, [isSow, setMode, closePopup]);

  // Publish the tools' width so the page heading can keep its text clear of them.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--reader-tools-w', `${Math.ceil(el.getBoundingClientRect().width)}px`);
    publish();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--reader-tools-w');
    };
  }, []);

  return (
    <div ref={ref} className="reader-tools" data-view={view}>
      {view !== 'shelf' && (
        <button
          type="button"
          className="q-toggle"
          onClick={onToggleView}
          aria-label={isSow ? `Go to the questionnaire, ${answered} of ${ids.length} answered` : 'Go to the statement of work'}
        >
          {isSow ? <ClipboardIcon /> : <BackIcon />}
          <span className="q-toggle-label">{isSow ? 'Go to Questionnaire' : 'Go to SOW'}</span>
          {answered > 0 && <span className="q-toggle-count" aria-hidden="true">{answered}/{ids.length}</span>}
        </button>
      )}
    </div>
  );
}
