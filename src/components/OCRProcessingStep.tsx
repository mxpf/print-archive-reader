import { AlertCircle, CheckCircle2, FileText, Loader2, Play, RotateCcw, ScanText, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { buildChaptersFromOcr, runMockOcr, runTesseractOcr } from '../services/ocrService'
import type { OcrEngine, OcrProgress } from '../services/ocrService'
import type { ImportDraft, OcrPage } from '../types/book'

interface Props {
  draft: ImportDraft
  onChange: (draft: ImportDraft) => void
}

export function OCRProcessingStep({ draft, onChange }: Props) {
  const textPages = draft.sourcePages.filter((page) => !page.skipped && (page.pageRole ?? 'text') === 'text')
  const imageOnly = textPages.length === 0 && draft.sourcePages.some((page) => page.preserveImage && (page.pageRole ?? 'text') !== 'text')
  const [engine, setEngine] = useState<OcrEngine>(getStoredOcrEngine)
  const [progress, setProgress] = useState<OcrProgress>({
    engine,
    current: draft.ocrPages.length,
    total: textPages.length,
    pageProgress: 0,
    status: draft.ocrPages.length > 0 ? 'OCR draft ready' : 'Waiting to start',
  })
  const [error, setError] = useState('')
  const running = draft.ocrStatus === 'processing'
  const pages: OcrPage[] = draft.ocrPages
  const ready = pages.length > 0 && draft.chapters.length > 0 && !running
  const completion = progress.total ? ((progress.current + progress.pageProgress) / progress.total) * 100 : 0

  useEffect(() => {
    if (textPages.length === 0 && draft.ocrStatus !== 'correcting') {
      onChange({
        ...draft,
        ocrStatus: 'correcting',
        ocrPages: [],
        chapters: [],
      })
    }
  }, [draft, imageOnly, onChange, textPages.length])

  const textPageSummary = useMemo(() => {
    const spreadPages = textPages.filter((page) => page.captureMode === 'spread').length
    if (spreadPages === 0) return `${textPages.length} text page${textPages.length === 1 ? '' : 's'} queued`
    return `${textPages.length} text page${textPages.length === 1 ? '' : 's'} queued, including ${spreadPages} facing-page crop${spreadPages === 1 ? '' : 's'}`
  }, [textPages])

  const startOcr = async (selectedEngine = engine) => {
    if (running || textPages.length === 0) return
    localStorage.setItem('print-archive-ocr-engine', selectedEngine)
    setEngine(selectedEngine)
    setError('')
    setProgress({
      engine: selectedEngine,
      current: 0,
      total: textPages.length,
      pageProgress: 0,
      status: selectedEngine === 'tesseract' ? 'Loading local OCR engine' : 'Preparing mock OCR draft',
    })
    onChange({
      ...draft,
      ocrStatus: 'processing',
      ocrPages: [],
      chapters: [],
    })

    const runningPages: OcrPage[] = []
    const handleProgress = (event: OcrProgress) => {
      setProgress(event)
      if (!event.result) return
      runningPages.push(event.result)
      onChange({
        ...draft,
        ocrStatus: 'processing',
        ocrPages: [...runningPages],
        chapters: buildChaptersFromOcr(runningPages),
      })
    }

    try {
      const recognizedPages = selectedEngine === 'tesseract' ? await runTesseractOcr(draft.sourcePages, handleProgress) : await runMockOcr(draft.sourcePages, handleProgress)
      onChange({
        ...draft,
        ocrStatus: 'correcting',
        ocrPages: recognizedPages,
        chapters: buildChaptersFromOcr(recognizedPages),
      })
      setProgress({
        engine: selectedEngine,
        current: recognizedPages.length,
        total: textPages.length,
        pageProgress: 0,
        status: 'OCR draft ready',
      })
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'The OCR engine failed to read these pages.'
      setError(message)
      setProgress({
        engine: selectedEngine,
        current: runningPages.length,
        total: textPages.length,
        pageProgress: 0,
        status: 'OCR stopped',
      })
      onChange({
        ...draft,
        ocrStatus: runningPages.length > 0 ? 'correcting' : 'reviewing',
        ocrPages: runningPages,
        chapters: buildChaptersFromOcr(runningPages),
      })
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-lg border border-stone-200 bg-white/70 p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/70">
        <div className="flex items-center gap-3">
          {error ? (
            <AlertCircle className="text-amber-700 dark:text-amber-300" />
          ) : running ? (
            <Loader2 className="animate-spin text-stone-700 dark:text-stone-200" />
          ) : ready || imageOnly ? (
            <CheckCircle2 className="text-emerald-700" />
          ) : (
            <ScanText className="text-stone-700 dark:text-stone-200" />
          )}
          <div>
            <h3 className="font-semibold text-stone-950 dark:text-white">
              {imageOnly ? 'OCR skipped for image-only import' : error ? 'OCR needs attention' : running ? 'Recognizing pages' : ready ? 'OCR draft ready' : 'Choose OCR engine'}
            </h3>
            <p className="text-sm text-stone-500">
              {progress.current} of {progress.total} text pages
            </p>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-stone-950 transition-all dark:bg-stone-100"
            style={{ width: `${Math.min(100, completion)}%` }}
          />
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-300">
          {imageOnly
            ? 'No text pages are queued. Preserved covers and illustrations will be saved directly into the reader.'
            : running
              ? `${progress.status}${progress.pageNumber ? ` for page ${progress.pageNumber}` : ''}.`
              : 'Tesseract.js runs locally in your browser. The mock engine remains available when you want to test the correction flow without waiting.'}
        </p>
        {!imageOnly ? (
          <>
            <p className="mt-3 rounded-md bg-stone-100/80 px-3 py-2 text-xs leading-5 text-stone-600 dark:bg-stone-950/70 dark:text-stone-300">
              {textPageSummary}. Spread uploads are cropped to the left or right page before recognition. The original scan remains stored as the source reference.
            </p>
            <div className="mt-5 grid gap-2">
              <button
                type="button"
                onClick={() => startOcr('tesseract')}
                disabled={running}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:opacity-40 ${
                  engine === 'tesseract'
                    ? 'bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950'
                    : 'border border-stone-300 text-stone-700 dark:border-stone-700 dark:text-stone-200'
                }`}
              >
                {pages.length > 0 && engine === 'tesseract' ? <RotateCcw size={16} /> : <Play size={16} />}
                Run local OCR
              </button>
              <button
                type="button"
                onClick={() => startOcr('mock')}
                disabled={running}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition disabled:opacity-40 ${
                  engine === 'mock'
                    ? 'bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950'
                    : 'border border-stone-300 text-stone-700 dark:border-stone-700 dark:text-stone-200'
                }`}
              >
                <Wand2 size={16} />
                Use mock draft
              </button>
            </div>
            {error ? (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                {error}
              </div>
            ) : null}
          </>
        ) : null}
      </aside>
      <section className="grid gap-3">
        {!running && pages.length === 0 && !imageOnly ? (
          <article className="rounded-lg border border-dashed border-stone-300 bg-white/50 p-6 text-sm leading-6 text-stone-600 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-300">
            Start with local OCR for real scanned pages. It may take a little while the first time because the browser downloads the English language model.
          </article>
        ) : null}
        {pages.map((page) => (
          <article key={page.pageId} className="rounded-lg border border-stone-200 bg-white/75 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900/75">
            <div className="mb-2 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-sm font-semibold">
                <FileText size={16} />
                Page {page.pageNumber}
              </div>
              <span className="rounded-full border border-stone-200 px-2 py-1 text-xs text-stone-500 dark:border-stone-700">
                {page.confidence}% confidence
              </span>
            </div>
            <div className="reader-content text-sm leading-6 text-stone-700 dark:text-stone-300" dangerouslySetInnerHTML={{ __html: page.html }} />
          </article>
        ))}
      </section>
    </div>
  )
}

function getStoredOcrEngine(): OcrEngine {
  return localStorage.getItem('print-archive-ocr-engine') === 'mock' ? 'mock' : 'tesseract'
}
