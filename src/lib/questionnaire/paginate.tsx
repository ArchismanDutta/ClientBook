import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { Questionnaire, QuestionnaireBlock, QuestionnairePage } from '../../types/questionnaire';
import { QuestionnairePageView } from '../../components/questionnaire/QuestionnairePage';

export type PageDims = { pageW: number; pageH: number };

// Content in reading order. Every group starts on a fresh page: the intro,
// the list of sections, then one group per questionnaire section.
export function questionnaireGroups(q: Questionnaire): QuestionnaireBlock[][] {
  const intro: QuestionnaireBlock[] = [{ type: 'hero' }];
  if (q.details.length) intro.push({ type: 'details' });
  if (q.note) intro.push({ type: 'note' });
  const groups: QuestionnaireBlock[][] = [intro, [{ type: 'contents' }, { type: 'steps' }]];
  q.sections.forEach((section, i) => {
    const group: QuestionnaireBlock[] = [{ type: 'section', section }];
    for (const question of section.questions) group.push({ type: 'question', question, section });
    if (section.fields.length) group.push({ type: 'fields', section });
    if (i === q.sections.length - 1) group.push({ type: 'finale' });
    groups.push(group);
  });
  return groups;
}

// Fills pages with whole blocks — a question card is never split — and never
// leaves a section heading alone at the bottom of a page.
export function paginateQuestionnaire(q: Questionnaire, dims: PageDims): QuestionnairePage[] {
  const pages: QuestionnairePage[] = [];
  const measure = createQuestionnaireMeasurer(q, dims);
  try {
    for (const group of questionnaireGroups(q)) {
      let blocks: QuestionnaireBlock[] = [];
      const commit = (overflow = false) => {
        if (!blocks.length) return;
        pages.push({ blocks, pageNumber: pages.length + 1, ...(overflow ? { overflow: true } : {}) });
        blocks = [];
      };
      for (const block of group) {
        // The short "how to fill this in" tips only appear when they fit beside
        // the sections list; on their own they would leave a near-empty page.
        if (block.type === 'steps') {
          if (blocks.some(b => b.type === 'contents') && measure.fits([...blocks, block])) blocks.push(block);
          continue;
        }
        if (measure.fits([...blocks, block])) { blocks.push(block); continue; }
        const carried: QuestionnaireBlock[] = [];
        while (blocks.length && blocks[blocks.length - 1].type === 'section') carried.unshift(blocks.pop()!);
        commit();
        blocks = [...carried, block];
        // Taller than an empty page: keep it whole and let the page scroll.
        if (!measure.fits(blocks)) commit(true);
      }
      commit();
    }
  } finally {
    measure.dispose();
  }
  return pages;
}

// Rough heights for environments without layout (jsdom in tests).
const ESTIMATES: Record<QuestionnaireBlock['type'], number> = {
  hero: 250, details: 150, note: 120, contents: 380, steps: 110, section: 90, question: 185, fields: 250, finale: 130,
};

function createQuestionnaireMeasurer(q: Questionnaire, dims: PageDims) {
  const host = document.createElement('div');
  host.className = 'q-measure';
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = `position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none;width:${dims.pageW}px;--page-w:${dims.pageW}px;--page-h:${dims.pageH}px`;
  document.body.appendChild(host);
  const root = createRoot(host);
  const noop = () => {};

  return {
    fits(blocks: QuestionnaireBlock[]): boolean {
      flushSync(() => root.render(
        <QuestionnairePageView page={{ blocks, pageNumber: 1 }} total={99} questionnaire={q} sectionPages={{}} onJump={noop} />,
      ));
      const body = host.querySelector<HTMLElement>('.q-body');
      if (!body || !body.clientHeight) {
        return blocks.reduce((h, b) => h + ESTIMATES[b.type], 0) <= dims.pageH - 170;
      }
      const bottom = body.getBoundingClientRect().bottom;
      return body.scrollHeight <= body.clientHeight + 1 &&
        Array.from(body.children).every(child => child.getBoundingClientRect().bottom <= bottom + 0.5);
    },
    dispose() {
      root.unmount();
      host.remove();
    },
  };
}
