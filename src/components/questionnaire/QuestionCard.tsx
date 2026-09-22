import { useRef, type KeyboardEvent } from 'react';
import type { QuestionnaireField, QuestionnaireOption, QuestionnaireQuestion } from '../../types/questionnaire';
import { isAnswered } from '../../lib/questionnaire/store';
import { relativeTime } from '../../lib/relativeTime';
import { useQuestionnaire } from './QuestionnaireProvider';

const TONES = ['pink', 'blue', 'yellow'] as const;
export const toneFor = (n: number) => TONES[(Math.max(1, n) - 1) % TONES.length];
export const pad2 = (n: number) => String(n).padStart(2, '0');

export function QuestionCard({ question }: { question: QuestionnaireQuestion }) {
  const { getAnswer, setChoice, setText, clearAnswer, now } = useQuestionnaire();
  const answer = getAnswer(question.id);
  const answered = isAnswered(answer);
  const base = `q-${question.id}`;
  const saved = answered && answer ? `Saved ${relativeTime(answer.updatedAt, Math.max(now, answer.updatedAt))}` : undefined;

  return (
    <article className="q-card" data-tone={toneFor(question.number)} data-answered={answered || undefined} aria-labelledby={`${base}-title`}>
      <span className="q-badge" title={saved}>
        <span aria-hidden="true">{pad2(question.number)}</span>
        {answered && <span className="q-badge-check" role="img" aria-label="Answered" />}
      </span>
      <div className="q-card-main">
        <div className="q-title-row">
          <h3 className="q-title" id={`${base}-title`}>{question.title}</h3>
          <button
            type="button"
            className="q-clear"
            disabled={!answered}
            aria-label={`Clear the answer for ${question.title}`}
            onClick={() => clearAnswer(question.id)}
          >
            Clear
          </button>
        </div>
        <span className="q-rule" aria-hidden="true" />
        {question.prompt && <p className="q-prompt" id={`${base}-prompt`}>{question.prompt}</p>}
        {question.options.length > 0 && (
          <ChoiceGroup
            options={question.options}
            value={answer?.choice}
            labelledBy={`${base}-title`}
            onChange={choice => setChoice(question.id, choice)}
          />
        )}
        <textarea
          className="q-input q-textarea"
          rows={2}
          value={answer?.text ?? ''}
          placeholder="Type your response / details…"
          aria-labelledby={`${base}-title`}
          aria-describedby={question.prompt ? `${base}-prompt` : undefined}
          onChange={e => setText(question.id, e.target.value)}
        />
      </div>
    </article>
  );
}

// Single-choice options drawn as buttons rather than native radios: page-flip
// clones a page while it turns, and a cloned checked radio would uncheck the
// real one that shares its group.
function ChoiceGroup({ options, value, labelledBy, onChange }: {
  options: QuestionnaireOption[];
  value?: string;
  labelledBy: string;
  onChange: (id: string) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selected = options.findIndex(o => o.id === value);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step && e.key !== 'Home' && e.key !== 'End') return;
    // Keep arrow keys inside the group instead of turning the page.
    e.preventDefault();
    e.stopPropagation();
    const from = refs.current.findIndex(el => el === document.activeElement);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1
      : (Math.max(0, from) + step + options.length) % options.length;
    refs.current[next]?.focus();
    onChange(options[next].id);
  };

  return (
    <div className="q-choices" role="radiogroup" aria-labelledby={labelledBy} onKeyDown={onKeyDown}>
      {options.map((option, i) => (
        <button
          key={option.id}
          ref={el => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={option.id === value}
          tabIndex={i === (selected >= 0 ? selected : 0) ? 0 : -1}
          className="q-choice"
          onClick={() => onChange(option.id)}
        >
          <span className="q-choice-dot" aria-hidden="true" />
          <span className="q-choice-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

// A labelled blank such as "Client / Company" or "Approval / Signature".
export function FieldRow({ field }: { field: QuestionnaireField }) {
  const { getAnswer, setText } = useQuestionnaire();
  const inputId = `qf-${field.id}`;

  if (field.value) {
    return (
      <div className="q-field is-static">
        <span className="q-field-label">{field.label}</span>
        <span className="q-field-value">{field.value}</span>
      </div>
    );
  }

  return (
    <div className="q-field">
      <label className="q-field-label" htmlFor={inputId}>{field.label}</label>
      <input
        id={inputId}
        className={`q-input q-field-input${field.kind === 'signature' ? ' is-signature' : ''}`}
        type={field.kind === 'date' ? 'date' : 'text'}
        value={getAnswer(field.id)?.text ?? ''}
        placeholder={field.kind === 'signature' ? 'Your full name' : 'Type here…'}
        autoComplete="off"
        onChange={e => setText(field.id, e.target.value)}
      />
    </div>
  );
}
