export type FieldKind = 'text' | 'date' | 'signature';

// A single labelled blank, e.g. "Client / Company" or "Approval / Signature".
// `value` is set when the source document already fills it in (read-only).
export type QuestionnaireField = {
  id: string;
  label: string;
  kind: FieldKind;
  value?: string;
};

export type QuestionnaireOption = { id: string; label: string };

export type QuestionnaireQuestion = {
  id: string;        // stable: `${sectionId}--${slug(title)}`
  number: number;    // running number across the whole questionnaire
  title: string;     // "Requirement" column
  prompt: string;    // "What We Need From Client" column
  options: QuestionnaireOption[]; // "Status" column choices
};

export type QuestionnaireSection = {
  id: string;
  number: number;
  title: string;
  intro?: string;
  questions: QuestionnaireQuestion[];
  fields: QuestionnaireField[];
};

export type Questionnaire = {
  brand: string;
  title: string;
  subtitle: string;
  details: QuestionnaireField[];
  note?: { label: string; text: string };
  sections: QuestionnaireSection[];
  meta: { source: string; generatedAt: string };
};

// What the reader typed or picked. Keyed by question or field id.
export type QuestionnaireAnswer = {
  choice?: string;
  text?: string;
  updatedAt: number;
};

export type QuestionnaireAnswers = Record<string, QuestionnaireAnswer>;

// Page-level model used by the questionnaire paginator.
export type QuestionnaireBlock =
  | { type: 'hero' }
  | { type: 'details' }
  | { type: 'note' }
  | { type: 'contents' }
  | { type: 'steps' }
  | { type: 'section'; section: QuestionnaireSection }
  | { type: 'question'; question: QuestionnaireQuestion; section: QuestionnaireSection }
  | { type: 'fields'; section: QuestionnaireSection }
  | { type: 'finale' };

export type QuestionnairePage = {
  blocks: QuestionnaireBlock[];
  pageNumber: number;
  overflow?: boolean; // a block taller than a page scrolls instead of being cut
};
