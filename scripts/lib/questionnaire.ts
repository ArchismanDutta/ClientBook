import { parseFragment, DefaultTreeAdapterMap } from 'parse5';
import type {
  FieldKind,
  Questionnaire,
  QuestionnaireField,
  QuestionnaireOption,
  QuestionnaireSection,
} from '../../src/types/questionnaire';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

// Words kept lowercase when an ALL CAPS heading is converted to title case.
const SMALL_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to']);

// Converts the questionnaire DOCX (already turned into HTML by mammoth) into
// structured data. Expected layout, top to bottom:
//   - title paragraphs (brand, document title, subtitle)
//   - a two-column details table ("Project", "Client / Company", "Date")
//   - a one-cell note table ("SECURITY NOTE: ...")
//   - numbered Heading 1 sections, each with an optional intro paragraph and
//     either a requirements table (Requirement | What We Need | Response | Status)
//     or a two-column sign-off table (label | blank)
export function htmlToQuestionnaire(html: string): Omit<Questionnaire, 'meta'> {
  const root = parseFragment(html) as unknown as Element;
  const preamble: string[] = [];
  const details: QuestionnaireField[] = [];
  const sections: QuestionnaireSection[] = [];
  let note: Questionnaire['note'];
  let section: QuestionnaireSection | null = null;
  let questionNumber = 0;

  for (const child of root.childNodes) {
    if (child.nodeName === '#text') continue;
    const el = child as Element;

    if (el.tagName === 'h1' || el.tagName === 'h2') {
      const heading = clean(textOf(el));
      if (!heading) continue;
      const numbered = heading.match(/^(\d+)[.)]\s*(.+)$/);
      const title = titleCase(numbered ? numbered[2] : heading);
      section = {
        id: uniqueId(slug(title) || `section-${sections.length + 1}`, sections.map(s => s.id)),
        number: numbered ? Number(numbered[1]) : sections.length + 1,
        title,
        questions: [],
        fields: [],
      };
      sections.push(section);
      continue;
    }

    if (el.tagName === 'p') {
      const text = clean(textOf(el));
      if (!text) continue;
      if (section) section.intro = section.intro ? `${section.intro} ${text}` : text;
      else preamble.push(text);
      continue;
    }

    if (el.tagName !== 'table') continue;
    const rows = findAll(el, 'tr').map(tr => cellsOf(tr).map(cellText));
    if (!rows.length) continue;

    const header = rows[0].map(cell => cell.toLowerCase());
    const titleCol = header.findIndex(cell => cell.includes('requirement'));
    if (titleCol >= 0) {
      if (!section) continue;
      const promptCol = header.findIndex(cell => cell.includes('need'));
      const statusCol = header.findIndex(cell => cell.includes('status'));
      for (const row of rows.slice(1)) {
        const title = clean(row[titleCol] ?? '');
        if (!title) continue;
        questionNumber += 1;
        section.questions.push({
          id: uniqueId(`${section.id}--${slug(title)}`, section.questions.map(q => q.id)),
          number: questionNumber,
          title,
          prompt: clean(row[promptCol] ?? ''),
          options: parseOptions(statusCol >= 0 ? row[statusCol] ?? '' : ''),
        });
      }
      continue;
    }

    if (rows.length === 1 && rows[0].length === 1) {
      const raw = clean(rows[0][0]);
      const labelled = raw.match(/^([^:]{2,40}):\s*(.+)$/);
      const parsed = labelled
        ? { label: sentenceCase(labelled[1]), text: labelled[2] }
        : { label: 'Note', text: raw };
      if (!section && !note) note = parsed;
      else if (section) section.intro = section.intro ? `${section.intro} ${parsed.text}` : parsed.text;
      continue;
    }

    const prefix = section ? section.id : 'details';
    const target = section ? section.fields : details;
    for (const row of rows) {
      const label = clean(row[0] ?? '');
      if (!label) continue;
      const value = clean(row[1] ?? '');
      target.push({
        id: uniqueId(`${prefix}--${slug(label)}`, target.map(f => f.id)),
        label,
        kind: fieldKind(label),
        ...(value ? { value } : {}),
      });
    }
  }

  const [brand = 'Questionnaire', title = brand, ...rest] = preamble.map(titleCase);
  return {
    brand,
    title,
    subtitle: rest.join(' '),
    details,
    ...(note ? { note } : {}),
    sections,
  };
}

// "[ ] Ready\n[ ] Pending\n[ ] N/A" -> Ready / Pending / N/A
export function parseOptions(text: string): QuestionnaireOption[] {
  const marker = /\[\s*[xX✓]?\s*\]|[☐☑☒]/;
  const labels = text
    .split(marker.test(text) ? marker : /\n/)
    .map(part => clean(part))
    .filter(Boolean);
  const seen: string[] = [];
  return labels.map(label => {
    const id = uniqueId(slug(label) || 'option', seen);
    seen.push(id);
    return { id, label };
  });
}

function fieldKind(label: string): FieldKind {
  if (/signature/i.test(label)) return 'signature';
  if (/\bdate\b/i.test(label)) return 'date';
  return 'text';
}

function titleCase(text: string): string {
  if (text !== text.toUpperCase() || !/[A-Z]/.test(text)) return text;
  return text
    .toLowerCase()
    .split(/(\s+)/)
    .map((word, i) => (i > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');
}

function sentenceCase(text: string): string {
  const lower = clean(text).toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function slug(text: string): string {
  return text.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function uniqueId(base: string, taken: string[]): string {
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

// Text of a table cell, keeping line breaks so status options stay separable.
function cellText(cell: Element): string {
  return textOf(cell, true).trim();
}

function textOf(node: Node, keepBreaks = false): string {
  let s = '';
  if ('childNodes' in node && node.childNodes) {
    for (const c of node.childNodes) {
      if (c.nodeName === '#text') s += (c as unknown as { value: string }).value;
      else if (c.nodeName === 'br') s += keepBreaks ? '\n' : ' ';
      else if (c.nodeName === 'p' && keepBreaks) s += `${textOf(c, true)}\n`;
      else s += textOf(c, keepBreaks);
    }
  }
  return s;
}

// Cells of one table row, in document order.
function cellsOf(row: Element): Element[] {
  return row.childNodes.filter((c): c is Element => c.nodeName === 'td' || c.nodeName === 'th');
}

function findAll(root: Element, tagName: string): Element[] {
  const out: Element[] = [];
  function visit(node: Node) {
    if ('childNodes' in node && node.childNodes) {
      for (const c of node.childNodes) {
        if (c.nodeName === '#text') continue;
        const el = c as Element;
        if (el.tagName === tagName) out.push(el);
        visit(el);
      }
    }
  }
  visit(root);
  return out;
}
