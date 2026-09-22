import { describe, it, expect } from 'vitest';
import { htmlToQuestionnaire, parseOptions } from './questionnaire';

const STATUS = '<p>[ ] Ready<br />[ ] Pending<br />[ ] N/A</p>';
const HEAD = '<thead><tr><th><p><strong>Requirement</strong></p></th><th><p><strong>What We Need From Client</strong></p></th>'
  + '<th><p><strong>Client Response / Details</strong></p></th><th><p><strong>Status</strong></p></th></tr></thead>';

const html = [
  '<p><strong>PRENEUR GATE</strong></p>',
  '<p><strong>CLIENT ONBOARDING REQUIREMENTS</strong></p>',
  '<p>Accounts, Access &amp; Legal Inputs</p>',
  '<table><tr><td><p><strong>Project</strong></p></td><td><p>Preneur Gate</p></td></tr>',
  '<tr><td><p><strong>Client / Company</strong></p></td><td></td></tr>',
  '<tr><td><p><strong>Date</strong></p></td><td></td></tr></table>',
  '<table><tr><td><p><strong>SECURITY NOTE: </strong>Do not share passwords.</p></td></tr></table>',
  '<h1>1. Company &amp; Billing</h1>',
  `<table>${HEAD}<tbody>`,
  `<tr><td><p>Billing address</p></td><td><p>Complete billing address.</p></td><td></td><td>${STATUS}</td></tr>`,
  `<tr><td><p>Official website</p></td><td><p>Current website URL.</p></td><td></td><td>${STATUS}</td></tr>`,
  '</tbody></table>',
  '<h1>2. Project Email</h1>',
  '<p>The goal is client ownership.</p>',
  `<table>${HEAD}<tbody><tr><td><p>GitHub status</p></td><td><p>Confirm the account.</p></td><td></td><td>${STATUS}</td></tr></tbody></table>`,
  '<h1>3. Client Confirmation</h1>',
  '<p>Please provide the above information.</p>',
  '<table><tr><td><p><strong>Client Representative</strong></p></td><td></td></tr>',
  '<tr><td><p><strong>Date</strong></p></td><td></td></tr>',
  '<tr><td><p><strong>Approval / Signature</strong></p></td><td></td></tr></table>',
].join('');

describe('htmlToQuestionnaire', () => {
  const q = htmlToQuestionnaire(html);

  it('reads the title block', () => {
    expect(q.brand).toBe('Preneur Gate');
    expect(q.title).toBe('Client Onboarding Requirements');
    expect(q.subtitle).toBe('Accounts, Access & Legal Inputs');
  });

  it('reads the details table, keeping prefilled values', () => {
    expect(q.details).toEqual([
      { id: 'details--project', label: 'Project', kind: 'text', value: 'Preneur Gate' },
      { id: 'details--client-company', label: 'Client / Company', kind: 'text' },
      { id: 'details--date', label: 'Date', kind: 'date' },
    ]);
  });

  it('reads the security note', () => {
    expect(q.note).toEqual({ label: 'Security note', text: 'Do not share passwords.' });
  });

  it('turns requirement rows into numbered questions with status options', () => {
    expect(q.sections.map(s => s.title)).toEqual(['Company & Billing', 'Project Email', 'Client Confirmation']);
    const [first, second] = q.sections;
    expect(first.questions.map(x => [x.number, x.title])).toEqual([[1, 'Billing address'], [2, 'Official website']]);
    expect(second.questions[0]).toMatchObject({
      id: 'project-email--github-status',
      number: 3,
      prompt: 'Confirm the account.',
      options: [{ id: 'ready', label: 'Ready' }, { id: 'pending', label: 'Pending' }, { id: 'n-a', label: 'N/A' }],
    });
    expect(second.intro).toBe('The goal is client ownership.');
  });

  it('reads sign-off rows as fields with sensible input kinds', () => {
    const confirm = q.sections[2];
    expect(confirm.questions).toEqual([]);
    expect(confirm.fields.map(f => [f.label, f.kind])).toEqual([
      ['Client Representative', 'text'], ['Date', 'date'], ['Approval / Signature', 'signature'],
    ]);
  });

  it('gives every question and field a unique id', () => {
    const ids = [...q.details, ...q.sections.flatMap(s => [...s.questions, ...s.fields])].map(x => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('parseOptions', () => {
  it('splits checkbox markers', () => {
    expect(parseOptions('[ ] Yes\n[x] No').map(o => o.label)).toEqual(['Yes', 'No']);
  });
  it('falls back to one option per line', () => {
    expect(parseOptions('Yes\nNo').map(o => o.id)).toEqual(['yes', 'no']);
  });
});
