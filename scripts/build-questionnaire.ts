import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';
import { htmlToQuestionnaire } from './lib/questionnaire';
import type { Questionnaire } from '../src/types/questionnaire';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const DOCX_NAME = 'Preneur_Gate_Client_Onboarding_Questionnaire_Revised.docx';
const DOCX_PATH = path.join(REPO_ROOT, DOCX_NAME);
const OUT_JSON = path.join(REPO_ROOT, 'src/content/questionnaire.json');

async function run() {
  console.log('Parsing', DOCX_NAME);
  const buffer = await readFile(DOCX_PATH);
  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading1'] => h1",
        "p[style-name='Heading 2'] => h2",
        "p[style-name='Heading2'] => h2",
      ],
    },
  );

  const parsed = htmlToQuestionnaire(html);
  const questions = parsed.sections.reduce((n, s) => n + s.questions.length, 0);
  if (!questions) throw new Error('No requirement rows found — check the table headings in the DOCX.');

  const questionnaire: Questionnaire = {
    ...parsed,
    meta: { source: DOCX_NAME, generatedAt: new Date().toISOString() },
  };

  await mkdir(path.dirname(OUT_JSON), { recursive: true });
  await writeFile(OUT_JSON, JSON.stringify(questionnaire, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${OUT_JSON} — ${parsed.sections.length} sections, ${questions} questions`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
