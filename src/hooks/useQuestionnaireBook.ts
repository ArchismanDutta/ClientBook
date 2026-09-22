import { useEffect, useRef, useState } from 'react';
import type { BookShellHandle } from '../components/BookShell';
import type { Questionnaire, QuestionnaireBlock, QuestionnairePage } from '../types/questionnaire';
import { paginateQuestionnaire } from '../lib/questionnaire/paginate';
import type { getBookLayout } from './useBookLayout';

type Layout = ReturnType<typeof getBookLayout>;

export type PreparedQuestionnaire = {
  pages: QuestionnairePage[];
  sectionPages: Record<string, number>; // section id -> page number
  contentsPage: number;
  layout: Layout;
  start: number; // leaf to open at (0 = cover)
  revision: number;
};

// Leaf 0 is the cover, so inner page N sits at leaf N and the back cover
// follows the last page.
export function useQuestionnaireBook({ questionnaire, layout, fontsReady, enabled }: {
  questionnaire: Questionnaire;
  layout: Layout;
  fontsReady: boolean;
  enabled: boolean;
}) {
  const [prepared, setPrepared] = useState<PreparedQuestionnaire | null>(null);
  const [current, setCurrent] = useState(() => Number(window.location.hash.match(/^#q=(\d+)$/)?.[1] ?? 0));
  const handleRef = useRef<BookShellHandle | null>(null);
  const appliedLayout = useLayoutWhenNotTyping(layout);
  const readingRef = useRef({ current, prepared });
  readingRef.current = { current, prepared };

  useEffect(() => {
    if (!fontsReady || !enabled) return;
    const timer = window.setTimeout(() => {
      const pages = paginateQuestionnaire(questionnaire, appliedLayout);
      const previous = readingRef.current;
      let start = previous.current;
      if (previous.prepared) {
        // Re-open on the page that now holds the block the reader was on.
        const oldPage = previous.prepared.pages[previous.current - 1];
        if (oldPage) {
          const anchor = blockKey(oldPage.blocks[0]);
          const index = pages.findIndex(p => p.blocks.some(b => blockKey(b) === anchor));
          if (index >= 0) start = index + 1;
        } else if (previous.current > previous.prepared.pages.length) {
          start = pages.length + 1;
        }
      }
      start = Math.max(0, Math.min(start, pages.length + 1));
      setPrepared({ pages, ...indexPages(pages), layout: appliedLayout, start, revision: (previous.prepared?.revision ?? 0) + 1 });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [questionnaire, appliedLayout, fontsReady, enabled]);

  return { prepared, current, setCurrent, handleRef };
}

function blockKey(block: QuestionnaireBlock): string {
  switch (block.type) {
    case 'section': return `section:${block.section.id}`;
    case 'question': return `question:${block.question.id}`;
    case 'fields': return `fields:${block.section.id}`;
    default: return block.type;
  }
}

function indexPages(pages: QuestionnairePage[]) {
  const sectionPages: Record<string, number> = {};
  let contentsPage = 1;
  for (const page of pages) {
    for (const block of page.blocks) {
      if (block.type === 'section' && !(block.section.id in sectionPages)) sectionPages[block.section.id] = page.pageNumber;
      if (block.type === 'contents') contentsPage = page.pageNumber;
    }
  }
  return { sectionPages, contentsPage };
}

function isTypingInQuestionnaire(): boolean {
  const el = document.activeElement;
  return el instanceof HTMLElement && el.matches('input, textarea') && Boolean(el.closest('.q-book'));
}

// Holds the page size steady while someone is typing in the questionnaire.
// On some phones the on-screen keyboard resizes the window; rebuilding the
// book mid-sentence would drop the cursor. The new size applies on blur.
function useLayoutWhenNotTyping(layout: Layout): Layout {
  const [applied, setApplied] = useState(layout);
  useEffect(() => {
    if (applied === layout) return;
    if (!isTypingInQuestionnaire()) {
      setApplied(layout);
      return;
    }
    const onFocusOut = () => window.setTimeout(() => {
      if (!isTypingInQuestionnaire()) setApplied(layout);
    }, 0);
    document.addEventListener('focusout', onFocusOut);
    return () => document.removeEventListener('focusout', onFocusOut);
  }, [layout, applied]);
  return applied;
}
