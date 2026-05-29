import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CaptureStep } from './CaptureStep'
import { MetadataStep } from './MetadataStep'
import { OCRProcessingStep } from './OCRProcessingStep'
import { PageReviewStep } from './PageReviewStep'
import { TextReviewStep } from './TextReviewStep'
import type { Book, ImportDraft } from '../types/book'
import { imageAssetToHtml, sourcePageToImageAsset } from '../utils/media'

interface Props {
  metadataOptions: {
    authors: string[]
    bookTypes: string[]
    tags: string[]
  }
  onCancel: () => void
  onSave: (book: Book) => void
}

const steps = ['Metadata', 'Capture', 'Cleanup', 'OCR', 'Review Text', 'Save']

function createDraft(): ImportDraft {
  return {
    id: crypto.randomUUID(),
    metadata: {
      title: '',
      subtitle: '',
      author: '',
      publicationYear: undefined,
      bookType: 'Spiritual',
      tags: ['private archive'],
      description: '',
      coverImage: 'linear-gradient(145deg, #4a3328 0%, #a77d55 48%, #efe1bd 100%)',
    },
    sourcePages: [],
    ocrPages: [],
    chapters: [],
    ocrStatus: 'capturing',
  }
}

export function ImportWizard({ metadataOptions, onCancel, onSave }: Props) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState(createDraft)
  const textPages = draft.sourcePages.filter((page) => !page.skipped && (page.pageRole ?? 'text') === 'text')
  const hasPreservedImages = draft.sourcePages.some((page) => page.preserveImage && (page.pageRole ?? 'text') !== 'text')

  const canAdvance = useMemo(() => {
    if (step === 0) return Boolean(draft.metadata.title.trim() && draft.metadata.author.trim())
    if (step === 1) return draft.sourcePages.length > 0
    if (step === 2) return draft.sourcePages.some((page) => page.cleanupStatus === 'accepted') || draft.sourcePages.length > 0
    if (step === 3) return textPages.length === 0 ? hasPreservedImages : draft.ocrPages.length > 0 && draft.chapters.length > 0
    return true
  }, [draft, hasPreservedImages, step, textPages.length])

  const goForward = () => {
    if (step === 3 && textPages.length === 0 && hasPreservedImages) {
      setStep(5)
      return
    }
    setStep(Math.min(steps.length - 1, step + 1))
  }

  const finish = () => {
    const preservedImages = draft.sourcePages.map(sourcePageToImageAsset).filter((asset) => asset !== null)
    const coverAsset = preservedImages.find((asset) => asset.role === 'cover')
    const imageChapter =
      preservedImages.length > 0
        ? {
            id: crypto.randomUUID(),
            title: preservedImages.some((asset) => asset.role === 'cover') ? 'Cover & Preserved Images' : 'Preserved Images',
            startPage: preservedImages[0].pageNumber,
            contentHtml: `<h2>${preservedImages.some((asset) => asset.role === 'cover') ? 'Cover & Preserved Images' : 'Preserved Images'}</h2>${preservedImages
              .map(imageAssetToHtml)
              .join('\n')}`,
          }
        : null
    const chapters = imageChapter ? [imageChapter, ...draft.chapters] : draft.chapters
    const book: Book = {
      id: draft.id,
      ...draft.metadata,
      coverImage: coverAsset?.imageUrl ?? draft.metadata.coverImage,
      dateAdded: new Date().toISOString(),
      readingStatus: 'Unread',
      sourcePages: draft.sourcePages,
      preservedImages,
      ocrStatus: 'complete',
      chapters,
      richTextContent: chapters.map((chapter) => chapter.contentHtml).join('\n'),
    }
    onSave(book)
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="mb-3 inline-flex h-10 items-center gap-2 rounded-full border border-stone-300 px-3 text-sm text-stone-700 dark:border-stone-700 dark:text-stone-200"
          >
            <X size={16} />
            Close
          </button>
          <h1 className="text-3xl font-semibold text-stone-950 dark:text-white">Import Book</h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            Build a private digital copy from capture through corrected reading text.
          </p>
        </div>
        <div className="hidden rounded-full border border-stone-200 bg-white/70 px-3 py-2 text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 sm:block">
          Step {step + 1} of {steps.length}
        </div>
      </header>

      <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`shrink-0 rounded-full border px-3 py-2 text-sm transition ${
              index === step
                ? 'border-stone-950 bg-stone-950 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-950'
                : index < step
                  ? 'border-stone-300 bg-white text-stone-800 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100'
                  : 'border-stone-200 bg-white/60 text-stone-500 dark:border-stone-800 dark:bg-stone-900/60'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="rounded-xl border border-stone-200 bg-[#fffaf1]/65 p-3 shadow-sm dark:border-stone-800 dark:bg-stone-950/40 sm:p-5">
        {step === 0 ? <MetadataStep draft={draft} metadataOptions={metadataOptions} onChange={setDraft} /> : null}
        {step === 1 ? <CaptureStep draft={draft} onChange={setDraft} /> : null}
        {step === 2 ? <PageReviewStep draft={draft} onChange={setDraft} /> : null}
        {step === 3 ? <OCRProcessingStep draft={draft} onChange={setDraft} /> : null}
        {step === 4 ? <TextReviewStep draft={draft} onChange={setDraft} /> : null}
        {step === 5 ? (
          <div className="mx-auto max-w-2xl py-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950">
              <Check />
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-stone-950 dark:text-white">Ready for the library</h2>
            <p className="mt-2 text-stone-600 dark:text-stone-300">
              {draft.metadata.title || 'Untitled book'} has metadata, source pages, OCR output, chapters, and corrected rich text.
            </p>
          </div>
        ) : null}
      </section>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-[#f7f1e7]/92 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/92">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="inline-flex h-12 items-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-medium disabled:opacity-35 dark:border-stone-700"
          >
            <ArrowLeft size={17} />
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={goForward}
              disabled={!canAdvance}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-semibold text-white disabled:opacity-35 dark:bg-stone-100 dark:text-stone-950"
            >
              Continue
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-semibold text-white dark:bg-stone-100 dark:text-stone-950"
            >
              <Check size={17} />
              Save to library
            </button>
          )}
        </div>
      </footer>
    </main>
  )
}
