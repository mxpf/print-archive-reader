import { CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { buildChaptersFromOcr, runMockOcr } from '../services/ocrService'
import type { ImportDraft, OcrPage } from '../types/book'

interface Props {
  draft: ImportDraft
  onChange: (draft: ImportDraft) => void
}

export function OCRProcessingStep({ draft, onChange }: Props) {
  const textPages = draft.sourcePages.filter((page) => !page.skipped && (page.pageRole ?? 'text') === 'text')
  const imageOnly = textPages.length === 0 && draft.sourcePages.some((page) => page.preserveImage && (page.pageRole ?? 'text') !== 'text')
  const [progress, setProgress] = useState({ current: draft.ocrPages.length, total: textPages.length })
  const started = useRef(false)
  const running = draft.ocrStatus === 'processing'

  useEffect(() => {
    if (started.current || draft.ocrPages.length > 0 || draft.sourcePages.length === 0) return
    started.current = true
    if (textPages.length === 0) {
      onChange({
        ...draft,
        ocrStatus: 'correcting',
        ocrPages: [],
        chapters: [],
      })
      return
    }
    onChange({ ...draft, ocrStatus: 'processing' })
    runMockOcr(draft.sourcePages, (current, total, result) => {
      setProgress({ current, total })
      onChange({
        ...draft,
        ocrStatus: 'processing',
        ocrPages: [...draft.ocrPages, result],
      })
    }).then((pages) => {
      onChange({
        ...draft,
        ocrStatus: 'correcting',
        ocrPages: pages,
        chapters: buildChaptersFromOcr(pages),
      })
    })
  }, [draft, onChange, textPages.length])

  const pages: OcrPage[] = draft.ocrPages

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="rounded-lg border border-stone-200 bg-white/70 p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900/70">
        <div className="flex items-center gap-3">
          {running ? <Loader2 className="animate-spin text-stone-700 dark:text-stone-200" /> : <CheckCircle2 className="text-emerald-700" />}
          <div>
            <h3 className="font-semibold text-stone-950 dark:text-white">
              {imageOnly ? 'OCR skipped for image-only import' : running ? 'Recognizing pages' : 'OCR draft ready'}
            </h3>
            <p className="text-sm text-stone-500">
              {progress.current} of {progress.total} text pages
            </p>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
          <div
            className="h-full rounded-full bg-stone-950 transition-all dark:bg-stone-100"
            style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-5 text-sm leading-6 text-stone-600 dark:text-stone-300">
          {imageOnly
            ? 'No text pages are queued. Preserved covers and illustrations will be saved directly into the reader.'
            : 'OCR is mocked for the prototype, but the module returns page-level HTML, confidence, and status exactly where a real engine would plug in.'}
        </p>
      </aside>
      <section className="grid gap-3">
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
