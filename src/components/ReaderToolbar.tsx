import { ArrowLeft, BookMarked, ChevronLeft, ChevronRight, Minus, Plus, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { ViewModeToggle } from './ViewModeToggle'
import type { Chapter } from '../types/book'

interface Props {
  title: string
  chapters: Chapter[]
  activeChapterId: string
  fontSize: number
  theme: 'light' | 'dark'
  viewMode: 'scroll' | 'page'
  canGoPrev: boolean
  canGoNext: boolean
  onBack: () => void
  onChapterChange: (chapterId: string) => void
  onFontSizeChange: (size: number) => void
  onThemeToggle: () => void
  onViewModeChange: (mode: 'scroll' | 'page') => void
  onPrevPage: () => void
  onNextPage: () => void
}

export function ReaderToolbar({
  title,
  chapters,
  activeChapterId,
  fontSize,
  theme,
  viewMode,
  canGoPrev,
  canGoNext,
  onBack,
  onChapterChange,
  onFontSizeChange,
  onThemeToggle,
  onViewModeChange,
  onPrevPage,
  onNextPage,
}: Props) {
  const [controlsOpen, setControlsOpen] = useState(false)
  const activeChapter = chapters.find((chapter) => chapter.id === activeChapterId)
  const changeChapter = (chapterId: string) => {
    onChapterChange(chapterId)
    setControlsOpen(false)
  }
  const changeViewMode = (mode: 'scroll' | 'page') => {
    onViewModeChange(mode)
    setControlsOpen(false)
  }

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/75 bg-[#f7f1e7]/90 px-3 py-2 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90 sm:py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200/70 dark:text-stone-200 dark:hover:bg-stone-800 sm:h-11 sm:w-11"
          aria-label="Back to library"
          title="Back to library"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-stone-950 dark:text-stone-50">{title}</div>
          <label className="mt-1 hidden items-center gap-1 text-xs text-stone-500 dark:text-stone-400 sm:flex">
            <BookMarked size={13} />
            <select
              value={activeChapterId}
              onChange={(event) => changeChapter(event.target.value)}
              className="min-w-0 max-w-full rounded border-0 bg-transparent outline-none"
            >
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.title}
                </option>
              ))}
            </select>
          </label>
          <div className="truncate text-xs text-stone-500 dark:text-stone-400 sm:hidden">{activeChapter?.title}</div>
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-stone-300 bg-white/60 p-1 dark:border-stone-700 dark:bg-stone-900 sm:inline-flex">
          <button
            type="button"
            onClick={() => onFontSizeChange(Math.max(16, fontSize - 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Decrease font size"
            title="Decrease font size"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center text-xs text-stone-500">{fontSize}</span>
          <button
            type="button"
            onClick={() => onFontSizeChange(Math.min(26, fontSize + 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Increase font size"
            title="Increase font size"
          >
            <Plus size={16} />
          </button>
        </div>
        {viewMode === 'page' ? (
          <div className="hidden items-center gap-1 sm:inline-flex">
            <IconButton icon={ChevronLeft} label="Previous page" onClick={onPrevPage} disabled={!canGoPrev} />
            <IconButton icon={ChevronRight} label="Next page" onClick={onNextPage} disabled={!canGoNext} />
          </div>
        ) : null}
        <div className="hidden sm:block">
          <ViewModeToggle mode={viewMode} onChange={changeViewMode} />
        </div>
        <div className="hidden sm:block">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
        <button
          type="button"
          onClick={() => setControlsOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300/70 bg-white/65 text-stone-800 shadow-sm backdrop-blur transition hover:bg-white dark:border-stone-700 dark:bg-stone-900/65 dark:text-stone-100 sm:hidden"
          aria-label="Open reading controls"
          title="Open reading controls"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
      {controlsOpen ? (
        <div className="fixed inset-0 z-40 sm:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/35 backdrop-blur-[2px]"
            aria-label="Close reading controls"
            onClick={() => setControlsOpen(false)}
          />
          <section className="absolute inset-x-0 bottom-0 max-h-[78svh] overflow-y-auto rounded-t-3xl border border-stone-200 bg-[#fbf5ea] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:border-stone-800 dark:bg-[#14100d]">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-stone-300 dark:bg-stone-700" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Reader</div>
                <h2 className="mt-1 font-serif text-xl font-semibold text-stone-950 dark:text-stone-50">Controls</h2>
              </div>
              <button
                type="button"
                onClick={() => setControlsOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-700 hover:bg-stone-200/70 dark:text-stone-200 dark:hover:bg-stone-800"
                aria-label="Close reading controls"
              >
                <X size={20} />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Chapter</span>
              <select
                value={activeChapterId}
                onChange={(event) => changeChapter(event.target.value)}
                className="mt-2 h-12 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm text-stone-950 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
              >
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 grid gap-4">
              <ControlRow label="Text size">
                <div className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 p-1 dark:border-stone-700 dark:bg-stone-950">
                  <button
                    type="button"
                    onClick={() => onFontSizeChange(Math.max(16, fontSize - 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
                    aria-label="Decrease font size"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center text-sm text-stone-500">{fontSize}</span>
                  <button
                    type="button"
                    onClick={() => onFontSizeChange(Math.min(26, fontSize + 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
                    aria-label="Increase font size"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </ControlRow>
              <ControlRow label="Reading mode">
                <ViewModeToggle mode={viewMode} onChange={changeViewMode} />
              </ControlRow>
              <ControlRow label="Theme">
                <ThemeToggle theme={theme} onToggle={onThemeToggle} />
              </ControlRow>
              {viewMode === 'page' ? (
                <ControlRow label="Pages">
                  <div className="grid w-full grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onPrevPage}
                      disabled={!canGoPrev}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-300 px-3 text-sm font-medium disabled:opacity-35 dark:border-stone-700"
                    >
                      <ChevronLeft size={17} />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={onNextPage}
                      disabled={!canGoNext}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-300 px-3 text-sm font-medium disabled:opacity-35 dark:border-stone-700"
                    >
                      Next
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </ControlRow>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </header>
  )
}

function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-stone-900/10 pt-4 dark:border-stone-700/70">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</span>
      {children}
    </div>
  )
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof ChevronLeft
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-35 dark:text-stone-200 dark:hover:bg-stone-800"
      aria-label={label}
      title={label}
    >
      <Icon size={18} />
    </button>
  )
}
