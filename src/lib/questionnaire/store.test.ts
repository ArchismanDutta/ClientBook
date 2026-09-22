import { afterEach, describe, expect, it } from 'vitest';
import { isAnswered, loadAnswers, patchAnswer, removeAnswer, saveAnswers, sectionProgress } from './store';
import type { QuestionnaireSection } from '../../types/questionnaire';

const KEY = 'preneur-gate:questionnaire:v1';

describe('questionnaire answers store', () => {
  afterEach(() => localStorage.clear());

  it('merges a choice and text into one answer', () => {
    let answers = patchAnswer({}, 'q1', { choice: 'ready' }, 1);
    answers = patchAnswer(answers, 'q1', { text: 'Acme Ltd' }, 2);
    expect(answers).toEqual({ q1: { choice: 'ready', text: 'Acme Ltd', updatedAt: 2 } });
  });

  it('drops an answer once both the choice and the text are empty', () => {
    const answers = patchAnswer({ q1: { text: 'x', updatedAt: 1 } }, 'q1', { text: '' }, 2);
    expect(answers).toEqual({});
  });

  it('keeps text exactly as typed, including trailing spaces', () => {
    expect(patchAnswer({}, 'q1', { text: 'Acme ' }, 1).q1.text).toBe('Acme ');
  });

  it('removes a single answer and leaves the rest', () => {
    const answers = { q1: { choice: 'na', updatedAt: 1 }, q2: { text: 'hi', updatedAt: 1 } };
    expect(removeAnswer(answers, 'q1')).toEqual({ q2: { text: 'hi', updatedAt: 1 } });
    expect(removeAnswer(answers, 'missing')).toBe(answers);
  });

  it('treats whitespace-only text as unanswered', () => {
    expect(isAnswered({ text: '   ', updatedAt: 1 })).toBe(false);
    expect(isAnswered({ choice: 'pending', updatedAt: 1 })).toBe(true);
    expect(isAnswered(undefined)).toBe(false);
  });

  it('round-trips through localStorage', () => {
    const answers = { q1: { choice: 'ready', text: 'Acme', updatedAt: 5 } };
    saveAnswers(answers);
    expect(loadAnswers()).toEqual(answers);
  });

  it('ignores damaged or unexpected saved data', () => {
    localStorage.setItem(KEY, '{not json');
    expect(loadAnswers()).toEqual({});
    localStorage.setItem(KEY, JSON.stringify({ ok: { text: 'kept', updatedAt: 3 }, bad: 7, empty: { updatedAt: 1 } }));
    expect(loadAnswers()).toEqual({ ok: { text: 'kept', updatedAt: 3 } });
  });

  it('counts questions and open sign-off blanks per section', () => {
    const section: QuestionnaireSection = {
      id: 's', number: 1, title: 'S',
      questions: [
        { id: 'a', number: 1, title: 'A', prompt: '', options: [] },
        { id: 'b', number: 2, title: 'B', prompt: '', options: [] },
      ],
      fields: [{ id: 'f', label: 'Name', kind: 'text' }, { id: 'p', label: 'Project', kind: 'text', value: 'Fixed' }],
    };
    expect(sectionProgress(section, { a: { choice: 'ready', updatedAt: 1 }, f: { text: 'Jo', updatedAt: 1 } }))
      .toEqual({ answered: 2, total: 3 });
  });
});
