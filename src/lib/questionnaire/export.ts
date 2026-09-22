import type { Questionnaire, QuestionnaireAnswers, QuestionnaireField } from '../../types/questionnaire';

const EMPTY = '—';

// A plain-text copy of everything the reader filled in, laid out in the same
// order as the questionnaire so it can be read, emailed or printed as is.
export function answersToText(q: Questionnaire, answers: QuestionnaireAnswers, exportedAt = new Date()): string {
  const lines: string[] = [];
  const field = (f: QuestionnaireField) => `${f.label}: ${f.value ?? (answers[f.id]?.text?.trim() || EMPTY)}`;

  lines.push(`${q.brand} — ${q.title}`.toUpperCase());
  if (q.subtitle) lines.push(q.subtitle);
  lines.push(`Exported ${exportedAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`, '');
  for (const f of q.details) lines.push(field(f));

  for (const section of q.sections) {
    const heading = `${section.number}. ${section.title}`.toUpperCase();
    lines.push('', heading, '='.repeat(heading.length));
    for (const question of section.questions) {
      const answer = answers[question.id];
      const status = question.options.find(o => o.id === answer?.choice)?.label ?? EMPTY;
      const response = answer?.text?.trim();
      lines.push('', `${String(question.number).padStart(2, '0')}. ${question.title}`);
      lines.push(`    Status:   ${status}`);
      lines.push(`    Response: ${response ? response.replace(/\n/g, '\n              ') : EMPTY}`);
    }
    if (section.fields.length) lines.push('');
    for (const f of section.fields) lines.push(field(f));
  }
  return lines.join('\n') + '\n';
}

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
