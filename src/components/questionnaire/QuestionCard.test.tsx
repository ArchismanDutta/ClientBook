import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QuestionnaireProvider } from './QuestionnaireProvider';
import { QuestionCard } from './QuestionCard';
import type { QuestionnaireQuestion } from '../../types/questionnaire';

const KEY = 'preneur-gate:questionnaire:v1';
const question: QuestionnaireQuestion = {
  id: 'billing--address',
  number: 2,
  title: 'Billing address',
  prompt: 'Complete billing address.',
  options: [{ id: 'ready', label: 'Ready' }, { id: 'pending', label: 'Pending' }, { id: 'n-a', label: 'N/A' }],
};

const saved = () => JSON.parse(localStorage.getItem(KEY) ?? '{}');
const renderCard = () => render(<QuestionnaireProvider><QuestionCard question={question} /></QuestionnaireProvider>);

describe('QuestionCard', () => {
  afterEach(() => localStorage.clear());

  it('saves the picked option and the typed response on this device', () => {
    renderCard();
    fireEvent.click(screen.getByRole('radio', { name: 'Ready' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Billing address' }), { target: { value: '42 Park Street' } });
    expect(screen.getByRole('radio', { name: 'Ready' })).toHaveAttribute('aria-checked', 'true');
    expect(saved()['billing--address']).toMatchObject({ choice: 'ready', text: '42 Park Street' });
  });

  it('shows saved answers again after a reload', () => {
    localStorage.setItem(KEY, JSON.stringify({ 'billing--address': { choice: 'n-a', text: 'Same as registered', updatedAt: 1 } }));
    renderCard();
    expect(screen.getByRole('radio', { name: 'N/A' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('textbox', { name: 'Billing address' })).toHaveValue('Same as registered');
  });

  it('clears the answer only when asked', () => {
    renderCard();
    const clear = screen.getByRole('button', { name: /clear the answer/i });
    expect(clear).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Billing address' }), { target: { value: 'Draft' } });
    fireEvent.click(clear);
    expect(screen.getByRole('textbox', { name: 'Billing address' })).toHaveValue('');
    expect(saved()).toEqual({});
  });

  it('moves between options with the arrow keys without turning the page', () => {
    const pageTurn = vi.fn();
    window.addEventListener('keydown', pageTurn);
    renderCard();
    const ready = screen.getByRole('radio', { name: 'Ready' });
    ready.focus();
    fireEvent.keyDown(ready, { key: 'ArrowRight' });
    expect(screen.getByRole('radio', { name: 'Pending' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Pending' })).toHaveFocus();
    expect(pageTurn).not.toHaveBeenCalled();
    window.removeEventListener('keydown', pageTurn);
  });
});
