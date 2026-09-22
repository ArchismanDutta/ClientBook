import type { QuestionnaireAnswer, QuestionnaireAnswers, QuestionnaireQuestion, QuestionnaireSection } from '../../types/questionnaire';

const STORAGE_KEY = 'preneur-gate:questionnaire:v1';

export function loadAnswers(): QuestionnaireAnswers {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const answers: QuestionnaireAnswers = {};
    for (const [id, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (!value || typeof value !== 'object') continue;
      const { choice, text, updatedAt } = value as Record<string, unknown>;
      const answer: QuestionnaireAnswer = { updatedAt: typeof updatedAt === 'number' ? updatedAt : Date.now() };
      if (typeof choice === 'string' && choice) answer.choice = choice;
      if (typeof text === 'string' && text) answer.text = text;
      if (answer.choice || answer.text) answers[id] = answer;
    }
    return answers;
  } catch {
    return {};
  }
}

export function saveAnswers(answers: QuestionnaireAnswers): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    /* quota exceeded / disabled — answers stay in memory for this visit */
  }
}

export function isAnswered(answer: QuestionnaireAnswer | undefined): boolean {
  return Boolean(answer && (answer.choice || answer.text?.trim()));
}

// Returns a new answers object with `patch` merged into one entry. An entry
// left with neither a choice nor any text is removed, exactly like clearing it.
export function patchAnswer(
  answers: QuestionnaireAnswers,
  id: string,
  patch: { choice?: string | null; text?: string | null },
  now = Date.now(),
): QuestionnaireAnswers {
  const previous = answers[id];
  const next: QuestionnaireAnswer = { ...previous, updatedAt: now };
  if (patch.choice !== undefined) {
    if (patch.choice) next.choice = patch.choice;
    else delete next.choice;
  }
  if (patch.text !== undefined) {
    if (patch.text) next.text = patch.text;
    else delete next.text;
  }
  const rest = { ...answers };
  delete rest[id];
  return next.choice || next.text ? { ...rest, [id]: next } : rest;
}

export function removeAnswer(answers: QuestionnaireAnswers, id: string): QuestionnaireAnswers {
  if (!(id in answers)) return answers;
  const rest = { ...answers };
  delete rest[id];
  return rest;
}

export function allQuestions(sections: QuestionnaireSection[]): QuestionnaireQuestion[] {
  return sections.flatMap(section => section.questions);
}

export function countAnswered(ids: string[], answers: QuestionnaireAnswers): number {
  return ids.filter(id => isAnswered(answers[id])).length;
}

// Answered / total for one section: its questions plus any sign-off blanks.
export function sectionProgress(section: QuestionnaireSection, answers: QuestionnaireAnswers) {
  const ids = [...section.questions.map(q => q.id), ...section.fields.filter(f => !f.value).map(f => f.id)];
  return { answered: countAnswered(ids, answers), total: ids.length };
}
