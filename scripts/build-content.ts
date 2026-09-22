import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';
import sharp from 'sharp';
import { htmlToBlocks } from './lib/blocks';
import type { Book, Section, Block } from '../src/types/book';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const DOCX_PATH = path.join(REPO_ROOT, 'Preneur_Gate_Detailed_SOW_Updated_Architecture.docx');
const OUT_JSON = path.join(REPO_ROOT, 'src/content/book.json');
const IMG_DIR = path.join(REPO_ROOT, 'public/assets/book-images');

async function run() {
  console.log('Parsing', path.basename(DOCX_PATH));

  await mkdir(IMG_DIR, { recursive: true });
  await mkdir(path.dirname(OUT_JSON), { recursive: true });

  const buffer = await readFile(DOCX_PATH);

  let imgCounter = 0;
  const { value: html } = await mammoth.convertToHtml(
    { buffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading1'] => h1",
        "p[style-name='Heading 2'] => h2",
        "p[style-name='Heading2'] => h2",
        "p[style-name='List Bullet'] => ul > li:fresh",
        "p[style-name='ListBullet'] => ul > li:fresh",
        "p[style-name='List Number'] => ol > li:fresh",
        "p[style-name='ListNumber'] => ol > li:fresh",
      ],
      convertImage: mammoth.images.imgElement(async (image) => {
        const buf = await image.read();
        imgCounter++;
        const name = `img-${String(imgCounter).padStart(3, '0')}.webp`;
        const outPath = path.join(IMG_DIR, name);
        const meta = await sharp(buf).metadata();
        const pipeline = sharp(buf).webp({ quality: 82 });
        if ((meta.width ?? 0) > 1400) pipeline.resize({ width: 1400 });
        const finalMeta = await pipeline.toFile(outPath);
        return {
          src: `assets/book-images/${name}`,
          alt: image.altText ?? '',
          width: String(finalMeta.width),
          height: String(finalMeta.height),
        };
      }),
    },
  );

  const blocks = htmlToBlocks(html);
  const sections = groupIntoSections(blocks);

  const book: Book = {
    title: 'Preneur Gate',
    subtitle: 'Detailed Statement of Work',
    meta: {
      version: '1.1',
      date: '22 September 2026',
      imprint: 'Preneur Gate Press',
      generatedAt: new Date().toISOString(),
    },
    sections,
  };

  await writeFile(OUT_JSON, JSON.stringify(book, null, 2), 'utf8');
  console.log(`Wrote ${OUT_JSON} — ${sections.length} sections, ${blocks.length} blocks, ${imgCounter} images`);
}

function groupIntoSections(blocks: Block[]): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const b of blocks) {
    if (b.type === 'heading' && b.level === 1) {
      current = { id: b.id, level: 1, title: b.text, blocks: [] };
      sections.push(current);
      continue;
    }
    if (!current) {
      current = { id: 'front-matter', level: 1, title: 'Front Matter', blocks: [] };
      sections.push(current);
    }
    current.blocks.push(b);
  }
  return sections;
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
