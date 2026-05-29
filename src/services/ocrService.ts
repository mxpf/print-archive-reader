import type { Chapter, OcrPage, SourcePage } from '../types/book'

const sampleParagraphs = [
  'The page had yellowed at the edges, yet the words remained clear enough to ask for another life. A private library is never quite private; it is a conversation temporarily held in trust.',
  'I marked the line because it seemed to gather the whole argument: <em>memory requires form</em>. Without margins, titles, pauses, and emphasis, the page loses part of its mercy.',
  '<strong>Every recovered page is a small act of stewardship.</strong> The work is patient, imperfect, and worth doing carefully.',
  '<blockquote>One does not preserve a book by flattening it into data. One preserves it by carrying forward its shape.</blockquote>',
]

function pageHtml(page: SourcePage, index: number) {
  const base = sampleParagraphs[index % sampleParagraphs.length]
  return `<p>${base}</p><p>This is the recognized text for page ${page.pageNumber}. It preserves <em>italic</em> and <strong>bold</strong> spans so the correction pass can keep typographic meaning.</p><hr data-page="${page.pageNumber}" />`
}

export async function runMockOcr(
  pages: SourcePage[],
  onProgress: (page: number, total: number, result: OcrPage) => void,
): Promise<OcrPage[]> {
  const usablePages = pages.filter((page) => !page.skipped && (page.pageRole ?? 'text') === 'text')
  const results: OcrPage[] = []

  for (let index = 0; index < usablePages.length; index += 1) {
    const page = usablePages[index]
    await new Promise((resolve) => window.setTimeout(resolve, 360))
    const result: OcrPage = {
      pageId: page.id,
      pageNumber: page.pageNumber,
      html: pageHtml(page, index),
      confidence: Math.max(83, 97 - index * 3),
      status: index % 4 === 3 ? 'needs_review' : 'complete',
    }
    results.push(result)
    onProgress(index + 1, usablePages.length, result)
  }

  return results
}

export function buildChaptersFromOcr(ocrPages: OcrPage[]): Chapter[] {
  const midpoint = Math.ceil(ocrPages.length / 2)
  const groups = [ocrPages.slice(0, midpoint), ocrPages.slice(midpoint)].filter((group) => group.length > 0)

  return groups.map((group, index) => ({
    id: crypto.randomUUID(),
    title: index === 0 ? 'Chapter I: Recovered Pages' : 'Chapter II: Notes and Continuations',
    startPage: group[0].pageNumber,
    contentHtml: `<h2>${index === 0 ? 'Chapter I: Recovered Pages' : 'Chapter II: Notes and Continuations'}</h2>${group
      .map((page) => page.html)
      .join('\n')}`,
  }))
}

// Future integration point:
// Replace runMockOcr with an adapter for Tesseract.js, OCRmyPDF, Google Vision, ABBYY,
// or a private OCR service. Keep the adapter returning OcrPage[] so the import wizard,
// correction screen, and reader do not need to know which OCR engine produced the text.
