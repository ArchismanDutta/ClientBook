import { describe, expect, it } from 'vitest';
import questionnaireData from '../../content/questionnaire.json';
import type { Questionnaire, QuestionnaireBlock } from '../../types/questionnaire';
import { paginateQuestionnaire } from './paginate';

const questionnaire = questionnaireData as Questionnaire;

describe('paginateQuestionnaire', () => {
  for (const dims of [{ pageW: 514, pageH: 720 }, { pageW: 336, pageH: 540 }]) {
    describe(`${dims.pageW}×${dims.pageH}`, () => {
      const pages = paginateQuestionnaire(questionnaire, dims);
      const blocks = pages.flatMap(p => p.blocks);

      it('numbers pages from 1', () => {
        expect(pages.map(p => p.pageNumber)).toEqual(pages.map((_, i) => i + 1));
      });

      it('includes every question exactly once, in order', () => {
        const numbers = blocks.flatMap(b => (b.type === 'question' ? [b.question.number] : []));
        expect(numbers).toEqual(questionnaire.sections.flatMap(s => s.questions.map(q => q.number)));
      });

      it('opens with the intro and gives the sections list its own page', () => {
        expect(pages[0].blocks[0].type).toBe('hero');
        const contents = pages.find(p => p.blocks.some(b => b.type === 'contents'))!;
        expect(contents.blocks[0].type).toBe('contents');
      });

      it('shows the filling-in tips only beside the sections list', () => {
        for (const page of pages) {
          if (page.blocks.some(b => b.type === 'steps')) expect(page.blocks.map(b => b.type)).toEqual(['contents', 'steps']);
        }
      });

      it('starts every section on a fresh page and never ends a page on a heading', () => {
        for (const page of pages) {
          const sectionAt = page.blocks.findIndex(b => b.type === 'section');
          if (sectionAt >= 0) expect(sectionAt).toBe(0);
          expect(page.blocks[page.blocks.length - 1].type).not.toBe('section');
        }
      });

      it('ends with the sign-off blanks and the closing banner', () => {
        const types = blocks.map((b: QuestionnaireBlock) => b.type);
        expect(types.slice(-2)).toEqual(['fields', 'finale']);
      });
    });
  }
});
