import { createWorker, PSM } from 'tesseract.js'
import type { Chapter, OcrPage, SourcePage } from '../types/book'

export type OcrEngine = 'tesseract' | 'mock'

export interface OcrProgress {
  engine: OcrEngine
  current: number
  total: number
  pageNumber?: number
  pageProgress: number
  status: string
  result?: OcrPage
}

type OcrProgressHandler = (progress: OcrProgress) => void

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
  onProgress: OcrProgressHandler,
): Promise<OcrPage[]> {
  const usablePages = pages.filter((page) => !page.skipped && (page.pageRole ?? 'text') === 'text')
  const results: OcrPage[] = []

  for (let index = 0; index < usablePages.length; index += 1) {
    const page = usablePages[index]
    await new Promise((resolve) => window.setTimeout(resolve, 360))
    onProgress({
      engine: 'mock',
      current: index,
      total: usablePages.length,
      pageNumber: page.pageNumber,
      pageProgress: 0.4,
      status: `Drafting page ${page.pageNumber}`,
    })
    const result: OcrPage = {
      pageId: page.id,
      pageNumber: page.pageNumber,
      html: pageHtml(page, index),
      confidence: Math.max(83, 97 - index * 3),
      status: index % 4 === 3 ? 'needs_review' : 'complete',
    }
    results.push(result)
    onProgress({
      engine: 'mock',
      current: index + 1,
      total: usablePages.length,
      pageNumber: page.pageNumber,
      pageProgress: 0,
      status: `Finished page ${page.pageNumber}`,
      result,
    })
  }

  return results
}

export async function runTesseractOcr(pages: SourcePage[], onProgress: OcrProgressHandler): Promise<OcrPage[]> {
  const usablePages = pages.filter((page) => !page.skipped && (page.pageRole ?? 'text') === 'text')
  const results: OcrPage[] = []
  let activePage: SourcePage | undefined
  let activeIndex = 0

  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      onProgress({
        engine: 'tesseract',
        current: activeIndex,
        total: usablePages.length,
        pageNumber: activePage?.pageNumber,
        pageProgress: Number.isFinite(message.progress) ? message.progress : 0,
        status: normalizeTesseractStatus(message.status),
      })
    },
  })

  try {
    await worker.setParameters({
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: PSM.AUTO,
      user_defined_dpi: '300',
    })

    for (let index = 0; index < usablePages.length; index += 1) {
      const page = usablePages[index]
      activePage = page
      activeIndex = index
      onProgress({
        engine: 'tesseract',
        current: index,
        total: usablePages.length,
        pageNumber: page.pageNumber,
        pageProgress: 0,
        status: `Preparing page ${page.pageNumber}`,
      })

      const imageForOcr = await preparePageImage(page)
      const { data } = await worker.recognize(imageForOcr)
      const confidence = Math.round(data.confidence ?? 0)
      const result: OcrPage = {
        pageId: page.id,
        pageNumber: page.pageNumber,
        html: textToHtml(data.text, page.pageNumber),
        confidence,
        status: confidence < 78 || !data.text.trim() ? 'needs_review' : 'complete',
      }
      results.push(result)
      activeIndex = index + 1
      onProgress({
        engine: 'tesseract',
        current: index + 1,
        total: usablePages.length,
        pageNumber: page.pageNumber,
        pageProgress: 0,
        status: `Finished page ${page.pageNumber}`,
        result,
      })
    }
  } finally {
    await worker.terminate()
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

function normalizeTesseractStatus(status: string) {
  return status.replaceAll('_', ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}

async function preparePageImage(page: SourcePage): Promise<string> {
  if (!isRasterImage(page.imageUrl)) return page.imageUrl

  const image = await loadImage(page.imageUrl)
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const halfWidth = sourceWidth / 2
  const crop =
    page.captureMode === 'spread' && page.spreadSide
      ? {
          sx: page.spreadSide === 'left' ? 0 : halfWidth,
          sy: 0,
          sw: halfWidth,
          sh: sourceHeight,
        }
      : { sx: 0, sy: 0, sw: sourceWidth, sh: sourceHeight }
  const rotation = normalizeRotation(page.rotation)
  const canvas = document.createElement('canvas')
  const sideways = rotation === 90 || rotation === 270
  canvas.width = Math.max(1, Math.round(sideways ? crop.sh : crop.sw))
  canvas.height = Math.max(1, Math.round(sideways ? crop.sw : crop.sh))
  const context = canvas.getContext('2d')

  if (!context) return page.imageUrl

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.fillStyle = '#fffaf1'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.filter = `brightness(${clamp(page.brightness, 40, 180)}%) contrast(${clamp(page.contrast, 40, 220)}%)`
  context.translate(canvas.width / 2, canvas.height / 2)
  context.rotate((rotation * Math.PI) / 180)
  context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, -crop.sw / 2, -crop.sh / 2, crop.sw, crop.sh)

  return canvas.toDataURL('image/png')
}

function textToHtml(text: string, pageNumber: number) {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return `<p><mark>OCR returned no text for page ${pageNumber}. Compare against the scanned page reference and transcribe manually.</mark></p><hr data-page="${pageNumber}" />`
  }

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, ' ').trim())
    .filter(Boolean)

  return `${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n')}<hr data-page="${pageNumber}" />`
}

function isRasterImage(source: string) {
  return /^(data:image|blob:|https?:\/\/|\/)/.test(source)
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load page image for OCR.'))
    image.src = source
  })
}

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

// Additional OCR engines can be added beside runTesseractOcr and runMockOcr.
// Keep the adapter returning OcrPage[] so the import wizard, correction screen,
// and reader do not need to know whether text came from Tesseract.js, OCRmyPDF,
// Google Vision, ABBYY, or a private batch service.
