import type { ReactNode } from 'react';
import type { Questionnaire, QuestionnaireBlock, QuestionnairePage, QuestionnaireSection } from '../../types/questionnaire';
import { allQuestions, countAnswered, sectionProgress } from '../../lib/questionnaire/store';
import { answersToText, downloadText } from '../../lib/questionnaire/export';
import { useQuestionnaire } from './QuestionnaireProvider';
import { FieldRow, QuestionCard, pad2, toneFor } from './QuestionCard';
import { BrushSquiggle, BrushUnderline, DownloadIcon, LightbulbDoodle, PaperPlane, TickBurst } from './Doodles';

type PageProps = {
  page: QuestionnairePage;
  total: number;
  questionnaire: Questionnaire;
  sectionPages: Record<string, number>;
  onJump: (pageNumber: number) => void;
};

// One inner page of the questionnaire book. The same component renders the
// visible leaves and the off-screen copy the paginator measures.
export function QuestionnairePageView({ page, total, questionnaire, sectionPages, onJump }: PageProps) {
  const hero = page.blocks[0]?.type === 'hero';
  const finale = page.blocks.some(b => b.type === 'finale');

  return (
    // Odd pages sit on the left of a spread, even pages on the right.
    <div className="q-page" data-hero={hero || undefined} data-finale={finale || undefined} data-side={page.pageNumber % 2 ? 'left' : 'right'}>
      {!hero && <RunningHead brand={questionnaire.brand} />}
      <div
        className={`q-body${page.overflow ? ' q-body-scroll' : ''}`}
        tabIndex={page.overflow ? 0 : undefined}
        role={page.overflow ? 'region' : undefined}
        aria-label={page.overflow ? 'Scrollable page content' : undefined}
      >
        {groupPanels(page.blocks).map((group, i) => group.panel
          ? <div className="q-panel" key={i}>{group.blocks.map((b, j) => <Block key={j} block={b} {...{ questionnaire, sectionPages, onJump }} />)}</div>
          : <Block key={i} block={group.blocks[0]} {...{ questionnaire, sectionPages, onJump }} />)}
      </div>
      <footer className="q-foot">
        <span>{page.overflow ? 'Scroll to see more' : 'Client onboarding'}</span>
        <span className="n">{page.pageNumber}</span>
        <span>of {total}</span>
      </footer>
      {finale && <><BrushSquiggle className="q-deco-squiggle" /><TickBurst className="q-deco-burst" /></>}
    </div>
  );
}

// Questions, section headings and blanks share one rounded panel per page,
// as in the reference design; the hero, notes and banner sit outside it.
function groupPanels(blocks: QuestionnaireBlock[]) {
  const groups: { panel: boolean; blocks: QuestionnaireBlock[] }[] = [];
  for (const block of blocks) {
    const panel = block.type === 'details' || block.type === 'section' || block.type === 'question' || block.type === 'fields';
    const last = groups[groups.length - 1];
    if (panel && last?.panel) last.blocks.push(block);
    else groups.push({ panel, blocks: [block] });
  }
  return groups;
}

function Block({ block, questionnaire, sectionPages, onJump }: { block: QuestionnaireBlock } & Omit<PageProps, 'page' | 'total'>) {
  switch (block.type) {
    case 'hero': return <Hero questionnaire={questionnaire} />;
    case 'details': return <div className="q-details">{questionnaire.details.map(f => <FieldRow key={f.id} field={f} />)}</div>;
    case 'note': return questionnaire.note ? <Note label={questionnaire.note.label}>{questionnaire.note.text}</Note> : null;
    case 'contents': return <Contents questionnaire={questionnaire} sectionPages={sectionPages} onJump={onJump} />;
    case 'steps': return <Steps questionnaire={questionnaire} />;
    case 'section': return <SectionHeader section={block.section} />;
    case 'question': return <QuestionCard question={block.question} />;
    case 'fields': return <div className="q-signoff">{block.section.fields.map(f => <FieldRow key={f.id} field={f} />)}</div>;
    case 'finale': return <Finale questionnaire={questionnaire} />;
  }
}

function RunningHead({ brand }: { brand: string }) {
  return (
    <header className="q-head">
      <span className="q-lockup q-lockup-sm"><img src="/assets/logo.png" alt={brand} /></span>
      <Nav />
    </header>
  );
}

function Nav() {
  return (
    <span className="q-nav" aria-hidden="true">
      Build<i>/</i>Learn<i>/</i>Grow
    </span>
  );
}

