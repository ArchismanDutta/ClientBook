# Preneur Gate — Interactive Flipbook

A premium digital-book web app that renders the Preneur Gate Statement of Work as a physical-feeling flipbook with realistic page-turn animation.

## Quick start

    npm install
    npm run build:content       # DOCX → src/content/book.json + images
    npm run build:questionnaire # questionnaire DOCX → src/content/questionnaire.json
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

## Start screen and questionnaire

On first load both books sit side by side: the statement of work on the left, the client onboarding questionnaire on the right. Clicking a cover grows it into the middle and opens that book while the other slides away to its side. Inside a book, the button at the top right reads **Go to Questionnaire** or **Go to SOW**: the current book slides out and the other slides in (the statement of work always leaves or arrives on the left, the questionnaire on the right). Clicking **Preneur Gate** in the heading shows both books again. The **Highlighter** sits in the bottom reading bar of the statement of work; while it is on, the colour choices float just above the bar.

An address with `#p=12` or `#q=3` skips the start screen and opens that book at that page, so reloading keeps the reader where they were.

- Questions come from `Preneur_Gate_Client_Onboarding_Questionnaire_Revised.docx`. After editing it, run `npm run build:questionnaire` to regenerate `src/content/questionnaire.json` (checked in, like `book.json`).
- Each requirement row becomes a numbered question: the **Status** checkboxes (`[ ] Ready`, `[ ] Pending`, `[ ] N/A`) become the options and the empty **Client Response / Details** column becomes the answer box. Two-column tables with an empty second column become labelled blanks (project details at the start, client sign-off at the end).
- Answers save in the browser's localStorage (`preneur-gate:questionnaire:v1`) as the reader types, and stay until they are edited or cleared with the **Clear** button on each question. Nothing is sent to a server, so answers live on that device and browser only.
- **Download** on the last page saves a plain-text copy of every answer.
- Inside the questionnaire a plain click turns an inner page only at its corners, so clicking around a question never flips it by accident (the covers still open with a click). Arrows, keyboard and swipes work as in the statement of work.

## Structure

    scripts/build-content.ts    # DOCX parser (mammoth + sharp)
    scripts/build-questionnaire.ts  # questionnaire DOCX parser
    src/content/book.json       # generated, checked in
    src/content/questionnaire.json  # generated, checked in
    src/types/book.ts           # data model
    src/types/questionnaire.ts  # questionnaire data model
    src/lib/pagination/         # measurement-based paginator
    src/lib/questionnaire/      # answer storage, questionnaire paginator, text export
    src/components/             # Cover, Page, TableOfContents, Controls, BookShelf (start screen), etc.
    src/components/questionnaire/   # questionnaire book, pages, question cards
    src/styles/tokens.css       # design tokens (colors, type, spacing)
    src/styles/questionnaire.css    # questionnaire pages and the reader tools
    src/styles/shelf.css        # start screen with both books

## Responsive reader

- Screens below 960px use a single page; wider screens use a two-page spread.
- Page dimensions and pagination adapt to the available viewport. Short screens can scroll vertically to keep the text readable.
- Contents, lists, and tables continue onto additional pages. Wide tables become labeled rows on phones; unusually tall indivisible items have a scrollable reading area.
- Navigation stays visible, supports touch swipes and keyboard arrows, and preserves the current chapter when resizing.
- Self-hosted fonts are loaded before measuring pages to prevent clipped text after font swaps.

Run `npm test`, `npm run lint`, and `npm run build` to validate changes.

## Known limitations (v1)

- No in-book search
- No pinch-to-zoom
- No bookmarks or annotations
- No dark reading mode
- Basic keyboard nav + semantic headings; not screen-reader-optimized

## License

Private.
# ClientBook
