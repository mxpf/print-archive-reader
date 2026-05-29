import { FileText, Image, Info, Plus } from 'lucide-react'
import { useState } from 'react'
import { RichTextEditor } from './RichTextEditor'
import type { Chapter, ImportDraft } from '../types/book'
import { imageSurfaceStyle } from '../utils/media'

interface Props {
  draft: ImportDraft
  onChange: (draft: ImportDraft) => void
}

export function TextReviewStep({ draft, onChange }: Props) {
  const [activeChapterId, setActiveChapterId] = useState(draft.chapters[0]?.id)
  const activeChapter = draft.chapters.find((chapter) => chapter.id === activeChapterId) ?? draft.chapters[0]
  const firstPage = draft.sourcePages.find((page) => page.pageNumber === activeChapter?.startPage) ?? draft.sourcePages[0]

  const updateChapter = (id: string, patch: Partial<Chapter>) =>
    onChange({ ...draft, chapters: draft.chapters.map((chapter) => (chapter.id === id ? { ...chapter, ...patch } : chapter)) })

  const addChapter = () => {
    const chapter: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${draft.chapters.length + 1}`,
      startPage: draft.sourcePages[0]?.pageNumber ?? 1,
      contentHtml: '<h2>New Chapter</h2><p>Begin corrected text here.</p>',
    }
    onChange({ ...draft, chapters: [...draft.chapters, chapter] })
    setActiveChapterId(chapter.id)
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-w-0 rounded-lg border border-stone-200 bg-white/70 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900/70">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Chapters</h3>
          <button
            type="button"
            onClick={addChapter}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-950 text-white dark:bg-stone-100 dark:text-stone-950"
            title="Add chapter"
            aria-label="Add chapter"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 xl:grid xl:overflow-visible xl:pb-0">
          {draft.chapters.map((chapter) => (
            <button
              key={chapter.id}
              type="button"
              onClick={() => setActiveChapterId(chapter.id)}
              className={`min-w-[230px] rounded-md border p-3 text-left transition xl:min-w-0 ${
                chapter.id === activeChapter?.id
                  ? 'border-stone-900 bg-stone-100 dark:border-stone-300 dark:bg-stone-800'
                  : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950'
              }`}
            >
              <div className="flex min-w-0 items-start gap-2 text-sm font-medium">
                <FileText size={15} className="mt-0.5 shrink-0" />
                <span className="line-clamp-2">{chapter.title}</span>
              </div>
              <div className="mt-1 text-xs text-stone-500">Starts page {chapter.startPage}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="grid gap-3">
        {activeChapter ? (
          <>
            <div className="grid min-w-0 gap-4 rounded-lg border border-stone-200 bg-white/70 p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900/70 md:grid-cols-[92px_minmax(0,1fr)]">
              <div className="flex items-start gap-3 md:block">
                <div
                  className="aspect-[2/3] w-20 shrink-0 rounded-md border border-stone-200 shadow-sm md:w-full dark:border-stone-700"
                  style={firstPage ? imageSurfaceStyle(firstPage.imageUrl, firstPage.spreadSide) : undefined}
                />
                <div className="min-w-0 md:mt-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-2 py-1 text-xs text-stone-500 dark:border-stone-700">
                    <Image size={13} />
                    Page {firstPage?.pageNumber ?? activeChapter.startPage}
                  </div>
                </div>
              </div>
              <div className="grid min-w-0 gap-3">
                <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_112px]">
                  <label className="grid min-w-0 gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                  Chapter heading
                  <input
                    value={activeChapter.title}
                    onChange={(event) => updateChapter(activeChapter.id, { title: event.target.value })}
                    className="h-11 w-full min-w-0 rounded-md border border-stone-200 bg-white px-3 text-stone-950 outline-none focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-white"
                  />
                </label>
                  <label className="grid min-w-0 gap-1 text-sm font-medium text-stone-700 dark:text-stone-300">
                  Start page
                  <input
                    type="number"
                    value={activeChapter.startPage}
                    onChange={(event) => updateChapter(activeChapter.id, { startPage: Number(event.target.value) })}
                    className="h-11 w-full min-w-0 rounded-md border border-stone-200 bg-white px-3 text-stone-950 outline-none focus:border-stone-500 dark:border-stone-700 dark:bg-stone-950 dark:text-white"
                  />
                </label>
                </div>
                <p className="flex items-start gap-2 rounded-md bg-stone-100/70 px-3 py-2 text-sm leading-6 text-stone-600 dark:bg-stone-950/60 dark:text-stone-300">
                  <Info size={16} className="mt-1 shrink-0" />
                  <span>Compare the page image with extracted text, then apply headings, paragraphs, bold, italic, block quotes, and notes below.</span>
                </p>
              </div>
            </div>
            <RichTextEditor html={activeChapter.contentHtml} onChange={(contentHtml) => updateChapter(activeChapter.id, { contentHtml })} />
          </>
        ) : (
          <p>No OCR chapters yet.</p>
        )}
      </section>
    </div>
  )
}
