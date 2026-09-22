import { describe, expect, it } from 'vitest';
import type { Questionnaire } from '../../types/questionnaire';
import { answersToText } from './export';

const options = [{ id: 'ready', label: 'Ready' }, { id: 'pending', label: 'Pending' }, { id: 'n-a', label: 'N/A' }];
const questionnaire: Questionnaire = {
  brand: 'Preneur Gate',
  title: 'Client Onboarding Requirements',
  subtitle: 'Accounts & access',
  details: [
    { id: 'details--project', label: 'Project', kind: 'text', value: 'Preneur Gate' },
    { id: 'details--client-company', label: 'Client / Company', kind: 'text' },
  ],
  sections: [
    {
      id: 'billing', number: 1, title: 'Billing', fields: [],
      questions: [
        { id: 'billing--address', number: 1, title: 'Billing address', prompt: '', options },
        { id: 'billing--website', number: 2, title: 'Official website', prompt: '', options },
      ],
    },
    {
      id: 'confirm', number: 2, title: 'Client Confirmation', questions: [],
      fields: [{ id: 'confirm--signature', label: 'Approval / Signature', kind: 'signature' }],
    },
  ],
  meta: { source: 'x.docx', generatedAt: '2026-09-22T00:00:00.000Z' },
};

describe('answersToText', () => {
  const text = answersToText(questionnaire, {
    'details--client-company': { text: 'Acme Learning', updatedAt: 1 },
    'billing--address': { choice: 'pending', text: '42 Park Street\nKolkata', updatedAt: 1 },
    'confirm--signature': { text: 'Priya Sen', updatedAt: 1 },
  }, new Date(2026, 8, 22, 10, 30));

  it('lists the document details, including preset values', () => {
    expect(text).toContain('Project: Preneur Gate');
    expect(text).toContain('Client / Company: Acme Learning');
  });

  it('writes the chosen status and the typed response for each question', () => {
    expect(text).toContain('01. Billing address\n    Status:   Pending\n    Response: 42 Park Street\n              Kolkata');
  });

  it('marks unanswered questions with a dash', () => {
    expect(text).toContain('02. Official website\n    Status:   —\n    Response: —');
  });

  it('includes the sign-off blanks', () => {
    expect(text).toContain('Approval / Signature: Priya Sen');
  });
});
