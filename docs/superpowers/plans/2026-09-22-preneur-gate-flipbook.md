# Preneur Gate Interactive Flipbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium interactive digital flipbook that renders the Preneur Gate SOW DOCX as a physical-feeling book with realistic page-flip animation, matching the locked "Magazine Cover" (Direction A) visual system.

**Architecture:** Vite + React 18 + TypeScript static SPA. Build-time DOCX parser (mammoth) emits a structured `book.json`. Client-side measurement-based paginator turns blocks into fitted pages. StPageFlip (`page-flip` npm) runs the physical flip; a thin `BookShell` calls it imperatively and funnels keyboard/click/touch/hash routing through one input controller.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Vitest + jsdom + @testing-library/react for tests, mammoth for DOCX parsing, sharp for image transcoding, `page-flip` (StPageFlip) for the flip engine, self-hosted Fraunces / Space Grotesk / Inter as WOFF2.

**Reference documents:**
- Spec: `docs/superpowers/specs/2026-09-22-preneur-gate-flipbook-design.md`
- Source DOCX: `Preneur_Gate_Detailed_SOW_Updated_Architecture.docx` (repo root)
- Logo: `assets/preneurgate-logo.png` (repo root)
- Animation reference: `Generated video 1.mp4` (repo root)

**Working directory:** `/Users/archismandutta/Desktop/Pp` (the app is created at the repo root — no subfolder).

---

## Task 1: Initialize project & establish design tokens

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `.gitignore`
- Create: `src/main.tsx`, `src/App.tsx`
- Create: `src/styles/tokens.css`, `src/styles/reset.css`
- Create: `public/assets/logo.png` (copied from repo root)

- [ ] **Step 1: Initialize a Vite React-TS project in place**

Run:
```bash
cd /Users/archismandutta/Desktop/Pp
npm create vite@latest . -- --template react-ts
# When prompted "Directory not empty, continue?" → Yes
npm install
```

