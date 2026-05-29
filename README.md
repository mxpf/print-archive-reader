# Private Print Archive

A polished mobile-first prototype for digitizing personal print books into a private searchable reading library. It covers the full product loop: create book metadata, capture pages, review cleanup controls, run mocked OCR, correct rich text, save to a local library, and read with a typography-focused mobile/tablet reader.

## Run Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://127.0.0.1:5173/`.

To verify a production build:

```bash
npm run build
```

## Main Screens

- **Library**: seeded with four realistic sample books, searchable across title, subtitle, author, tags, type, year, and description. Includes editorial grid and compact directory list views.
- **Reader**: light/dark mode, continuous scroll, page mode, chapter picker, font sizing, progress, rich text, block quotes, and footnotes.
- **Import Book**: metadata, phone-friendly capture, page cleanup review, OCR progress, text correction, chapter editing, and save to library.
- **Source Reference**: imported books retain original scanned pages with page numbers, spread-side metadata, roles, notes, and preserved images for citation and verification.

## Typography

The app uses EB Garamond from Google Fonts across the full interface, including controls, metadata, reader text, footnotes, page markers, and generated archive labels. The import is defined in `src/index.css`.

## Data Model

The core type is `Book` in `src/types/book.ts`.

Each book includes:

- `id`, `title`, `subtitle`, `author`, `publicationYear`
- `bookType`, `tags`, `description`, `coverImage`
- `dateAdded`, `readingStatus`, `lastReadPosition`
- `sourcePages`, `preservedImages`, `ocrStatus`, `chapters`, `richTextContent`

`SourcePage` stores capture/review state such as image, page number, capture mode (`single` or `spread`), spread side (`left` or `right`), page role (`text`, `cover`, or `illustration`), image-preservation flag, notes, skipped flag, rotation, brightness, contrast, and cleanup status. `BookImageAsset` stores preserved cover and illustration images that can be rendered inside the reader. `OcrPage` stores page-level recognized HTML, confidence, and status.

## Rich Text Representation

Corrected reading content is stored as sanitized-style HTML strings in `Chapter.contentHtml` and concatenated into `Book.richTextContent`.

This is practical for the prototype because it preserves:

- headings
- paragraphs
- bold and italic spans
- block quotes
- page markers via `<hr data-page="...">`
- footnotes/endnotes using regular HTML lists and anchors
- preserved cover/illustration figures using `<figure>`

Before production use, add a real sanitizer such as DOMPurify before persisting imported HTML.

Footnote formatting supports two patterns:

- **Page footnotes** use `<aside class="page-footnotes">` and are meant for notes printed at the bottom of a regular page.
- **Back-of-book notes** use normal `<ol class="endnotes">` targets and can live in a dedicated notes chapter. References link by matching `fnref-N` and `fn-N` IDs.

## Import Mode

The import wizard lives in `src/components/ImportWizard.tsx` and is split into:

- `MetadataStep`
- `CaptureStep`
- `PageReviewStep`
- `OCRProcessingStep`
- `TextReviewStep`
- `RichTextEditor`

The capture step attempts to use `navigator.mediaDevices.getUserMedia` with the environment camera. If camera access is unavailable, it falls back to a convincing mocked capture path and file upload. Capture supports single-page and facing-page/spread mode. In spread mode, one uploaded or captured image becomes two ordered logical pages with left/right crop metadata, so future OCR or canvas processing can crop each side while preserving page order. Captured pages can be marked as text pages, cover images, or illustrations; cover and illustration pages can be preserved in the reader, and a preserved cover can also become the library thumbnail. The component keeps the camera boundary isolated so true image capture can be upgraded without changing the rest of the flow.

## OCR

OCR is mocked in `src/services/ocrService.ts`.

The service returns `OcrPage[]` with:

- page order
- page-level HTML
- confidence values
- status indicators

To replace it with real OCR, keep the same adapter shape and connect one of:

- Tesseract.js for fully local browser OCR
- OCRmyPDF for local document pipelines
- Google Vision or ABBYY for high-accuracy service OCR
- a private OCR service for batch import

The UI does not depend on which engine produced the text.

## Persistence

Books are stored locally in IndexedDB through `src/services/storage.ts`. Initial sample books are seeded once using a localStorage flag. No backend is required.

## GitHub Pages

Local builds use `/` as the Vite base path. GitHub Pages builds set `GITHUB_PAGES=true`, which switches the base path to `/print-archive-reader/`.

This repo is published to Pages from the `gh-pages` branch. To refresh the static build:

```bash
GITHUB_PAGES=true npm run build
```

Then publish the contents of `dist/` to the `gh-pages` branch.

## Folder Structure

```text
src/
  components/      UI screens and reusable controls
  data/            sample books
  services/        IndexedDB persistence and OCR adapter
  types/           book/import TypeScript models
  utils/           library filtering and sorting
```

## Recommended Next Steps

- Add DOMPurify before saving edited HTML.
- Add a service worker and real app icons for full PWA install behavior.
- Capture actual camera frames to canvas instead of placeholder pages.
- Add crop/deskew/contrast image processing.
- Integrate Tesseract.js or a private OCR adapter.
- Add export formats such as EPUB, HTML, Markdown, or PDF.
