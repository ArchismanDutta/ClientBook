import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { QuestionnaireAnswer, QuestionnaireAnswers } from '../../types/questionnaire';
import { loadAnswers, patchAnswer, removeAnswer, saveAnswers } from '../../lib/questionnaire/store';

type Ctx = {
  answers: QuestionnaireAnswers;
  now: number; // refreshed every minute so "saved 5m ago" labels stay current
  getAnswer: (id: string) => QuestionnaireAnswer | undefined;
  setChoice: (id: string, choice: string) => void;
  setText: (id: string, text: string) => void;
  clearAnswer: (id: string) => void;
};

const QuestionnaireContext = createContext<Ctx | null>(null);

// Inert stand-in used outside the provider, e.g. by the off-screen root that
// measures questionnaire pages. Layout never depends on the answers.
const NOOP_CTX: Ctx = {
  answers: {},
  now: 0,
  getAnswer: () => undefined,
  setChoice: () => {},
  setText: () => {},
  clearAnswer: () => {},
};

export function useQuestionnaire(): Ctx {
  return useContext(QuestionnaireContext) ?? NOOP_CTX;
}

export function QuestionnaireProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(() => loadAnswers());
  const [now, setNow] = useState(() => Date.now());

  // Answers stay on this device until the reader edits or clears them.
  useEffect(() => { saveAnswers(answers); }, [answers]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const setChoice = useCallback((id: string, choice: string) => {
    const at = Date.now();
    setAnswers(prev => patchAnswer(prev, id, { choice }, at));
    setNow(at);
  }, []);

  const setText = useCallback((id: string, text: string) => {
    const at = Date.now();
    setAnswers(prev => patchAnswer(prev, id, { text }, at));
    setNow(at);
  }, []);

  const clearAnswer = useCallback((id: string) => {
    setAnswers(prev => removeAnswer(prev, id));
  }, []);

  const value = useMemo<Ctx>(() => ({
    answers,
    now,
    getAnswer: id => answers[id],
    setChoice,
    setText,
    clearAnswer,
  }), [answers, now, setChoice, setText, clearAnswer]);

  return <QuestionnaireContext.Provider value={value}>{children}</QuestionnaireContext.Provider>;
}