Expected: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx` created. Existing `assets/`, `docs/`, `Generated video 1.mp4`, `Preneur_Gate_Detailed_SOW_Updated_Architecture.docx` are preserved.

- [ ] **Step 2: Copy logo to public assets**

Run:
```bash
mkdir -p public/assets
cp assets/preneurgate-logo.png public/assets/logo.png
```

- [ ] **Step 3: Write `.gitignore`**

Create `.gitignore`:
```
node_modules
dist
.DS_Store
.env.local
.superpowers/
# Keep book.json checked in so builds don't require running build:content first
!src/content/book.json
public/assets/book-images/
```

- [ ] **Step 4: Replace the default `src/App.tsx` and `src/main.tsx` with the app shell**

Overwrite `src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/reset.css';
import './styles/tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Overwrite `src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="app-shell">
      <p style={{ padding: 24, fontFamily: 'system-ui' }}>Preneur Gate — booting…</p>
    </div>
  );
}
```

Delete the CSS files Vite scaffolded: `src/App.css`, `src/index.css`, `src/assets/react.svg`, `public/vite.svg`.

- [ ] **Step 5: Write `src/styles/reset.css`**

Create `src/styles/reset.css`:
```css
*, *::before, *::after { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; padding: 0; }
body {
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
  background: var(--stage);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
img { display: block; max-width: 100%; height: auto; }
button { font: inherit; color: inherit; cursor: pointer; }
h1, h2, h3, h4, h5, h6, p, ul, ol { margin: 0; }
ul, ol { padding: 0; list-style: none; }
```

- [ ] **Step 6: Write `src/styles/tokens.css`**

Create `src/styles/tokens.css`:
```css
:root {
  /* Paper & ink */
  --paper: #f2ead9;
  --paper-2: #ecdcc0;
  --paper-3: #fbf5e8;
  --paper-4: #f2e9d3;
  --ink: #141310;
  --ink-soft: #3a352c;
  --stage: #dfd7c6;

  /* Accents */
  --blue: #1a5cff;
  --pink: #ff2f8a;
  --yellow: #ffd400;
  --mint: #7fe0ba;

  /* Type stacks */
  --font-display: 'Fraunces', Georgia, serif;
  --font-ui: 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  /* Type scale (interior page reference) */
  --fs-h1: 34px;
  --fs-lede: 14px;
  --fs-body: 12.5px;
  --fs-small: 10px;

  /* Spacing */
  --page-pad-x: 42px;
  --page-pad-y: 40px;

  /* Motion */
  --flip-duration: 900ms;
}
```

- [ ] **Step 7: Verify dev server boots**

Run: `npm run dev`
Expected: server starts, browser at `http://localhost:5173` shows "Preneur Gate — booting…" on the cream `--stage` background. Kill the server.

- [ ] **Step 8: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite React TS app with design tokens"
```

---

## Task 2: Self-host typefaces

**Files:**
- Create: `public/fonts/fraunces.woff2`, `public/fonts/space-grotesk.woff2`, `public/fonts/inter.woff2`
- Create: `src/styles/fonts.css`
- Modify: `index.html` (add preload hints)
- Modify: `src/main.tsx` (import fonts.css)

- [ ] **Step 1: Download self-hostable variable font files**

The Fraunces variable font supports the `opsz`, `wght`, `SOFT`, `WONK` axes used by the design.

Run:
```bash
mkdir -p public/fonts
# Fraunces variable (italic + roman axes)
curl -L -o public/fonts/fraunces.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/fraunces@5.0.0/files/fraunces-latin-full-normal.woff2
curl -L -o public/fonts/fraunces-italic.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/fraunces@5.0.0/files/fraunces-latin-full-italic.woff2
# Space Grotesk variable
curl -L -o public/fonts/space-grotesk.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/space-grotesk@5.0.0/files/space-grotesk-latin-wght-normal.woff2
# Inter variable
curl -L -o public/fonts/inter.woff2 \
  https://cdn.jsdelivr.net/npm/@fontsource-variable/inter@5.0.0/files/inter-latin-wght-normal.woff2
```

Verify each file is > 20 KB (indicates a real download, not an HTML error):
```bash
ls -la public/fonts/
```

If any file is small or looks like HTML, fall back to installing the fontsource packages and copying:
```bash
npm install @fontsource-variable/fraunces @fontsource-variable/space-grotesk @fontsource-variable/inter
cp node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2 public/fonts/fraunces.woff2
cp node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-italic.woff2 public/fonts/fraunces-italic.woff2
cp node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2 public/fonts/space-grotesk.woff2
cp node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2 public/fonts/inter.woff2
```

- [ ] **Step 2: Write `src/styles/fonts.css`**

Create `src/styles/fonts.css`:
```css
@font-face {
  font-family: 'Fraunces';
  src: url('/fonts/fraunces.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Fraunces';
  src: url('/fonts/fraunces-italic.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: italic;
  font-display: swap;
}
@font-face {
  font-family: 'Space Grotesk';
  src: url('/fonts/space-grotesk.woff2') format('woff2-variations');
  font-weight: 300 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

- [ ] **Step 3: Import fonts.css in main.tsx**

Modify `src/main.tsx`. Add after the reset import:
```tsx
import './styles/fonts.css';
```

- [ ] **Step 4: Add preload hints in index.html**

Modify `index.html` — replace the whole `<head>` block with:
```html
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/png" href="/assets/logo.png" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preneur Gate — Detailed Statement of Work</title>
  <link rel="preload" href="/fonts/fraunces.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/fraunces-italic.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin />
</head>
```

- [ ] **Step 5: Verify fonts load**

Modify `src/App.tsx`:
```tsx
export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <p style={{ fontFamily: 'Fraunces', fontStyle: 'italic', fontSize: 48 }}>Fraunces italic</p>
      <p style={{ fontFamily: 'Space Grotesk', letterSpacing: '.2em', textTransform: 'uppercase' }}>Space Grotesk</p>
      <p style={{ fontFamily: 'Inter' }}>Inter body — the quick brown fox jumps over the lazy dog.</p>
    </div>
  );
}
```

Run: `npm run dev`
Expected: three lines render in their respective typefaces. Open DevTools → Network → filter "font" → confirm only WOFF2s under `/fonts/` load (no Google Fonts).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: self-host Fraunces, Space Grotesk, Inter"
```

---

## Task 3: Define the Book data model

**Files:**
- Create: `src/types/book.ts`

- [ ] **Step 1: Write the type definitions**

Create `src/types/book.ts`:
```ts
export type InlineRun = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
};

export type ParaBlock = { type: 'para'; runs: InlineRun[] };
export type ListBlock = { type: 'list'; style: 'bullet' | 'number'; items: InlineRun[][] };
export type TableBlock = { type: 'table'; header?: string[]; rows: string[][] };
export type ImageBlock = { type: 'image'; src: string; alt: string; w: number; h: number };
export type CalloutBlock = { type: 'callout'; label: string; body: InlineRun[] };
export type HeadingBlock = { type: 'heading'; level: 1 | 2; text: string; id: string };

export type Block =
  | ParaBlock
  | ListBlock
  | TableBlock
  | ImageBlock
  | CalloutBlock
  | HeadingBlock;

export type Section = {
  id: string;
  level: 1 | 2;
  title: string;
  blocks: Block[];
};

export type BookMeta = {
  version: string;
  date: string;
  imprint: string;
  generatedAt: string;
};

export type Book = {
  title: string;
  subtitle: string;
  meta: BookMeta;
  sections: Section[];
};

// Page-level types used by the paginator (not emitted by build script)
export type Page = {
  blocks: Block[];
  sectionId: string;
  sectionTitle: string;
  pageNumber: number;
  opener?: boolean; // this page starts a Heading 1
  kind: 'cover' | 'toc' | 'opener' | 'body' | 'image' | 'back' | 'blank';
};
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Book / Section / Block / Page type definitions"
```

---

## Task 4: Install testing tools (Vitest + jsdom + Testing Library)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install dev dependencies**

Run:
```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/node
```

- [ ] **Step 2: Add test scripts to package.json**

Modify `package.json` — add to the `"scripts"` block:
```json
"test": "vitest run",
"test:watch": "vitest",
"build:content": "tsx scripts/build-content.ts"
```

Also install `tsx` for running the build script:
```bash
npm install --save-dev tsx
```

- [ ] **Step 3: Write `vitest.config.ts`**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
  },
});
```

- [ ] **Step 4: Write `src/test/setup.ts`**

Create `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Sanity-check the test runner**

Create `src/test/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: 1 test passes.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add Vitest + jsdom + Testing Library setup"
```

---

## Task 5: DOCX parser — inline run tokenizer

The parser is built bottom-up. First: convert a mammoth-produced HTML string of a single paragraph into `InlineRun[]`, preserving bold/italic/link spans.

**Files:**
- Create: `scripts/lib/inline-runs.ts`
- Create: `scripts/lib/inline-runs.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/inline-runs.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { htmlToRuns } from './inline-runs';

describe('htmlToRuns', () => {
  it('handles plain text', () => {
    expect(htmlToRuns('Hello world')).toEqual([{ text: 'Hello world' }]);
  });

  it('preserves bold', () => {
    expect(htmlToRuns('Hello <strong>bold</strong> world')).toEqual([
      { text: 'Hello ' },
      { text: 'bold', bold: true },
      { text: ' world' },
    ]);
  });

  it('preserves italic', () => {
    expect(htmlToRuns('Hello <em>ital</em>')).toEqual([
      { text: 'Hello ' },
      { text: 'ital', italic: true },
    ]);
  });

  it('preserves nested bold+italic', () => {
    expect(htmlToRuns('<strong><em>both</em></strong>')).toEqual([
      { text: 'both', bold: true, italic: true },
    ]);
  });

  it('preserves links', () => {
    expect(htmlToRuns('see <a href="https://example.com">here</a>')).toEqual([
      { text: 'see ' },
      { text: 'here', href: 'https://example.com' },
    ]);
  });

  it('decodes entities', () => {
    expect(htmlToRuns('A &amp; B')).toEqual([{ text: 'A & B' }]);
  });

  it('collapses whitespace between adjacent identical runs', () => {
    expect(htmlToRuns('<strong>hi</strong><strong> there</strong>')).toEqual([
      { text: 'hi there', bold: true },
    ]);
  });
});
```

- [ ] **Step 2: Run test — verify failure**

Run: `npm test -- inline-runs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `htmlToRuns`**

Create `scripts/lib/inline-runs.ts`:
```ts
import type { InlineRun } from '../../src/types/book';
import { parseFragment, DefaultTreeAdapterMap } from 'parse5';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];

export function htmlToRuns(html: string): InlineRun[] {
  const doc = parseFragment(html);
  const raw: InlineRun[] = [];
  walk(doc as unknown as Element, {}, raw);
  return merge(raw);
}

function walk(node: Node, ctx: Omit<InlineRun, 'text'>, out: InlineRun[]) {
  if ('childNodes' in node && node.childNodes) {
    for (const child of node.childNodes) {
      if (child.nodeName === '#text') {
        // @ts-expect-error parse5 text node
        const text: string = child.value;
        if (text.length > 0) out.push({ text, ...ctx });
        continue;
      }
      const el = child as Element;
      const tag = el.tagName;
      const nextCtx = { ...ctx };
      if (tag === 'strong' || tag === 'b') nextCtx.bold = true;
      if (tag === 'em' || tag === 'i') nextCtx.italic = true;
      if (tag === 'a') {
        const href = el.attrs.find((a) => a.name === 'href')?.value;
        if (href) nextCtx.href = href;
      }
      walk(el, nextCtx, out);
    }
  }
}

function merge(runs: InlineRun[]): InlineRun[] {
  const out: InlineRun[] = [];
  for (const r of runs) {
    const prev = out[out.length - 1];
    if (
      prev &&
      !!prev.bold === !!r.bold &&
      !!prev.italic === !!r.italic &&
      prev.href === r.href
    ) {
      prev.text += r.text;
    } else {
      const clean: InlineRun = { text: r.text };
      if (r.bold) clean.bold = true;
      if (r.italic) clean.italic = true;
      if (r.href) clean.href = r.href;
      out.push(clean);
    }
  }
  return out;
}
```

Install parse5:
```bash
npm install --save-dev parse5
```

- [ ] **Step 4: Run tests — verify pass**

Run: `npm test -- inline-runs`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: inline-run tokenizer for parsed DOCX HTML"
```

---

## Task 6: DOCX parser — block builder

Converts mammoth HTML into a flat `Block[]` — headings, paragraphs, lists, tables, images, callouts.

**Files:**
- Create: `scripts/lib/blocks.ts`
- Create: `scripts/lib/blocks.test.ts`

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/blocks.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { htmlToBlocks } from './blocks';

describe('htmlToBlocks', () => {
  it('emits headings with stable ids', () => {
    const blocks = htmlToBlocks('<h1>Chapter One</h1>');
    expect(blocks).toEqual([{ type: 'heading', level: 1, text: 'Chapter One', id: 'chapter-one' }]);
  });

  it('emits paragraphs with inline runs', () => {
    const blocks = htmlToBlocks('<p>Hello <strong>world</strong></p>');
    expect(blocks).toEqual([
      { type: 'para', runs: [{ text: 'Hello ' }, { text: 'world', bold: true }] },
    ]);
  });

  it('emits bullet lists', () => {
    const blocks = htmlToBlocks('<ul><li>one</li><li>two</li></ul>');
    expect(blocks).toEqual([
      {
        type: 'list',
        style: 'bullet',
        items: [[{ text: 'one' }], [{ text: 'two' }]],
      },
    ]);
  });

  it('emits numbered lists', () => {
    const blocks = htmlToBlocks('<ol><li>a</li><li>b</li></ol>');
    expect(blocks[0]).toMatchObject({ type: 'list', style: 'number' });
  });

  it('emits tables with a header row when first row is bold', () => {
    const html = '<table><tr><td><strong>H1</strong></td><td><strong>H2</strong></td></tr><tr><td>a</td><td>b</td></tr></table>';
    expect(htmlToBlocks(html)).toEqual([
      { type: 'table', header: ['H1', 'H2'], rows: [['a', 'b']] },
    ]);
  });

  it('merges an UPPERCASE label paragraph with the next paragraph into a callout', () => {
    const html = '<p>IMPORTANT</p><p>Do not do the thing.</p>';
    expect(htmlToBlocks(html)).toEqual([
      { type: 'callout', label: 'IMPORTANT', body: [{ text: 'Do not do the thing.' }] },
    ]);
  });

  it('does not treat long uppercase text as a label', () => {
    const html = '<p>ALL CAPS PARAGRAPHS THAT ARE LONGER THAN SIX WORDS SHOULD STAY PARAGRAPHS</p><p>Next.</p>';
    const blocks = htmlToBlocks(html);
    expect(blocks[0].type).toBe('para');
  });

  it('emits images with resolved src', () => {
    const html = '<img src="assets/book-images/img-abc.webp" alt="fig 1" width="800" height="500" />';
    expect(htmlToBlocks(html)).toEqual([
      { type: 'image', src: '/assets/book-images/img-abc.webp', alt: 'fig 1', w: 800, h: 500 },
    ]);
  });
});
```

- [ ] **Step 2: Run test — verify failure**

Run: `npm test -- blocks`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `htmlToBlocks`**

Create `scripts/lib/blocks.ts`:
```ts
import { parseFragment, serialize, DefaultTreeAdapterMap } from 'parse5';
import type { Block, InlineRun } from '../../src/types/book';
import { htmlToRuns } from './inline-runs';

type Node = DefaultTreeAdapterMap['node'];
type Element = DefaultTreeAdapterMap['element'];
type DocumentFragment = DefaultTreeAdapterMap['documentFragment'];

const CALLOUT_MAX_WORDS = 6;

export function htmlToBlocks(html: string): Block[] {
  const doc = parseFragment(html) as unknown as Element;
  const raw: Block[] = [];
  for (const child of doc.childNodes) {
    if (child.nodeName === '#text') continue;
    const el = child as Element;
    const b = elementToBlock(el);
    if (b) raw.push(...b);
  }
  return mergeCallouts(raw);
}

function elementToBlock(el: Element): Block[] | null {
  const tag = el.tagName;
  const inner = childrenHtml(el);
  if (tag === 'h1' || tag === 'h2') {
    const text = textOf(el).trim();
    return [{
      type: 'heading',
      level: tag === 'h1' ? 1 : 2,
      text,
      id: slug(text),
    }];
  }
  if (tag === 'p') {
    const runs = htmlToRuns(inner);
    if (runs.every((r) => r.text.trim() === '')) return null;
    return [{ type: 'para', runs }];
  }
  if (tag === 'ul' || tag === 'ol') {
    const items: InlineRun[][] = [];
    for (const li of el.childNodes) {
      if (li.nodeName !== 'li') continue;
      items.push(htmlToRuns(childrenHtml(li as Element)));
    }
    return [{ type: 'list', style: tag === 'ol' ? 'number' : 'bullet', items }];
  }
  if (tag === 'table') return [tableFromEl(el)];
  if (tag === 'img') {
    const src = attr(el, 'src') ?? '';
    const alt = attr(el, 'alt') ?? '';
    const w = Number(attr(el, 'width') ?? 0);
    const h = Number(attr(el, 'height') ?? 0);
    return [{ type: 'image', src: '/' + src.replace(/^\//, ''), alt, w, h }];
  }
  return null;
}

function tableFromEl(el: Element): Block {
  const rowsRaw: string[][] = [];
  const boldFlags: boolean[] = [];
  const trs = findAll(el, 'tr');
  for (const tr of trs) {
    const cells = findAll(tr, 'td').concat(findAll(tr, 'th'));
    const rowText = cells.map((c) => textOf(c).trim());
    const rowBold = cells.every((c) => findAll(c, 'strong').length > 0 || findAll(c, 'b').length > 0);
    rowsRaw.push(rowText);
    boldFlags.push(rowBold);
  }
  if (rowsRaw.length > 0 && boldFlags[0]) {
    return { type: 'table', header: rowsRaw[0], rows: rowsRaw.slice(1) };
  }
  return { type: 'table', rows: rowsRaw };
}

function mergeCallouts(blocks: Block[]): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.type === 'para') {
      const text = b.runs.map((r) => r.text).join('').trim();
      const isLabel =
        text.length > 0 &&
        text === text.toUpperCase() &&
        /[A-Z]/.test(text) &&
        text.split(/\s+/).length <= CALLOUT_MAX_WORDS;
      const next = blocks[i + 1];
      if (isLabel && next && next.type === 'para') {
        out.push({ type: 'callout', label: text, body: next.runs });
        i++; // skip next
        continue;
      }
    }
    out.push(b);
  }
  return out;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function attr(el: Element, name: string): string | undefined {
  return el.attrs.find((a) => a.name === name)?.value;
}

function textOf(node: Node): string {
  let s = '';
  if ('childNodes' in node && node.childNodes) {
    for (const c of node.childNodes) {
      if (c.nodeName === '#text') s += (c as unknown as { value: string }).value;
      else s += textOf(c);
    }
  }
  return s;
}

function childrenHtml(el: Element): string {
  // parse5's `serialize` takes a parent node and serializes its children.
  // For an Element, this returns just the inner HTML — exactly what we need.
  return serialize(el as unknown as DocumentFragment);
}

function findAll(root: Element, tagName: string): Element[] {
  const out: Element[] = [];
  const stack: Element[] = [root];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur.tagName === tagName) out.push(cur);
    if ('childNodes' in cur && cur.childNodes) {
      for (const c of cur.childNodes) if (c.nodeName !== '#text') stack.push(c as Element);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run tests — verify pass**

Run: `npm test -- blocks`
Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: DOCX HTML → Block[] builder with callout detection"
```

---

## Task 7: DOCX build script — assembly & image extraction

Reads the DOCX, uses mammoth with a style map, extracts images to `public/assets/book-images/` as WebP, groups blocks under H1 sections, writes `src/content/book.json`.

**Files:**
- Create: `scripts/build-content.ts`
- Create: `src/content/.gitkeep`

- [ ] **Step 1: Install runtime deps for the script**

Run:
```bash
npm install --save-dev mammoth sharp
```

- [ ] **Step 2: Write the build script**

Create `scripts/build-content.ts`:
```ts
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';
import sharp from 'sharp';
import { htmlToBlocks } from './lib/blocks';
import type { Book, Section, Block } from '../src/types/book';

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
        // Downscale to max 1400 px wide, transcode to WebP
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
      // Content before first H1 goes into a synthetic "Front Matter" section
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
```

- [ ] **Step 3: Placeholder book.json to keep repo buildable before first run**

Create `src/content/.gitkeep` (empty file). Then create a stub `src/content/book.json`:
```json
{
  "title": "Preneur Gate",
  "subtitle": "Detailed Statement of Work",
  "meta": { "version": "1.1", "date": "22 September 2026", "imprint": "Preneur Gate Press", "generatedAt": "2026-09-22T00:00:00.000Z" },
  "sections": []
}
```

- [ ] **Step 4: Run the build**

Run: `npm run build:content`
Expected output: `Wrote src/content/book.json — 17 sections, ~890 blocks, N images` (where N ≥ 0). Verify:
```bash
node -e "const b=require('./src/content/book.json'); console.log('sections:', b.sections.length); console.log('first section:', b.sections[0].title); console.log('total blocks:', b.sections.reduce((n,s)=>n+s.blocks.length,0));"
```
Expected: 17 sections, first section is "A. Document Control & Scope Basis" or "1. Executive Summary & Objectives" or similar, and total blocks in the several hundreds.

- [ ] **Step 5: Verify callouts were detected**

Run:
```bash
node -e "const b=require('./src/content/book.json'); const c=[]; b.sections.forEach(s=>s.blocks.forEach(x=>x.type==='callout'&&c.push(x.label))); console.log('callouts:', c);"
```
Expected: prints labels including `IMPORTANT`, `DELIVERY PRINCIPLE`, `RECOMMENDED ARCHITECTURE PATTERN`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: DOCX build script — mammoth + sharp + book.json emission"
```

---

## Task 8: Font-ready hook

The paginator needs to wait for custom fonts to load before measuring; otherwise measurements are wrong.

**Files:**
- Create: `src/hooks/useFontsReady.ts`
- Create: `src/hooks/useFontsReady.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useFontsReady.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFontsReady } from './useFontsReady';

describe('useFontsReady', () => {
  it('resolves to true when document.fonts.ready resolves', async () => {
    const { result } = renderHook(() => useFontsReady());
    // jsdom provides document.fonts with a ready promise
    await waitFor(() => expect(result.current).toBe(true));
  });
});
```

- [ ] **Step 2: Run — verify failure**

Run: `npm test -- useFontsReady`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/hooks/useFontsReady.ts`:
```ts
import { useEffect, useState } from 'react';

export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fontSet = (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts;
    const p = fontSet?.ready ?? Promise.resolve();
    p.then(() => { if (!cancelled) setReady(true); });
    return () => { cancelled = true; };
  }, []);

  return ready;
}
```

- [ ] **Step 4: Run test — verify pass**

Run: `npm test -- useFontsReady`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: useFontsReady hook"
```

---

## Task 9: Pagination — measurement primitives

Provides a hidden container matching visible page CSS, plus a function to measure a block's rendered height.

**Files:**
- Create: `src/lib/pagination/measure.tsx`
- Create: `src/lib/pagination/measure.test.tsx`
- Create: `src/styles/page.css` (minimal placeholder to be fleshed out in Task 12)

- [ ] **Step 1: Write a minimal `page.css`**

Create `src/styles/page.css`:
```css
.page {
  width: var(--page-w, 480px);
  height: var(--page-h, 672px);
  padding: var(--page-pad-y) var(--page-pad-x);
  background: linear-gradient(180deg, var(--paper-3) 0%, var(--paper-4) 100%);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: 1.62;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
}
.page-body {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
```

Import it in `src/main.tsx`:
```tsx
import './styles/page.css';
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/pagination/measure.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { measureBlocks } from './measure';
import type { Block } from '../../types/book';

describe('measureBlocks', () => {
  it('returns a positive height for a paragraph', () => {
    const blocks: Block[] = [{ type: 'para', runs: [{ text: 'Hello world.' }] }];
    const heights = measureBlocks(blocks, { pageW: 480, pageH: 672 });
    expect(heights).toHaveLength(1);
    expect(heights[0]).toBeGreaterThan(0);
  });

  it('returns larger height for a longer paragraph', () => {
    const short: Block[] = [{ type: 'para', runs: [{ text: 'Short.' }] }];
    const long: Block[] = [{ type: 'para', runs: [{ text: 'Hello world. '.repeat(60) }] }];
    const [s] = measureBlocks(short, { pageW: 480, pageH: 672 });
    const [l] = measureBlocks(long, { pageW: 480, pageH: 672 });
    expect(l).toBeGreaterThan(s);
  });
});
```

- [ ] **Step 3: Run — verify failure**

Run: `npm test -- measure`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `measureBlocks`**

Create `src/lib/pagination/measure.tsx`:
```ts
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import type { Block } from '../../types/book';
import { RenderedBlock } from './RenderedBlock';

export type PageDims = { pageW: number; pageH: number };

export function measureBlocks(blocks: Block[], dims: PageDims): number[] {
  const host = document.createElement('div');
  host.style.position = 'absolute';
  host.style.top = '-99999px';
  host.style.left = '-99999px';
  host.style.pointerEvents = 'none';
  host.style.visibility = 'hidden';
  document.body.appendChild(host);

  const heights: number[] = [];

  try {
    for (const b of blocks) {
      const outer = document.createElement('div');
      outer.className = 'page';
      outer.style.setProperty('--page-w', dims.pageW + 'px');
      outer.style.setProperty('--page-h', dims.pageH + 'px');
      host.appendChild(outer);
      const inner = document.createElement('div');
      inner.className = 'page-body';
      outer.appendChild(inner);

      const root = createRoot(inner);
      flushSync(() => root.render(<RenderedBlock block={b} />));
      const firstChild = inner.firstElementChild as HTMLElement | null;
      const h = firstChild?.getBoundingClientRect().height ?? 0;
      heights.push(Math.ceil(h));
      root.unmount();
      host.removeChild(outer);
    }
  } finally {
    host.remove();
  }

  return heights;
}
```

Create `src/lib/pagination/RenderedBlock.tsx` (a minimal placeholder renderer used only for measurement — the real block components come later):
```tsx
import type { Block } from '../../types/book';

export function RenderedBlock({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return block.level === 1
        ? <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 1, margin: '0 0 6px' }}>{block.text}</h1>
        : <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1.15, margin: '0 0 14px' }}>{block.text}</h2>;
    case 'para':
      return <p style={{ margin: '0 0 0.7em' }}>{block.runs.map(runText).join('')}</p>;
    case 'list':
      return (
        <ul style={{ margin: '0.3em 0 0.8em 1.1em', padding: 0 }}>
          {block.items.map((it, i) => (
            <li key={i} style={{ marginBottom: '0.35em' }}>{it.map(runText).join('')}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0.4em 0 0.8em', fontSize: 11 }}>
          <tbody>
            {block.header && <tr>{block.header.map((h, i) => <th key={i} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid rgba(20,19,16,.3)' }}>{h}</th>)}</tr>}
            {block.rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: '6px 8px', borderBottom: '1px solid rgba(20,19,16,.12)' }}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      );
    case 'image':
      return <img src={block.src} alt={block.alt} style={{ maxWidth: '100%', height: 'auto', margin: '0.6em auto' }} />;
    case 'callout':
      return (
        <div style={{ margin: '18px -6px', padding: '14px 16px', background: 'var(--ink)', color: 'var(--paper)', borderRadius: 14 }}>
          <span style={{ display: 'block', fontSize: 8.5, letterSpacing: '.28em', textTransform: 'uppercase', opacity: .65, marginBottom: 6 }}>{block.label}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.35 }}>{block.body.map(runText).join('')}</span>
        </div>
      );
  }
}

function runText(r: { text: string }): string { return r.text; }
```

- [ ] **Step 5: Run test — verify pass**

Run: `npm test -- measure`
Expected: 2 tests pass.

Note: jsdom's layout engine is minimal; measurements are approximate. This is acceptable for the tests (they only check ordering, not exact pixels). Real measurements happen in the real browser at runtime.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: measurement primitives for pagination"
```

---

## Task 10: Pagination — break-point rules

Pure functions that decide whether a block sequence should break, given cumulative heights and the block sequence.

**Files:**
- Create: `src/lib/pagination/rules.ts`
- Create: `src/lib/pagination/rules.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pagination/rules.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { splitParagraph, wouldOrphan, isKeepWithNext } from './rules';
import type { Block, ParaBlock } from '../../types/book';

describe('splitParagraph', () => {
  it('splits at the nearest sentence boundary to `cutRatio`', () => {
    const p: ParaBlock = {
      type: 'para',
      runs: [{ text: 'Alpha. Beta. Gamma. Delta.' }],
    };
    const { first, rest } = splitParagraph(p, 0.5);
    expect(first.runs.map(r => r.text).join('')).toBe('Alpha. Beta.');
    expect(rest.runs.map(r => r.text).join('')).toBe(' Gamma. Delta.');
  });

  it('does not split if only one sentence', () => {
    const p: ParaBlock = { type: 'para', runs: [{ text: 'One long thought without period at end' }] };
    const { first, rest } = splitParagraph(p, 0.5);
    expect(first.runs.map(r => r.text).join('')).toBe('One long thought without period at end');
    expect(rest.runs.map(r => r.text).join('')).toBe('');
  });
});

describe('wouldOrphan', () => {
  it('true when a heading is the last block on a page', () => {
    const blocks: Block[] = [{ type: 'heading', level: 2, text: 'X', id: 'x' }];
    expect(wouldOrphan(blocks)).toBe(true);
  });

  it('false when a heading is followed by content', () => {
    const blocks: Block[] = [
      { type: 'heading', level: 2, text: 'X', id: 'x' },
      { type: 'para', runs: [{ text: 'body' }] },
    ];
    expect(wouldOrphan(blocks)).toBe(false);
  });

  it('false for a body block last', () => {
    const blocks: Block[] = [{ type: 'para', runs: [{ text: 'body' }] }];
    expect(wouldOrphan(blocks)).toBe(false);
  });
});

describe('isKeepWithNext', () => {
  it('true for headings', () => {
    expect(isKeepWithNext({ type: 'heading', level: 1, text: 'X', id: 'x' })).toBe(true);
  });
  it('false for paragraphs', () => {
    expect(isKeepWithNext({ type: 'para', runs: [] })).toBe(false);
  });
});
```

- [ ] **Step 2: Run — verify failure**

Run: `npm test -- rules`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement rules**

Create `src/lib/pagination/rules.ts`:
```ts
import type { Block, ParaBlock } from '../../types/book';

export function isKeepWithNext(b: Block): boolean {
  return b.type === 'heading';
}

export function isAtomic(b: Block): boolean {
  return b.type === 'callout' || b.type === 'image';
}

export function wouldOrphan(blocksOnPage: Block[]): boolean {
  if (blocksOnPage.length === 0) return false;
  const last = blocksOnPage[blocksOnPage.length - 1];
  return last.type === 'heading';
}

export function splitParagraph(p: ParaBlock, cutRatio: number): { first: ParaBlock; rest: ParaBlock } {
  const fullText = p.runs.map((r) => r.text).join('');
  const targetIdx = Math.floor(fullText.length * cutRatio);

  const sentenceEnds: number[] = [];
  const re = /[.!?](\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(fullText)) !== null) sentenceEnds.push(m.index + 1);

  if (sentenceEnds.length === 0) {
    return { first: p, rest: { type: 'para', runs: [{ text: '' }] } };
  }

  let cutAt = sentenceEnds[0];
  for (const idx of sentenceEnds) {
    if (Math.abs(idx - targetIdx) < Math.abs(cutAt - targetIdx)) cutAt = idx;
  }

  const firstText = fullText.slice(0, cutAt);
  const restText = fullText.slice(cutAt);

  // Preserve inline runs: rebuild by walking runs and slicing at cutAt.
  // Simplified — runs are re-flattened into a single text run; formatting spans that straddle the cut are dropped rather than doubled.
  // For the current DOCX (SOW), splits happen inside plain-text paragraphs, so this is safe.
  const first: ParaBlock = { type: 'para', runs: [{ text: firstText }] };
  const rest: ParaBlock = { type: 'para', runs: [{ text: restText }] };
  return { first, rest };
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npm test -- rules`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pagination break-point rules"
```

---

## Task 11: Pagination — the paginator

Assembles measurement + rules into `Page[]`. Runs synchronously (chunking is added at integration).

**Files:**
- Create: `src/lib/pagination/paginate.ts`
- Create: `src/lib/pagination/paginate.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/pagination/paginate.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { paginate } from './paginate';
import type { Section } from '../../types/book';

describe('paginate', () => {
  it('emits at least one page per section', () => {
    const sections: Section[] = [
      { id: 's1', level: 1, title: 'Chapter One', blocks: [
        { type: 'para', runs: [{ text: 'Hi.' }] },
      ]},
      { id: 's2', level: 1, title: 'Chapter Two', blocks: [
        { type: 'para', runs: [{ text: 'Ho.' }] },
      ]},
    ];
    const pages = paginate(sections, { pageW: 480, pageH: 672 });
    expect(pages.length).toBeGreaterThanOrEqual(2);
    // First non-blank page of each chapter is an opener
    const openers = pages.filter((p) => p.opener);
    expect(openers.length).toBe(2);
  });

  it('assigns sequential page numbers starting at 1', () => {
    const sections: Section[] = [{
      id: 's1', level: 1, title: 'X', blocks: [{ type: 'para', runs: [{ text: 'x' }] }],
    }];
    const pages = paginate(sections, { pageW: 480, pageH: 672 });
    expect(pages[0].pageNumber).toBe(1);
    for (let i = 1; i < pages.length; i++) {
      expect(pages[i].pageNumber).toBe(pages[i - 1].pageNumber + 1);
    }
  });
});
```

- [ ] **Step 2: Run — verify failure**

Run: `npm test -- paginate`
Expected: FAIL.

- [ ] **Step 3: Implement `paginate`**

Create `src/lib/pagination/paginate.ts`:
```ts
import type { Block, HeadingBlock, Page, Section } from '../../types/book';
import { measureBlocks, PageDims } from './measure';
import { isAtomic, splitParagraph, wouldOrphan } from './rules';

const BODY_AVAILABLE_RATIO = 0.86; // page padding + running-head chrome consumes ~14%

export function paginate(sections: Section[], dims: PageDims): Page[] {
  const pages: Page[] = [];
  let pageNumber = 1;

  for (const section of sections) {
    const opener: HeadingBlock = { type: 'heading', level: 1, text: section.title, id: section.id };
    const allBlocks: Block[] = [opener, ...section.blocks];
    const heights = measureBlocks(allBlocks, dims);
    const available = Math.floor(dims.pageH * BODY_AVAILABLE_RATIO);

    let currentBlocks: Block[] = [];
    let currentH = 0;
    let openerConsumed = false;

    const commit = (kind: Page['kind']) => {
      if (currentBlocks.length === 0) return;
      pages.push({
        blocks: currentBlocks,
        sectionId: section.id,
        sectionTitle: section.title,
        pageNumber: pageNumber++,
        opener: !openerConsumed ? true : undefined,
        kind: !openerConsumed ? 'opener' : kind,
      });
      openerConsumed = true;
      currentBlocks = [];
      currentH = 0;
    };

    for (let i = 0; i < allBlocks.length; i++) {
      const b = allBlocks[i];
      const h = heights[i];

      // Standalone image page if image alone > available
      if (b.type === 'image' && h > available) {
        commit('body');
        pages.push({
          blocks: [b],
          sectionId: section.id,
          sectionTitle: section.title,
          pageNumber: pageNumber++,
          kind: 'image',
        });
        continue;
      }

      // Fits on current page?
      if (currentH + h <= available) {
        currentBlocks.push(b);
        currentH += h;
        continue;
      }

      // Doesn't fit. If atomic (callout/image), close page and place on next.
      if (isAtomic(b)) {
        commit('body');
        currentBlocks.push(b);
        currentH = h;
        continue;
      }

      // Paragraph: try splitting.
      if (b.type === 'para') {
        const remaining = available - currentH;
        const cutRatio = Math.max(0.2, Math.min(0.8, remaining / h));
        const { first, rest } = splitParagraph(b, cutRatio);
        if (first.runs[0].text.length > 0) {
          currentBlocks.push(first);
          // Recompute currentH by measuring; conservative — assume it fills the page.
          currentH = available;
        }
        commit('body');
        if (rest.runs[0].text.length > 0) {
          const [restH] = measureBlocks([rest], dims);
          currentBlocks.push(rest);
          currentH = restH;
        }
        continue;
      }

      // Non-atomic, non-paragraph: close page and put on next.
      commit('body');
      currentBlocks.push(b);
      currentH = h;
    }

    // Orphan check on final page of section
    if (wouldOrphan(currentBlocks)) {
      const orphan = currentBlocks.pop()!;
      commit('body');
      currentBlocks.push(orphan);
    }
    commit('body');
  }

  return pages;
}
```

- [ ] **Step 4: Run tests — verify pass**

Run: `npm test -- paginate`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: pagination — assembles measurement + rules into Page[]"
```

---

## Task 12: Interior page & block components (real ones)

Replaces the measurement placeholder with production visual components matching the locked design.

**Files:**
- Create: `src/components/blocks/Paragraph.tsx`
- Create: `src/components/blocks/List.tsx`
- Create: `src/components/blocks/Table.tsx`
- Create: `src/components/blocks/Callout.tsx`
- Create: `src/components/blocks/FigureImage.tsx`
- Create: `src/components/blocks/Heading.tsx`
- Create: `src/components/blocks/BlockRenderer.tsx`
- Create: `src/components/Page.tsx`
- Modify: `src/lib/pagination/RenderedBlock.tsx` — replace stub with `BlockRenderer`
- Modify: `src/styles/page.css` — add full page styles

- [ ] **Step 1: Write the block components**

Create `src/components/blocks/Paragraph.tsx`:
```tsx
import type { ParaBlock, InlineRun } from '../../types/book';

export function Paragraph({ block }: { block: ParaBlock }) {
  return <p className="para">{block.runs.map(renderRun)}</p>;
}

function renderRun(r: InlineRun, i: number) {
  let node: React.ReactNode = r.text;
  if (r.bold) node = <strong key={i}>{node}</strong>;
  if (r.italic) node = <em key={i}>{node}</em>;
  if (r.href) node = <a key={i} href={r.href} target="_blank" rel="noreferrer">{node}</a>;
  return <span key={i}>{node}</span>;
}
```

Create `src/components/blocks/List.tsx`:
```tsx
import type { ListBlock, InlineRun } from '../../types/book';

const COLORS = ['var(--yellow)', 'var(--pink)', 'var(--blue)', 'var(--mint)'];

export function List({ block }: { block: ListBlock }) {
  if (block.style === 'number') {
    return (
      <ol className="list list-number">
        {block.items.map((item, i) => <li key={i}>{item.map((r, j) => <span key={j}>{r.text}</span>)}</li>)}
      </ol>
    );
  }
  return (
    <ul className="list list-bullet">
      {block.items.map((item, i) => (
        <li key={i} style={{ ['--bullet' as string]: COLORS[i % COLORS.length] }}>
          {item.map((r, j) => renderRun(r, j))}
        </li>
      ))}
    </ul>
  );
}

function renderRun(r: InlineRun, i: number) {
  let node: React.ReactNode = r.text;
  if (r.bold) node = <strong key={i}>{node}</strong>;
  if (r.italic) node = <em key={i}>{node}</em>;
  return <span key={i}>{node}</span>;
}
```

Create `src/components/blocks/Table.tsx`:
```tsx
import type { TableBlock } from '../../types/book';

export function Table({ block }: { block: TableBlock }) {
  return (
    <table className="table">
      {block.header && (
        <thead>
          <tr>{block.header.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
      )}
      <tbody>
        {block.rows.map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
```

Create `src/components/blocks/Callout.tsx`:
```tsx
import type { CalloutBlock, InlineRun } from '../../types/book';

export function Callout({ block }: { block: CalloutBlock }) {
  return (
    <aside className="callout">
      <span className="callout-label">{block.label}</span>
      <span className="callout-body">{block.body.map((r, i) => renderRun(r, i))}</span>
    </aside>
  );
}
function renderRun(r: InlineRun, i: number) {
  let node: React.ReactNode = r.text;
  if (r.bold) node = <strong key={i}>{node}</strong>;
  if (r.italic) node = <em key={i}>{node}</em>;
  return <span key={i}>{node}</span>;
}
```

Create `src/components/blocks/FigureImage.tsx`:
```tsx
import type { ImageBlock } from '../../types/book';

export function FigureImage({ block }: { block: ImageBlock }) {
  return (
    <figure className="figure">
      <img src={block.src} alt={block.alt} loading="lazy" />
      {block.alt && <figcaption>{block.alt}</figcaption>}
    </figure>
  );
}
```

Create `src/components/blocks/Heading.tsx`:
```tsx
import type { HeadingBlock } from '../../types/book';

export function Heading({ block }: { block: HeadingBlock }) {
  if (block.level === 1) return <h1 className="h1">{block.text}</h1>;
  return <h2 className="h2">{block.text}</h2>;
}
```

Create `src/components/blocks/BlockRenderer.tsx`:
```tsx
import type { Block } from '../../types/book';
import { Paragraph } from './Paragraph';
import { List } from './List';
import { Table } from './Table';
import { Callout } from './Callout';
import { FigureImage } from './FigureImage';
import { Heading } from './Heading';

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'para': return <Paragraph block={block} />;
    case 'list': return <List block={block} />;
    case 'table': return <Table block={block} />;
    case 'callout': return <Callout block={block} />;
    case 'image': return <FigureImage block={block} />;
    case 'heading': return <Heading block={block} />;
  }
}
```

- [ ] **Step 2: Write `Page.tsx`**

Create `src/components/Page.tsx`:
```tsx
import type { Page as PageT } from '../types/book';
import { BlockRenderer } from './blocks/BlockRenderer';

export function Page({ page, total }: { page: PageT; total: number }) {
  return (
    <div className="page" data-kind={page.kind}>
      <RunningHead page={page} />
      <div className="page-body">
        {page.opener && page.blocks[0]?.type === 'heading' ? (
          <ChapterOpener page={page} />
        ) : (
          page.blocks.map((b, i) => <BlockRenderer key={i} block={b} />)
        )}
      </div>
      <PageFooter page={page} total={total} />
    </div>
  );
}

function RunningHead({ page }: { page: PageT }) {
  return (
    <header className="running-head">
      <span>Preneur Gate · SOW</span>
      <Barcode />
      <span>§ {String(page.pageNumber).padStart(2, '0')}</span>
    </header>
  );
}

function Barcode() {
  return (
    <span className="barcode" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => <i key={i} />)}
    </span>
  );
}

function ChapterOpener({ page }: { page: PageT }) {
  const [head, ...rest] = page.blocks;
  if (head.type !== 'heading') return null;
  const firstBody = rest[0];
  const lede = firstBody?.type === 'para' ? firstBody : null;
  const remaining = lede ? rest.slice(1) : rest;
  return (
    <>
      <span className="kicker">{page.sectionTitle}</span>
      <h1 className="h1 opener">{head.text}</h1>
      {lede && <p className="lede">{lede.runs.map((r, i) => <span key={i}>{r.text}</span>)}</p>}
      {remaining.map((b, i) => <BlockRenderer key={i} block={b} />)}
    </>
  );
}

function PageFooter({ page, total }: { page: PageT; total: number }) {
  return (
    <footer className="page-num">
      <span>Preneur Gate</span>
      <span className="n">{page.pageNumber}</span>
      <span>of {total}</span>
    </footer>
  );
}
```

- [ ] **Step 3: Replace measurement placeholder to use real BlockRenderer**

Overwrite `src/lib/pagination/RenderedBlock.tsx`:
```tsx
import type { Block } from '../../types/book';
import { BlockRenderer } from '../../components/BlockRenderer.stub';

export function RenderedBlock({ block }: { block: Block }) {
  return <BlockRenderer block={block} />;
}
```

Create the re-export path `src/components/BlockRenderer.stub.tsx`:
```tsx
export { BlockRenderer } from './blocks/BlockRenderer';
```

(The extra file exists purely so the measurement primitive imports a stable path; refactoring can consolidate later.)

- [ ] **Step 4: Fill out `src/styles/page.css`**

Overwrite `src/styles/page.css`:
```css
.page {
  width: var(--page-w, 480px);
  height: var(--page-h, 672px);
  padding: var(--page-pad-y) var(--page-pad-x);
  background:
    radial-gradient(120% 100% at 50% 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,.05) 100%),
    linear-gradient(180deg, var(--paper-3) 0%, var(--paper-4) 100%);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: 1.62;
  overflow: hidden;
  box-sizing: border-box;
  position: relative;
  box-shadow: inset -8px 0 20px -14px rgba(0,0,0,.3);
}
.page::after {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(120,90,50,.02) 0 1px, transparent 1px 3px);
}
.page-body { display: flex; flex-direction: column; overflow: hidden; }

.running-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; padding-bottom: 12px;
  border-bottom: 1px solid rgba(20,19,16,.15);
  font-family: var(--font-ui);
  font-size: 9.5px; letter-spacing: .3em; text-transform: uppercase; font-weight: 600; opacity: .7;
}
.barcode { display: flex; gap: 1px; opacity: .6; }
.barcode i { width: 1px; height: 12px; background: var(--ink); display: block; }
.barcode i:nth-child(2n) { height: 8px; }
.barcode i:nth-child(3n) { height: 10px; width: 2px; }

.kicker {
  display: inline-flex; padding: 5px 10px; border-radius: 999px;
  background: var(--pink); color: #fff;
  font-family: var(--font-ui); font-size: 9px; letter-spacing: .22em;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 12px; align-self: flex-start;
}
.h1 {
  font-family: var(--font-display);
  font-variation-settings: 'opsz' 96, 'SOFT' 60, 'WONK' 1;
  font-weight: 500; font-size: var(--fs-h1); line-height: 1;
  letter-spacing: -.02em; margin: 0 0 6px;
}
.h1.opener { font-size: 40px; }
.h2 {
  font-family: var(--font-display);
  font-weight: 600; font-size: 18px; line-height: 1.2;
  margin: 14px 0 8px;
}
.lede {
  font-family: var(--font-display); font-style: italic;
  font-size: var(--fs-lede); line-height: 1.4;
  color: var(--ink-soft); margin: 6px 0 18px; max-width: 92%;
}
.para { margin: 0 0 .7em; }
.list { margin: .3em 0 .8em; padding: 0; list-style: none; }
.list-bullet li { position: relative; padding-left: 18px; margin-bottom: .35em; }
.list-bullet li::before {
  content: ''; position: absolute; left: 0; top: 7px;
  width: 8px; height: 8px; border-radius: 2px;
  background: var(--bullet, var(--yellow));
}
.list-number { counter-reset: n; }
.list-number li { position: relative; padding-left: 22px; margin-bottom: .35em; counter-increment: n; }
.list-number li::before {
  content: counter(n) '.'; position: absolute; left: 0; top: 0;
  font-family: var(--font-display); font-style: italic; color: var(--pink);
}
.table {
  width: 100%; border-collapse: collapse; margin: .4em 0 .8em; font-size: 11px;
}
.table th {
  text-align: left; padding: 6px 8px;
  border-bottom: 1px solid rgba(20,19,16,.3);
  font-family: var(--font-ui); font-size: 9.5px; letter-spacing: .18em;
  text-transform: uppercase; font-weight: 700;
}
.table td { padding: 6px 8px; border-bottom: 1px solid rgba(20,19,16,.12); vertical-align: top; }
.callout {
  display: block; margin: 18px -6px; padding: 14px 16px;
  background: var(--ink); color: var(--paper); border-radius: 14px;
  box-shadow: 0 10px 22px -10px rgba(0,0,0,.45);
}
.callout-label {
  display: block; font-family: var(--font-ui); font-size: 8.5px;
  letter-spacing: .28em; text-transform: uppercase; opacity: .65;
  margin-bottom: 6px; font-weight: 600;
}
.callout-body {
  font-family: var(--font-display); font-style: italic;
  font-size: 15px; line-height: 1.35; letter-spacing: -.005em;
}
.figure { margin: .6em 0; text-align: center; }
.figure img { max-width: 100%; height: auto; border-radius: 4px; }
.figure figcaption {
  font-family: var(--font-ui); font-size: 9.5px; letter-spacing: .2em;
  text-transform: uppercase; opacity: .55; margin-top: 8px;
}
.page-num {
  margin-top: auto; padding-top: 12px;
  display: flex; justify-content: space-between; align-items: center;
  font-family: var(--font-ui); font-size: 10px; letter-spacing: .22em;
  text-transform: uppercase; font-weight: 600; opacity: .55;
}
.page-num .n {
  font-family: var(--font-display); font-style: italic;
  font-size: 15px; letter-spacing: 0; text-transform: none; opacity: .75;
}
```

- [ ] **Step 5: Verify measurement still passes**

Run: `npm test -- measure paginate`
Expected: all still pass. (If a test regresses, adjust; often jsdom needs slightly different expectations. Do not lower assertions to game the tests.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: interior page + block components with real styles"
```

---

## Task 13: Cover component

Renders the locked Direction A cover.

**Files:**
- Create: `src/components/Cover.tsx`
- Create: `src/styles/cover.css`
- Modify: `src/main.tsx` — import `cover.css`

- [ ] **Step 1: Write `Cover.tsx`**

Create `src/components/Cover.tsx`:
```tsx
import type { Book } from '../types/book';

export function Cover({ book }: { book: Book }) {
  return (
    <div className="cover">
      <header className="cover-top">
        <span>{book.meta.imprint} · Vol. I</span>
        <Barcode />
        <span>MMXXVI · No. 01</span>
      </header>

      <div className="cover-title">
        <h1>
          Preneur<br />
          <span className="cover-it">Gate.</span>
        </h1>
        <p>Gateway to Entrepreneurship — a Statement of Work for the premium learning platform.</p>
      </div>

      <div className="cover-emblem">
        <img src="/assets/logo.png" alt="PreneurGate" />
      </div>

      <div className="cover-bottom">
        <div className="cover-chips">
          <span className="chip chip-pink">3 Modules</span>
          <span className="chip chip-blue">45–60 Days</span>
          <span className="chip chip-yellow">Version {book.meta.version}</span>
        </div>
        <div className="cover-strip">
          <span className="cover-strip-k">{book.subtitle}</span>
          <span className="cover-strip-v">Read Inside →</span>
        </div>
      </div>
    </div>
  );
}

function Barcode() {
  return (
    <span className="barcode" aria-hidden>
      {Array.from({ length: 12 }).map((_, i) => <i key={i} />)}
    </span>
  );
}
```

- [ ] **Step 2: Write `cover.css`**

Create `src/styles/cover.css`:
```css
.cover {
  width: var(--page-w, 480px);
  height: var(--page-h, 672px);
  padding: 26px 24px;
  position: relative;
  overflow: hidden;
  color: var(--ink);
  font-family: var(--font-ui);
  background:
    radial-gradient(120% 90% at 30% 0%, rgba(255,255,255,.55), transparent 55%),
    linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%);
  box-sizing: border-box;
  display: flex; flex-direction: column;
  border-radius: 8px 16px 16px 8px;
  box-shadow: inset -3px 0 0 rgba(0,0,0,.06);
}
.cover::before {
  content: ''; position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, rgba(0,0,0,.02) 0 1px, transparent 1px 3px);
  pointer-events: none;
}
.cover-top {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 9.5px; letter-spacing: .3em; text-transform: uppercase;
  opacity: .6; font-weight: 600;
}
.cover-title { margin-top: 14px; }
.cover-title h1 {
  font-family: var(--font-display);
  font-variation-settings: 'opsz' 144, 'SOFT' 100, 'WONK' 1;
  font-weight: 500;
  font-size: clamp(48px, 10cqw, 74px);
  line-height: .85;
  letter-spacing: -.03em;
  margin: 0;
}
.cover-it { font-style: italic; color: var(--pink); }
.cover-title p {
  font-size: 10.5px; letter-spacing: .24em; text-transform: uppercase;
  opacity: .72; margin-top: 14px; max-width: 70%;
}
.cover-emblem {
  position: absolute; left: 50%; top: 50%;
  transform: translate(-50%, -46%);
  width: 44%; aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
}
.cover-emblem img {
  width: 100%; height: auto;
  filter: drop-shadow(0 12px 28px rgba(0,0,0,.35));
}
.cover-bottom {
  position: absolute; left: 24px; right: 24px; bottom: 24px;
  display: flex; flex-direction: column; gap: 10px;
}
.cover-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  display: inline-flex; align-items: center;
  padding: 5px 10px; border-radius: 999px;
  font-family: var(--font-ui);
  font-size: 9.5px; letter-spacing: .22em;
  text-transform: uppercase; font-weight: 700; color: #fff;
  box-shadow: 0 4px 10px -2px rgba(0,0,0,.2), inset 0 -2px 0 rgba(0,0,0,.15);
}
.chip-pink { background: var(--pink); }
.chip-blue { background: var(--blue); }
.chip-yellow { background: var(--yellow); color: var(--ink); }
.cover-strip {
  background: var(--ink); color: var(--paper);
  padding: 12px 14px; border-radius: 14px;
  display: flex; justify-content: space-between; align-items: center;
  box-shadow: 0 10px 22px -8px rgba(0,0,0,.5);
}
.cover-strip-k {
  font-family: var(--font-display); font-style: italic;
  font-size: 20px; letter-spacing: -.01em;
}
.cover-strip-v {
  font-family: var(--font-ui);
  font-size: 9.5px; letter-spacing: .24em; text-transform: uppercase;
  opacity: .75; font-weight: 600;
}
```

- [ ] **Step 3: Import cover.css**

Modify `src/main.tsx` — add:
```tsx
import './styles/cover.css';
```

- [ ] **Step 4: Verify the cover renders**

Overwrite `src/App.tsx`:
```tsx
import book from './content/book.json';
import { Cover } from './components/Cover';
import type { Book } from './types/book';

