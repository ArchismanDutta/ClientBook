import type { Questionnaire } from '../../types/questionnaire';
import { allQuestions } from '../../lib/questionnaire/store';
import { LightbulbDoodle } from './Doodles';

export function QuestionnaireCover({ questionnaire }: { questionnaire: Questionnaire }) {
  const questions = allQuestions(questionnaire.sections).length;
  return (
    <div className="cover q-cover">
      <header className="cover-top">
        <span>{questionnaire.brand} Press · Vol. II</span>
        <span className="barcode" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => <i key={i} />)}
        </span>
        <span>MMXXVI · No. 02</span>
      </header>

      <div className="cover-title">
        <h1>
          Client<br />
          <span className="cover-it">Onboarding.</span>
        </h1>
        <p>{questionnaire.title} — {questionnaire.subtitle}.</p>
      </div>

      <div className="q-cover-emblem">
        <LightbulbDoodle />
      </div>

      <div className="cover-bottom">
        <div className="cover-chips">
          <span className="chip chip-pink">{questionnaire.sections.length} Sections</span>
          <span className="chip chip-blue">{questions} Questions</span>
          <span className="chip chip-yellow">Saves as you type</span>
        </div>
        <div className="cover-strip">
          <span className="cover-strip-k">Questionnaire</span>
          <span className="cover-strip-v">Fill Inside →</span>
        </div>
      </div>
    </div>
  );
}

export function QuestionnaireBackCover({ questionnaire }: { questionnaire: Questionnaire }) {
  const questions = allQuestions(questionnaire.sections).length;
  const generated = questionnaire.meta.generatedAt.slice(0, 10);
  return (
    <div className="cover q-back">
      <div className="q-back-inner">
        <p>{questionnaire.brand}</p>
        <p>{questionnaire.title}</p>
        <p>{questionnaire.sections.length} sections · {questions} questions</p>
        <p>Answers stay saved on this device</p>
        <p className="q-back-small">Generated from source DOCX {generated}</p>
      </div>
    </div>
  );
}
