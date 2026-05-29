import { ArrowLeft, BookMarked, ChevronLeft, ChevronRight, Minus, Plus, SlidersHorizontal } from 'lucide-react'
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
  onOpenControls: () => void
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
  onOpenControls,
}: Props) {
  const activeChapter = chapters.find((chapter) => chapter.id === activeChapterId)

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
              onChange={(event) => onChapterChange(event.target.value)}
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
          <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
        </div>
        <div className="hidden sm:block">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
        <button
          type="button"
          onClick={onOpenControls}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300/70 bg-white/65 text-stone-800 shadow-sm backdrop-blur transition hover:bg-white dark:border-stone-700 dark:bg-stone-900/65 dark:text-stone-100 sm:hidden"
          aria-label="Open reading controls"
          title="Open reading controls"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>
    </header>
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