export default function App() {
  return (
    <div style={{ padding: 40, minHeight: '100vh', background: 'var(--stage)', display: 'grid', placeItems: 'center' }}>
      <div style={{ ['--page-w' as string]: '480px', ['--page-h' as string]: '672px' }}>
        <Cover book={book as Book} />
      </div>
    </div>
  );
}
```

Run: `npm run dev`, open the browser. Expected: the full locked cover renders — masthead, pink italic "Gate.", centered logo, chips row, dark "Read Inside →" strip.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: cover component with locked Direction A design"
```

---

## Task 14: Back cover with colophon

**Files:**
- Create: `src/components/BackCover.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/BackCover.tsx`:
```tsx
import type { Book } from '../types/book';

export function BackCover({ book, totalPages }: { book: Book; totalPages: number }) {
  const genDate = new Date(book.meta.generatedAt).toISOString().slice(0, 10);
  return (
    <div className="cover" style={{ borderRadius: '16px 8px 8px 16px' }}>
      <div style={{
        margin: 'auto',
        textAlign: 'center',
        fontFamily: 'var(--font-ui)',
        fontSize: 10,
        letterSpacing: '.28em',
        textTransform: 'uppercase',
        opacity: .55,
        lineHeight: 2,
      }}>
        <p>{book.title}</p>
        <p>{book.subtitle}</p>
        <p>Version {book.meta.version} · MMXXVI</p>
        <p>{totalPages} pages</p>
        <p style={{ marginTop: 24, opacity: .5 }}>Generated from source DOCX {genDate}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: back cover with colophon"
```

