# Preneur Gate Interactive Flipbook — Design

**Date:** 2026-09-22
**Status:** Approved for planning
**Source content:** `Preneur_Gate_Detailed_SOW_Updated_Architecture.docx` (882 paragraphs, 17 top-level sections, 60 sub-sections)
**Animation reference:** `Generated video 1.mp4` (Gemini-generated physical page-turning reference)

## 1. Purpose

Deliver a premium, commercial-grade digital flipbook website that transforms the Preneur Gate Statement of Work (DOCX) into an interactive book with realistic physical page-turning. The book — its cover, its typography, its animation — is the entire product. The interface should almost disappear.

The system must generalize: replacing the DOCX and re-running one build script should regenerate a new book with the same visual quality, no manual page authoring.

## 2. Visual System (Locked)

### 2.1 Direction

"Funky premium editorial" — cream paper base, expressive Fraunces display type, punchy color-block accents. Direction A (Magazine Cover) locked during brainstorming.

### 2.2 Palette

- **Paper:** `#f2ead9` (cover), `#fbf5e8` (interior top), `#f2e9d3` (interior bottom)
- **Ink:** `#141310` (primary text, dark strip)
- **Accents:** blue `#1a5cff`, pink `#ff2f8a`, yellow `#ffd400`, mint `#7fe0ba`
- All palette values live in `src/styles/tokens.css` so rebrand = edit one file.

### 2.3 Typography

- **Display:** Fraunces (variable, `opsz` 96–144, `SOFT` 60–100, `WONK` on) — headlines, page numbers, italic accents.
- **Utilitarian:** Space Grotesk 500/600/700 — running heads, chips, small labels.
- **Body:** Inter 400/500/600 — paragraphs, list items, table cells.
- All three self-hosted as WOFF2 in `public/fonts/`. Fraunces and Space Grotesk `preload`ed so the cover never flashes.

### 2.4 Cover (Direction A — Magazine Cover)

- Cream paper stock, rounded right edge, warm inset shadow.
- Editorial masthead top: "Preneur Gate · Vol. I" / barcode / "MMXXVI · No. 01".
- Title: "Preneur" (upright) / "Gate." (italic pink) in Fraunces, 74px display size at reference 3:4.
- Subtitle: "Gateway to Entrepreneurship — a Statement of Work for the premium learning platform." in Space Grotesk, tracked uppercase.
- Centered PreneurGate logo emblem at 44% width with drop shadow.
- Chip row: pink "3 Modules", blue "45–60 Days", yellow "Version 1.1".
- Dark rounded strip bottom: italic Fraunces "Detailed Statement of Work" + Space Grotesk "Read Inside →".

### 2.5 Interior Page

- Cream paper with warm inner shadow along the spine edge, subtle paper-grain overlay.
- Barcode running head + section tag on top separator.
- Optional pink pill kicker (`§ 02 · Architecture`).
- Fraunces italic H1 with color accent word (blue or pink), 34px at reference.
- Italic Fraunces lede paragraph for chapter openers.
- Body in Inter, color-coded square bullets (yellow, pink, blue, mint rotating).
- Dark rounded pullquote block for `IMPORTANT` / `RECOMMENDED` callouts.
- Italic Fraunces page number bottom-right, imprint bottom-left.

### 2.6 Back Cover

Quiet mirror of the front. Same paper. Small colophon: imprint, version, page count, generated date. Nothing else.

## 3. Architecture

### 3.1 Stack

- **Vite** + **React 18** + **TypeScript**.
- **StPageFlip** (`page-flip` npm package) for the flip engine — called imperatively from `BookShell.tsx`, no third-party React wrapper.
- **mammoth** for DOCX parsing (build-time only, not shipped to the browser).
- No CSS framework — plain CSS with design tokens.

### 3.2 Two-step build

1. `npm run build:content` — Node script parses DOCX, extracts images, emits `src/content/book.json` and `public/assets/book-images/*.webp`.
2. `npm run build` — Vite bundles the app; imports `book.json` at compile time.

Swapping the DOCX = drop new file, rerun both commands.