function Hero({ questionnaire }: { questionnaire: Questionnaire }) {
  return (
    <div className="q-hero">
      <div className="q-hero-top">
        <span className="q-lockup"><img src="/assets/logo.png" alt={questionnaire.brand} /></span>
        <Nav />
      </div>
      <div className="q-hero-title-row">
        <h1 className="q-hero-title">Questionnaire</h1>
        <LightbulbDoodle className="q-hero-bulb" />
      </div>
      <BrushUnderline className="q-hero-brush" />
      <p className="q-hero-sub">
        <span>{questionnaire.title}.</span>{' '}
        {questionnaire.subtitle && <span>{questionnaire.subtitle}.</span>}
      </p>
    </div>
  );
}

function Note({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="q-note">
      <span className="q-note-label">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        {label}
      </span>
      <p className="q-note-text">{children}</p>
    </aside>
  );
}

function Contents({ questionnaire, sectionPages, onJump }: Omit<PageProps, 'page' | 'total'>) {
  const { answers } = useQuestionnaire();
  const questions = allQuestions(questionnaire.sections);
  const answered = countAnswered(questions.map(q => q.id), answers);
  const pct = questions.length ? Math.round((answered / questions.length) * 100) : 0;

  return (
    <div className="q-contents">
      <span className="q-kicker">Inside this questionnaire</span>
      <h2 className="q-contents-title">Sections.</h2>
      <ol className="q-contents-list">
        {questionnaire.sections.map(section => {
          const progress = sectionProgress(section, answers);
          const target = sectionPages[section.id];
          return (
            <li key={section.id}>
              <button type="button" className="q-contents-entry" disabled={!target} onClick={() => target && onJump(target)}>
                <span className="q-dot" data-tone={toneFor(section.number)}>{pad2(section.number)}</span>
                <span className="q-contents-name">{section.title}</span>
                <span className="q-contents-count" aria-label={`${progress.answered} of ${progress.total} answered`}>{progress.answered}/{progress.total}</span>
                <span className="q-contents-page">{target ?? '–'}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="q-progress">
        <span className="q-progress-track"><span className="q-progress-fill" style={{ width: `${pct}%` }} /></span>
        <span className="q-progress-label">{answered} of {questions.length} answered</span>
      </div>
    </div>
  );
}

function Steps({ questionnaire }: { questionnaire: Questionnaire }) {
  const statuses = allQuestions(questionnaire.sections)[0]?.options.map(o => o.label) ?? [];
  const statusText = statuses.length > 1 ? `${statuses.slice(0, -1).join(', ')} or ${statuses[statuses.length - 1]}` : statuses[0];
  return (
    <ol className="q-steps" aria-label="How to fill this in">
      {statusText && <li>Pick a status for each item — {statusText}.</li>}
      <li>Type the details in the box under each question.</li>
      <li>Answers save on this device as you type. Edit or clear them any time.</li>
    </ol>
  );
}

function SectionHeader({ section }: { section: QuestionnaireSection }) {
  const { answers } = useQuestionnaire();
  const progress = sectionProgress(section, answers);
  return (
    <header className="q-section">
      <div className="q-section-top">
        <span className="q-kicker" data-tone={toneFor(section.number)}>Section {pad2(section.number)}</span>
        <span className="q-section-count">{progress.answered}/{progress.total} answered</span>
      </div>
      <h2 className="q-section-title">{section.title}</h2>
      {section.intro && <p className="q-section-intro">{section.intro}</p>}
    </header>
  );
}

function Finale({ questionnaire }: { questionnaire: Questionnaire }) {
  const { answers } = useQuestionnaire();
  const questions = allQuestions(questionnaire.sections);
  const answered = countAnswered(questions.map(q => q.id), answers);
  const download = () => downloadText(
    `${questionnaire.brand} - ${questionnaire.title} - answers.txt`.replace(/[\\/:*?"<>|]+/g, '-'),
    answersToText(questionnaire, answers),
  );

  return (
    <div className="q-finale">
      <div className="q-banner">
        <PaperPlane className="q-banner-plane" />
        <div className="q-banner-copy">
          <strong className="q-banner-title">Your Journey Matters</strong>
          <span className="q-banner-sub">Let’s build your tomorrow, together.</span>
        </div>
        <button type="button" className="q-banner-btn" onClick={download} aria-label="Download your answers" title="Download your answers as a text file">
          Download <DownloadIcon />
        </button>
      </div>
      <p className="q-finale-note">{answered} of {questions.length} questions answered · saved on this device</p>
    </div>
  );
}