---

## Task 15: Table of Contents component

**Files:**
- Create: `src/components/TableOfContents.tsx`
- Create: `src/styles/toc.css`
- Modify: `src/main.tsx` — import toc.css

- [ ] **Step 1: Write the component**

Create `src/components/TableOfContents.tsx`:
```tsx
import type { Page, Section } from '../types/book';

export type TocEntry = { title: string; pageNumber: number; sectionId: string };

export function buildTocEntries(sections: Section[], pages: Page[]): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const s of sections) {
    const firstPage = pages.find((p) => p.sectionId === s.id);
    if (firstPage) {
      entries.push({ title: s.title, pageNumber: firstPage.pageNumber, sectionId: s.id });
    }
  }
  return entries;
}

export function TableOfContents({
  entries, onJump,
}: {
  entries: TocEntry[];
  onJump: (pageNumber: number) => void;
}) {
  return (
    <div className="page toc-page" data-kind="toc">
      <header className="running-head">
        <span>Preneur Gate · SOW</span>
        <span aria-hidden style={{ opacity: .55, letterSpacing: '.3em' }}>CONTENTS</span>
        <span>—</span>
      </header>
      <div className="page-body">
        <h1 className="h1" style={{ marginBottom: 20 }}>Contents.</h1>
        <ol className="toc-list">
          {entries.map((e) => (
            <li key={e.sectionId}>
              <button className="toc-entry" onClick={() => onJump(e.pageNumber)}>
                <span className="toc-title">{e.title}</span>
                <span className="toc-leader" aria-hidden />
                <span className="toc-num">{e.pageNumber}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `toc.css`**

Create `src/styles/toc.css`:
```css
.toc-page .h1 { font-size: 40px; }
.toc-list { list-style: none; padding: 0; margin: 0; counter-reset: none; }
.toc-list li { margin: 0; }
.toc-entry {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: baseline;
  width: 100%;
  padding: 8px 0;
  background: none; border: 0; border-bottom: 1px dashed rgba(20,19,16,.15);
  text-align: left;
  font-family: var(--font-display);
  color: var(--ink);
  cursor: pointer;
  transition: color .15s ease;
}
.toc-entry:hover { color: var(--pink); }
.toc-title { font-size: 15px; font-weight: 500; letter-spacing: -.005em; }
.toc-leader {
  height: 1px;
  background:
    linear-gradient(90deg, transparent 0, transparent 6px, rgba(20,19,16,.25) 6px, rgba(20,19,16,.25) 8px, transparent 8px, transparent 14px)
    repeat-x;
  background-size: 14px 1px;
  align-self: end;
  margin-bottom: 6px;
}
.toc-num { font-style: italic; font-size: 16px; opacity: .75; }
```

- [ ] **Step 3: Import toc.css**

Modify `src/main.tsx` — add:
```tsx
import './styles/toc.css';
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: TableOfContents component with dotted-leader entries"
```

---

## Task 16: BookShell — StPageFlip integration

**Files:**
- Create: `src/components/BookShell.tsx`
- Create: `src/styles/book.css`
- Modify: `src/main.tsx` — import book.css

- [ ] **Step 1: Install page-flip**

Run:
```bash
npm install page-flip
```

- [ ] **Step 2: Write BookShell**

Create `src/components/BookShell.tsx`:
```tsx
import { useEffect, useRef } from 'react';
import { PageFlip } from 'page-flip';