### 3.3 Folder layout

```
scripts/
  build-content.ts               # DOCX → book.json + image extraction
public/
  fonts/                         # Fraunces, Space Grotesk, Inter WOFF2
  assets/
    logo.png
    book-images/                 # extracted, downscaled DOCX images
src/
  content/
    book.json                    # generated, checked in
  types/
    book.ts                      # Book, Section, Block, InlineRun, Page
  lib/
    pagination/
      paginate.ts                # measurement-based paginator
      rules.ts                   # break-point rules (orphan, keep-with-next, split)
      measure.ts                 # hidden-container height measurement
  components/
    BookShell.tsx                # StPageFlip mount, input funnels, page preload
    Cover.tsx                    # Direction A magazine cover
    BackCover.tsx                # colophon
    Page.tsx                     # generic interior page (opener | continuation | image)
    TableOfContents.tsx          # auto-generated TOC page(s)
    Controls.tsx                 # prev/next, page indicator, TOC toggle, fullscreen
    ProgressBar.tsx              # thin top bar
    blocks/
      Paragraph.tsx
      List.tsx
      Table.tsx
      Callout.tsx
      FigureImage.tsx
  hooks/
    useKeyboardNav.ts
    useHashRoute.ts              # #p=23 deep links
    useMediaQuery.ts
    useFontsReady.ts
  styles/
    tokens.css                   # palette, type scale, spacing
    reset.css
    book.css
    page.css
  App.tsx
  main.tsx
  index.html
```

## 4. Content Pipeline (DOCX → JSON)

### 4.1 Data model (`src/types/book.ts`)

```ts
type InlineRun = { text: string; bold?: boolean; italic?: boolean; href?: string };

type Block =
  | { type: 'para'; runs: InlineRun[] }
  | { type: 'list'; style: 'bullet' | 'number'; items: InlineRun[][] }
  | { type: 'table'; header?: string[]; rows: string[][] }
  | { type: 'image'; src: string; alt: string; w: number; h: number }
  | { type: 'callout'; label: string; body: InlineRun[] };

type Section = {
  id: string;         // stable slug from heading text
  level: 1 | 2;
  title: string;
  blocks: Block[];
};

type Book = {
  title: string;
  subtitle: string;
  meta: { version: string; date: string; imprint: string };
  sections: Section[];
};
```

### 4.2 Parser behavior (`scripts/build-content.ts`)

- Uses `mammoth.convertToHtml` with a style map keyed to `Heading1`, `Heading2`, `ListBullet`, `ListNumber`.
- Post-processes the HTML into the `Block[]` model with a small tokenizer (no full HTML parser needed — mammoth output is predictable).
- **Callout detection:** a paragraph whose entire text is uppercase and ≤ 6 words (e.g. `IMPORTANT`, `DELIVERY PRINCIPLE`, `RECOMMENDED ARCHITECTURE PATTERN`) is merged with the following paragraph into a `callout` block. The uppercase text becomes the `label`.
- **Image extraction:** each embedded image is written to `public/assets/book-images/img-<hash>.webp` (downscaled to 2× page width, ~1400px), and referenced by relative path in the JSON.
- **Table extraction:** first row is treated as `header` if all cells are bold or if the row before it in the DOCX was a `Heading2`.
- Emits `src/content/book.json`. Target size ~200 KB.

## 5. Pagination Engine

### 5.1 Approach

DOM measurement, offscreen. A hidden `<div>` is styled identically to the visible page (`page.css`) and sized to the current viewport tier's page dimensions. Blocks are rendered one at a time via `ReactDOM.createRoot` inside that container, `scrollHeight` is measured after each block, and when the next block would exceed the container height, the page is closed and a new one starts.

### 5.2 Break-point rules (`lib/pagination/rules.ts`)

Applied in order before the naive overflow check:

1. **No orphan headings.** A heading block cannot be the last block on a page — if it would be, push to next page.
2. **Keep-with-next.** A heading is always kept with the paragraph immediately following it.
3. **List splitting.** A list may split across pages, but no single item may be orphaned at the bottom. If only one item fits, push the list break earlier.
4. **Paragraph splitting.** If a whole paragraph does not fit, split at the nearest sentence boundary; the continuation on the next page gets a subtle `¶` glyph before its first line.
5. **Callouts are atomic.** Never split. If a callout doesn't fit, push it to the next page in whole.
6. **Tables.** Prefer whole. If taller than a page, split at row boundaries and repeat the header row.
7. **Images.** Downscale to fit page width. If still too tall, image gets its own centered page.

### 5.3 Chapter openers

Every `Heading 1` starts on a fresh right-hand page. The paginator ensures this by inserting a blank left page when needed (rendered as a "This page intentionally left blank" ghost, standard book behavior).

### 5.4 Execution

Runs after fonts are ready (`useFontsReady`), chunked via `requestIdleCallback` (or `setTimeout` fallback) so it doesn't block the initial cover render. Result: `Page[]` — an array of `{ blocks, sectionId, pageNumber, opener?: boolean }`. Stored in React state; TOC and page indicator derive from it.

### 5.5 Recomputation

Pagination reruns on layout tier change (mobile ↔ desktop), because page dimensions change. Debounced 250ms on window resize. The visible page number is remapped to the nearest equivalent block in the new pagination.

## 6. Book Shell & Flip Engine

### 6.1 StPageFlip configuration

```ts
{
  width: 480,               // reference per-page width, scaled by CSS
  height: 672,              // 5:7 aspect (per page)
  size: 'stretch',
  minWidth: 280,
  maxWidth: 600,            // per page; 2-page spread caps at 1200 to match §8
  minHeight: 400,
  maxHeight: 840,           // matches §8 tier cap
  drawShadow: true,
  maxShadowOpacity: 0.5,
  showCover: true,
  usePortrait: true,        // enables mobile single-page mode
  flippingTime: 900,        // ms, matches the reference video's deliberate pace
  useMouseEvents: true,
  mobileScrollSupport: false
}
```

### 6.2 Input handling

All inputs funnel through a single controller that guards against double-flips (locks input during `onFlip`):

- **Click:** right half → `flipNext`, left half → `flipPrev`. Excluded regions: TOC entries, chips, controls.
- **Keyboard:** ArrowRight/PageDown → next; ArrowLeft/PageUp → prev; Home → cover; End → back cover; Escape → exit fullscreen.
- **Touch:** swipe detection with 40px threshold and > 0.3 velocity. One flip per gesture, no accidental double-flips.
- **URL hash:** `#p=23` deep-links to page 23 on load; `pushState` keeps hash in sync as pages turn. Back/forward buttons navigate pages.

### 6.3 Page preloading

The current spread plus 2 spreads ahead and 2 behind are fully rendered. Other pages exist as lightweight placeholders until the reader nears them, then hydrate. Keeps DOM under ~400 nodes for a 100-page book.

### 6.4 Closed → open

Initial render: cover only, slight angle, "Open" hover cue. Clicking the cover calls `flipNext()` — StPageFlip animates the cover opening onto the first interior spread (TOC page).

## 7. Components

### 7.1 Cover.tsx

Static component, no props. Renders the locked Direction A design. Logo loaded from `/assets/logo.png`.

### 7.2 Page.tsx

Renders any `Page` from the paginator. Three visual modes, determined by data:

- **Chapter opener** — `page.opener === true` and `page.blocks[0]` is a heading. Big italic Fraunces title, pink pill kicker with section number, italic Fraunces lede paragraph, then remaining blocks.
- **Continuation** — thin barcode running head, section tag, then blocks, then italic Fraunces page number.
- **Standalone image** — single `image` block, centered, generous margins, caption below.

Each block routes to a small subcomponent in `components/blocks/`.

### 7.3 TableOfContents.tsx

Auto-generated as an actual page (or two) early in the book, right after the cover.

- Chapter title in Fraunces (upright), dotted leader, italic Fraunces page number.
- Subsections indented in Inter, smaller, quieter.
- Each entry is clickable → `bookShell.turnToPage(n)`.

### 7.4 Controls.tsx