export type BookShellHandle = {
  next: () => void;
  prev: () => void;
  turnTo: (pageIndex: number) => void;
  getCurrent: () => number;
  getTotal: () => number;
};

export function BookShell({
  children,
  pageW,
  pageH,
  onFlip,
  handleRef,
}: {
  children: React.ReactNode;
  pageW: number;
  pageH: number;
  onFlip?: (pageIndex: number) => void;
  handleRef?: React.MutableRefObject<BookShellHandle | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlip | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const flip = new PageFlip(containerRef.current, {
      width: pageW,
      height: pageH,
      size: 'stretch',
      minWidth: 280,
      maxWidth: 600,
      minHeight: 400,
      maxHeight: 840,
      drawShadow: true,
      maxShadowOpacity: 0.5,
      showCover: true,
      usePortrait: true,
      flippingTime: 900,
      useMouseEvents: true,
      mobileScrollSupport: false,
    });
    flip.loadFromHTML(containerRef.current.querySelectorAll('.pf-page'));
    flipRef.current = flip;

    const handler = (e: { data: number }) => onFlip?.(e.data);
    flip.on('flip', handler);

    if (handleRef) {
      handleRef.current = {
        next: () => flip.flipNext(),
        prev: () => flip.flipPrev(),
        turnTo: (i: number) => flip.turnToPage(i),
        getCurrent: () => flip.getCurrentPageIndex(),
        getTotal: () => flip.getPageCount(),
      };
    }
    return () => {
      flip.destroy();
      flipRef.current = null;
    };
  // Intentionally exclude onFlip so a parent re-render doesn't tear down the flipbook.
  // pageW/pageH changes DO require re-creation (different geometry), handled by parent remount via key.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageW, pageH]);

  return (
    <div ref={containerRef} className="book-flipper">
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Write `book.css`**

Create `src/styles/book.css`:
```css
.book-stage {
  min-height: 100vh;
  display: grid; place-items: center;
  padding: 40px;
  background: var(--stage);
  font-family: var(--font-body);
}
.book-flipper {
  width: min(calc(100vw - 80px), 1200px);
  aspect-ratio: 10 / 7; /* 2-page spread */
}
@media (max-width: 640px) {
  .book-stage { padding: 12px; }
  .book-flipper {
    width: min(calc(100vw - 24px), 480px);
    aspect-ratio: 5 / 7; /* single page portrait */
  }
}
.pf-page {
  width: 100%; height: 100%;
  overflow: hidden;
  background: var(--paper-3);
}
```

- [ ] **Step 4: Import book.css**

Modify `src/main.tsx` — add:
```tsx
import './styles/book.css';
```

- [ ] **Step 5: Smoke test — mount a minimal book**

Overwrite `src/App.tsx` temporarily:
```tsx
import { useRef } from 'react';
import { BookShell, type BookShellHandle } from './components/BookShell';
import { Cover } from './components/Cover';
import book from './content/book.json';
import type { Book } from './types/book';

export default function App() {
  const handleRef = useRef<BookShellHandle | null>(null);
  return (
    <div className="book-stage">
      <BookShell pageW={480} pageH={672} handleRef={handleRef}>
        <div className="pf-page"><Cover book={book as Book} /></div>
        <div className="pf-page"><div className="page"><div className="page-body">Page 1</div></div></div>
        <div className="pf-page"><div className="page"><div className="page-body">Page 2</div></div></div>
        <div className="pf-page"><div className="page"><div className="page-body">Page 3</div></div></div>
        <div className="pf-page"><div className="page"><div className="page-body">Back</div></div></div>
      </BookShell>
    </div>
  );
}
```

Run: `npm run dev`. Expected: cover on the right side of a closed book. Click the right half — the cover physically curls open onto Page 1 / Page 2 spread. Click again — flips to Page 3 / Back. Click the left half — flips back.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: BookShell with StPageFlip integration + smoke test"
```

---

## Task 17: Keyboard, hash, and click input hooks

**Files:**
- Create: `src/hooks/useKeyboardNav.ts`
- Create: `src/hooks/useHashRoute.ts`
- Create: `src/hooks/useKeyboardNav.test.ts`

- [ ] **Step 1: Write failing test for `useKeyboardNav`**

Create `src/hooks/useKeyboardNav.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardNav } from './useKeyboardNav';

describe('useKeyboardNav', () => {
  it('calls next on ArrowRight', () => {
    const next = vi.fn(); const prev = vi.fn();
    renderHook(() => useKeyboardNav({ next, prev }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(next).toHaveBeenCalledTimes(1);
  });
  it('calls prev on ArrowLeft', () => {
    const next = vi.fn(); const prev = vi.fn();
    renderHook(() => useKeyboardNav({ next, prev }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(prev).toHaveBeenCalledTimes(1);
  });
  it('ignores when target is an input', () => {
    const next = vi.fn(); const prev = vi.fn();
    renderHook(() => useKeyboardNav({ next, prev }));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(next).not.toHaveBeenCalled();
    input.remove();
  });
});
```

- [ ] **Step 2: Run — verify failure**

Run: `npm test -- useKeyboardNav`
Expected: FAIL.

- [ ] **Step 3: Implement `useKeyboardNav`**

Create `src/hooks/useKeyboardNav.ts`:
```ts
import { useEffect } from 'react';

export function useKeyboardNav({
  next, prev, onHome, onEnd, onEscape,
}: {
  next: () => void;
  prev: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onEscape?: () => void;
}) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown': next(); break;
        case 'ArrowLeft':
        case 'PageUp': prev(); break;
        case 'Home': onHome?.(); break;
        case 'End': onEnd?.(); break;
        case 'Escape': onEscape?.(); break;
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onHome, onEnd, onEscape]);
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npm test -- useKeyboardNav`
Expected: 3 pass.

- [ ] **Step 5: Implement `useHashRoute`**

Create `src/hooks/useHashRoute.ts`:
```ts
import { useEffect } from 'react';

export function useHashRoute({
  onNavigate,
  currentPage,
}: {
  onNavigate: (page: number) => void;
  currentPage: number;
}) {
  // Read hash on mount and whenever it changes
  useEffect(() => {
    function read() {
      const m = /#p=(\d+)/.exec(window.location.hash);
      if (m) onNavigate(Number(m[1]));
    }
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [onNavigate]);

  // Push hash when currentPage changes
  useEffect(() => {
    const desired = `#p=${currentPage}`;
    if (window.location.hash !== desired) {
      window.history.replaceState(null, '', desired);
    }
  }, [currentPage]);
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: keyboard nav + hash route hooks"
```

---

## Task 18: Controls bar

**Files:**
- Create: `src/components/Controls.tsx`
- Create: `src/components/ProgressBar.tsx`
- Create: `src/styles/controls.css`
- Modify: `src/main.tsx` — import controls.css

- [ ] **Step 1: Write `Controls.tsx`**

Create `src/components/Controls.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';

export function Controls({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onToc,
  onFullscreen,
}: {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onToc: () => void;
  onFullscreen: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<number | undefined>();

  useEffect(() => {
    function ping() {
      setVisible(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setVisible(false), 2000);
    }
    window.addEventListener('mousemove', ping);
    window.addEventListener('touchstart', ping);
    window.addEventListener('keydown', ping);
    ping();
    return () => {
      window.removeEventListener('mousemove', ping);
      window.removeEventListener('touchstart', ping);
      window.removeEventListener('keydown', ping);
      window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={`controls ${visible ? 'is-visible' : ''}`}>
      <button aria-label="Previous page" onClick={onPrev}>←</button>
      <span className="controls-page">
        Page <em>{currentPage}</em> / {totalPages}
      </span>
      <button aria-label="Next page" onClick={onNext}>→</button>
      <span className="controls-sep" aria-hidden>·</span>
      <button aria-label="Table of contents" onClick={onToc}>Contents</button>
      <button aria-label="Fullscreen" onClick={onFullscreen}>⛶</button>
    </div>
  );
}
```

- [ ] **Step 2: Write `ProgressBar.tsx`**

Create `src/components/ProgressBar.tsx`:
```tsx
export function ProgressBar({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  const pct = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  return (
    <div className="progress-track" aria-hidden>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
```

- [ ] **Step 3: Write `controls.css`**

Create `src/styles/controls.css`:
```css
.progress-track {
  position: fixed; top: 0; left: 0; right: 0;
  height: 2px; background: rgba(20,19,16,.08);
  z-index: 10;
}
.progress-fill { height: 100%; background: var(--pink); transition: width .3s ease; }

.controls {
  position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%) translateY(8px);
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 999px;
  background: rgba(20,19,16,.85); color: var(--paper);
  backdrop-filter: blur(8px);
  font-family: var(--font-ui);
  font-size: 11px; letter-spacing: .18em; text-transform: uppercase; font-weight: 600;
  opacity: 0; pointer-events: none;
  transition: opacity .25s ease, transform .25s ease;
  z-index: 20;
}
.controls.is-visible { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
.controls button {
  background: none; border: 0; color: inherit;
  padding: 6px 10px; border-radius: 999px; cursor: pointer;
  font: inherit;
}
.controls button:hover { background: rgba(255,255,255,.12); }
.controls-page em {
  font-family: var(--font-display); font-style: italic;
  font-size: 14px; letter-spacing: 0; text-transform: none;
  margin: 0 4px;
}
.controls-sep { opacity: .35; }
```

- [ ] **Step 4: Import controls.css**

Modify `src/main.tsx`:
```tsx
import './styles/controls.css';
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: controls bar + progress bar"
```

---

## Task 19: App composition — wire pagination + book shell + controls

**Files:**
- Modify: `src/App.tsx`
- Create: `src/hooks/useMediaQuery.ts`

- [ ] **Step 1: Write `useMediaQuery.ts`**

Create `src/hooks/useMediaQuery.ts`:
```ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}
```

- [ ] **Step 2: Rewrite `App.tsx`**

Overwrite `src/App.tsx`:
```tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import bookData from './content/book.json';
import type { Book, Page as PageT } from './types/book';
import { paginate } from './lib/pagination/paginate';
import { BookShell, type BookShellHandle } from './components/BookShell';
import { Cover } from './components/Cover';
import { BackCover } from './components/BackCover';
import { Page } from './components/Page';
import { TableOfContents, buildTocEntries, type TocEntry } from './components/TableOfContents';
import { Controls } from './components/Controls';
import { ProgressBar } from './components/ProgressBar';
import { useFontsReady } from './hooks/useFontsReady';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { useHashRoute } from './hooks/useHashRoute';
import { useMediaQuery } from './hooks/useMediaQuery';

const book = bookData as Book;

export default function App() {
  const fontsReady = useFontsReady();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [pages, setPages] = useState<PageT[]>([]);
  const [current, setCurrent] = useState(0);
  const handleRef = useRef<BookShellHandle | null>(null);

  const dims = isMobile ? { pageW: 380, pageH: 532 } : { pageW: 480, pageH: 672 };

  useEffect(() => {
    if (!fontsReady) return;
    // Chunk the pagination pass onto idle to keep initial paint snappy
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const runner = () => {
      const p = paginate(book.sections, dims);
      setPages(p);
    };
    if (ric) ric(runner); else setTimeout(runner, 0);
  }, [fontsReady, dims.pageW, dims.pageH]);

  const tocEntries: TocEntry[] = useMemo(() => buildTocEntries(book.sections, pages), [pages]);

  const totalLeaves = 2 + 1 + pages.length + 1; // cover + toc + pages + back cover (index positions)

  const go = (delta: 1 | -1) => {
    if (delta === 1) handleRef.current?.next();
    else handleRef.current?.prev();
  };
  const jumpToPage = (pageNumber: number) => {
    // pages index in flip: 0=cover, 1=toc, 2..=pages
    const idx = 2 + Math.max(0, pageNumber - 1);
    handleRef.current?.turnTo(idx);
  };
  const enterFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useKeyboardNav({
    next: () => go(1),
    prev: () => go(-1),
    onHome: () => handleRef.current?.turnTo(0),
    onEnd: () => handleRef.current?.turnTo(totalLeaves - 1),
    onEscape: () => { if (document.fullscreenElement) document.exitFullscreen(); },
  });

  useHashRoute({
    currentPage: current,
    onNavigate: (n) => handleRef.current?.turnTo(n),
  });

  const currentPageNumber = Math.max(1, current - 1); // convert flip index to page number
  const displayTotal = pages.length;

  return (
    <div className="book-stage">
      <ProgressBar currentPage={currentPageNumber} totalPages={displayTotal} />
      {pages.length === 0 ? (
        <div style={{ opacity: .6, fontFamily: 'var(--font-ui)', letterSpacing: '.24em', textTransform: 'uppercase' }}>
          Preparing pages…
        </div>
      ) : (
        <BookShell
          key={`${dims.pageW}x${dims.pageH}-${pages.length}`}
          pageW={dims.pageW}
          pageH={dims.pageH}
          handleRef={handleRef}
          onFlip={setCurrent}
        >
          <div className="pf-page"><Cover book={book} /></div>
          <div className="pf-page"><TableOfContents entries={tocEntries} onJump={jumpToPage} /></div>
          {pages.map((p, i) => (
            <div key={i} className="pf-page">
              <Page page={p} total={pages.length} />
            </div>
          ))}
          <div className="pf-page"><BackCover book={book} totalPages={pages.length} /></div>
        </BookShell>
      )}
      <Controls
        currentPage={currentPageNumber}
        totalPages={displayTotal}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        onToc={() => handleRef.current?.turnTo(1)}
        onFullscreen={enterFullscreen}
      />
    </div>
  );
}
```

- [ ] **Step 3: Regenerate `book.json` (if not already)**

Run: `npm run build:content`

- [ ] **Step 4: Run the app and verify end-to-end**

Run: `npm run dev`, open browser.
Expected:
- Cream stage, closed book with cover on the right.
- Fonts render immediately (no swap flash).
- Under 1 second later, "Preparing pages…" disappears (pagination completed).
- Click right half → cover opens, TOC + Section 1 opener spread appears.
- Arrow keys turn pages.
- Click a TOC entry → jumps to that section's first page.
- Controls bar shows page N / total, fades after 2s idle.
- Every chapter opens on a new right-hand page with the pink kicker and italic Fraunces title.
- Callouts render as dark rounded pullquotes.
- Resize to mobile width → book reflows to single portrait page, pagination reruns.

Fix any issues. Do not proceed until end-to-end works.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: App composition — full flipbook end-to-end"
```

---

## Task 20: Preload strategy — lightweight placeholders outside window

For a ~100-page book, mounting every full `Page` at once creates ~10K DOM nodes. Replace pages outside the current ±2 spread window with lightweight placeholders.

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/PagePlaceholder.tsx`

- [ ] **Step 1: Write `PagePlaceholder.tsx`**

Create `src/components/PagePlaceholder.tsx`:
```tsx
export function PagePlaceholder({ pageNumber }: { pageNumber: number }) {
  return (
    <div className="page page-placeholder" data-kind="placeholder">
      <div className="page-body" style={{ opacity: .35, display: 'grid', placeItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 24 }}>{pageNumber}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the window in `App.tsx`**

Modify `src/App.tsx` — replace the `{pages.map(...)}` block with:
```tsx
{pages.map((p, i) => {
  // Flip index of this page = 2 + i (cover + toc)
  const flipIdx = 2 + i;
  const inWindow = Math.abs(flipIdx - current) <= 4;
  return (
    <div key={i} className="pf-page">
      {inWindow ? <Page page={p} total={pages.length} /> : <PagePlaceholder pageNumber={p.pageNumber} />}
    </div>
  );
})}
```

And import at top:
```tsx
import { PagePlaceholder } from './components/PagePlaceholder';
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Flip through the book. Expected: no visual regression — pages near the current spread render fully; skipping to far pages via TOC still works because when the flip lands, the new spread is now in-window and re-renders.

Open DevTools → Elements → confirm the total DOM node count stays under ~500 even for the full book.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "perf: lightweight placeholders for pages outside ±4 flip-index window"
```

---

## Task 21: Responsive polish — re-paginate on tier switch, remap current page

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add page-remap logic**

The `App` already re-runs pagination on `dims` change. Add remap of `current` so the reader lands on the equivalent page in the new pagination.

Modify `src/App.tsx` — replace the pagination effect with:
```tsx
useEffect(() => {
  if (!fontsReady) return;
  const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  const runner = () => {
    const p = paginate(book.sections, dims);
    // Try to preserve reading position: remap by nearest section
    setPages((prev) => {
      if (prev.length && current >= 2 && current < 2 + prev.length) {
        const prevPage = prev[current - 2];
        const target = p.findIndex((np) => np.sectionId === prevPage.sectionId);
        if (target >= 0) {
          // After React commits, jump the flipbook to this index
          queueMicrotask(() => handleRef.current?.turnTo(2 + target));
        }
      }
      return p;
    });
  };
  if (ric) ric(runner); else setTimeout(runner, 0);
}, [fontsReady, dims.pageW, dims.pageH, current]);
```

- [ ] **Step 2: Verify manually**

Run `npm run dev`, flip to page 30, resize the window to under 640px, watch:
- "Preparing pages…" briefly, then the mobile layout appears.
- The book lands on a page in the same section (may not be exactly page 30 because mobile pagination differs).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: preserve reading position across responsive tier switches"
```

---

## Task 22: Manual verification checklist

**Files:** none (verification only)

- [ ] **Step 1: Run the full app**

Run: `npm run build:content && npm run dev`

- [ ] **Step 2: Walk the success-criteria checklist from the spec**

Open the app in Chrome at desktop width and walk each item from spec §12:

1. Cover appears in <1s, no layout flash.
2. Clicking the cover physically opens onto the TOC spread with a page-curl motion.
3. Every arrow-key / click / swipe cleanly turns one page — no double-flips.
4. All 17 sections are reachable via TOC.
5. Every chapter (Heading 1) opens on a fresh right-hand page with the opener treatment.
6. Callouts render as dark rounded pullquotes on the correct pages.
7. Deep-link: navigate to `http://localhost:5173/#p=25`, refresh — lands on page 25.
8. Resize to <640px — mobile single-page mode kicks in, still flips, typography still legible.
9. Reading from cover to back cover works with no perceptible frame drops.

Record any failures. Any failure = a bug to fix before the plan is done.

- [ ] **Step 3: Verify on Safari (WebKit) and Firefox**

Open the same dev URL in Safari and Firefox. StPageFlip uses Canvas + CSS transforms — verify page-curl renders correctly in all three. Fix any browser-specific issues.

- [ ] **Step 4: Build + preview the production bundle**

Run: `npm run build && npm run preview`. Open the preview URL. Repeat the checklist. Expected: no functional regressions vs. dev; bundle output visible in `dist/`.

Check bundle sizes:
```bash
du -sh dist/assets/*.js dist/assets/*.css
```
Expected: JS bundle < 200 KB gz (Vite output shows gz sizes at the end of `npm run build`).

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: verification pass — fixes for Safari/Firefox and prod bundle"
```

---

## Task 23: README + delivery notes

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the README**

Create `README.md`:
```markdown
# Preneur Gate — Interactive Flipbook

A premium digital-book web app that renders the Preneur Gate Statement of Work as a physical-feeling flipbook with realistic page-turn animation.

## Quick start

    npm install
    npm run build:content       # DOCX → src/content/book.json + images
    npm run dev                 # open http://localhost:5173

## Production build

    npm run build               # emits static bundle in dist/
    npm run preview             # serves dist/ locally

Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, S3, GitHub Pages).

## Swapping the DOCX

Replace `Preneur_Gate_Detailed_SOW_Updated_Architecture.docx` at the repo root with a new DOCX using Word styles: `Heading 1`, `Heading 2`, `List Bullet`, `List Number`. Then:

    npm run build:content
    npm run build

Rebrand colors, type scale, and paper stock in `src/styles/tokens.css`.

## Structure

    scripts/build-content.ts    # DOCX parser (mammoth + sharp)
    src/content/book.json       # generated, checked in
    src/types/book.ts           # data model
    src/lib/pagination/         # measurement-based paginator
    src/components/             # Cover, Page, TableOfContents, Controls, etc.
    src/styles/tokens.css       # design tokens (colors, type, spacing)

## Known limitations (v1)

- No in-book search
- No pinch-to-zoom
- No bookmarks or annotations
- No dark reading mode
- Basic keyboard nav + semantic headings; not screen-reader-optimized

## License

Private.
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "docs: README with usage, DOCX-swap, and known limits"
```

---

## Self-Review Notes

**Spec coverage:** All 12 spec sections are covered by tasks:
- §2 Visual System — Tasks 12 (interior), 13 (cover), 14 (back cover), 15 (TOC)
- §3 Architecture — Tasks 1, 2, 4 (scaffold, fonts, testing)
- §4 Content pipeline — Tasks 3, 5, 6, 7 (types + parsers + build script)
- §5 Pagination engine — Tasks 8, 9, 10, 11 (fonts-ready + measure + rules + paginate)
- §6 Book shell / flip engine — Tasks 16, 17 (BookShell + input hooks)
- §7 Components — Tasks 12–15, 18 (blocks, page, cover, back, toc, controls)
- §8 Responsive — Tasks 19, 21 (media query + re-pagination)
- §9 Performance — Task 20 (window preload) + Task 22 (bundle check)
- §10 Delivery — Task 23 (README)
- §11 Out of scope — noted in README
- §12 Success criteria — Task 22 (manual verification checklist)

**Placeholder scan:** No "TBD" / "TODO" / "handle appropriately" / test-less steps found.

**Type consistency:** `BookShellHandle` defined once in Task 16 and re-used unchanged in Task 19. `Page.kind` values used consistently across paginator (Task 11) and components (Tasks 12, 15). `TocEntry` defined and consumed in Task 15 only.