Floating bottom-center, glassy dark bar with generous padding, auto-fades after 2s idle (mouse-move revives). Contents:

- `←` prev
- `Page 14 / 96` — click opens a small "Go to page" popover with a chapter picker
- `→` next
- TOC icon — turns to the TOC page
- Fullscreen icon — enters/exits `requestFullscreen`

No zoom, no search, no bookmarks in v1.

### 7.5 ProgressBar.tsx

2px bar pinned to viewport top. Cream track, pink fill. Width = `currentPage / totalPages`. Zero interactivity — indicator only.

### 7.6 BackCover.tsx

Quiet mirror. Small colophon: "Preneur Gate · Detailed Statement of Work · Version 1.1 · MMXXVI · 96 pages · Generated from source DOCX 2026-09-22." Centered, Space Grotesk, tracked uppercase, low opacity.

## 8. Responsive Behavior

| Tier | Layout | Notes |
|---|---|---|
| ≥1024px | Two-page spread | Book scales to `min(viewport - 80px, 1200×840)` |
| 640–1023px | Two-page spread | Scaled down; controls reflow tighter |
| <640px | Single page (portrait) | StPageFlip `usePortrait: true`; tap-to-flip disabled, swipe only |

Pagination reruns on tier change (page height differs, so page count changes). Cover chip row wraps to two lines on mobile.

## 9. Performance

**Targets**

- First paint (closed cover visible): < 1s on typical laptop.
- Pagination pass (this document, desktop): < 500ms, idle-scheduled — does not block interaction.
- Flip: 60fps sustained. Only visible spreads paint during a flip.
- App bundle: < 200KB gzip (React + StPageFlip + app code).
- `book.json`: ~200KB.
- Cover LCP: < 1.5s including preloaded fonts.

**Techniques**

- Idle-scheduled pagination (`requestIdleCallback`).
- Lightweight page placeholders outside the ±2 spread window.
- Extracted images downscaled to 2× page width, saved as WebP, `loading="lazy"`.
- `font-display: swap` with preload hints for the cover's two typefaces.
- `will-change: transform` only on the actively flipping page.

## 10. Delivery

- Static build in `dist/` — deploys to Vercel, Netlify, Cloudflare Pages, S3, GitHub Pages. No server-side.
- `README.md` documents:
  - How to swap the DOCX (replace file → `npm run build:content` → `npm run build`).
  - How to rebrand (edit `src/styles/tokens.css`).
  - How to run locally (`npm install` → `npm run build:content` → `npm run dev`).
  - Known limitations (v1 has no search/zoom/bookmarks).

## 11. Out of Scope (v1)

- In-book search
- Zoom / pinch-to-zoom
- Bookmarks / annotations
- Dark reading mode
- Multi-language support
- Server-side DOCX upload
- Accessibility read-aloud (basic keyboard nav and semantic headings are included; screen-reader-first experience is not)

## 12. Success Criteria

1. Opening the site shows the locked Direction A cover, no layout flash, in under 1 second on a typical laptop.
2. Clicking the cover physically opens it onto the TOC spread with the same page-curl motion as the reference video.
3. Every arrow-key press, click, or swipe cleanly turns one page — no double-flips, no stuck states.
4. All 882 paragraphs from the DOCX are present and readable across the paginated book. No content is dropped, no page overflows.
5. Every chapter (Heading 1) opens on a fresh right-hand page with the chapter-opener treatment.
6. Callouts (`IMPORTANT`, `RECOMMENDED ARCHITECTURE PATTERN`, etc.) render as dark rounded pullquotes on the correct pages.
7. Replacing the DOCX with a different DOCX and rerunning both build commands yields a new book with no code changes, provided the DOCX uses similar Word styles (Heading1, Heading2, ListBullet, etc.).
8. Mobile (<640px) shows single-page portrait mode with legible typography and swipe navigation. No horizontal overflow, no cut text.
9. TOC entries jump to the correct page. `#p=N` in the URL deep-links to page N and updates as the reader turns pages.
10. First-to-last-page reading, cover to back cover, remains smooth with no perceptible frame drops.
