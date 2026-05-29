import { Check, ChevronLeft, ChevronRight, Home, Minus, Plus, Share2, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode, TouchEvent } from 'react'
import { ReaderToolbar } from './ReaderToolbar'
import { ThemeToggle } from './ThemeToggle'
import { ViewModeToggle } from './ViewModeToggle'
import type { Book, Chapter, SourcePage } from '../types/book'
import { imageSurfaceStyle } from '../utils/media'

interface Props {
  book: Book
  sharedHighlight?: { chapterId?: string; text: string } | null
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onBack: () => void
  onUpdateBook: (book: Book) => void
}

export function ReaderView({ book, sharedHighlight, theme, onThemeToggle, onBack, onUpdateBook }: Props) {
  const initialChapter = sharedHighlight?.chapterId ?? book.lastReadPosition?.chapterId ?? book.chapters[0]?.id
  const [activeChapterId, setActiveChapterId] = useState(initialChapter)
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('scroll')
  const [fontSize, setFontSize] = useState(19)
  const [justified, setJustified] = useState(false)
  const [pageIndex, setPageIndex] = useState(book.lastReadPosition?.pageIndex ?? 0)
  const [scrollRatio, setScrollRatio] = useState(book.lastReadPosition?.scrollRatio ?? 0)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [selectedPassage, setSelectedPassage] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')
  const [measuredPages, setMeasuredPages] = useState<string[]>([])
  const [pageMeasureKey, setPageMeasureKey] = useState(0)
  const restoreKeyRef = useRef('')
  const scrollTimerRef = useRef<number | null>(null)
  const swipeStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const scrollArticleRef = useRef<HTMLElement | null>(null)
  const pageArticleRef = useRef<HTMLElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)

  const activeChapter = book.chapters.find((chapter) => chapter.id === activeChapterId) ?? book.chapters[0]
  const normalizedContent = useMemo(() => normalizeFootnoteTargets(activeChapter?.contentHtml ?? ''), [activeChapter?.contentHtml])
  const highlightedContent = useMemo(
    () => highlightQuoteInHtml(normalizedContent, sharedHighlight?.text),
    [normalizedContent, sharedHighlight?.text],
  )
  const fallbackPages = useMemo(() => splitIntoReaderPages(highlightedContent), [highlightedContent])
  const contentBlocks = useMemo(() => htmlToReaderBlocks(highlightedContent), [highlightedContent])
  const pages = viewMode === 'page' && measuredPages.length > 0 ? measuredPages : fallbackPages
  const progress = viewMode === 'scroll' ? Math.round(scrollRatio * 100) : pages.length > 0 ? Math.round(((pageIndex + 1) / pages.length) * 100) : 0

  const persist = useCallback((chapterId: string, nextPageIndex: number, nextScrollRatio = scrollRatio) => {
    onUpdateBook({
      ...book,
      readingStatus: book.readingStatus === 'Unread' ? 'Reading' : book.readingStatus,
      lastReadPosition: {
        chapterId,
        pageIndex: nextPageIndex,
        scrollRatio: viewMode === 'scroll' ? nextScrollRatio : nextPageIndex / Math.max(1, pages.length - 1),
        updatedAt: new Date().toISOString(),
      },
    })
  }, [book, onUpdateBook, pages.length, scrollRatio, viewMode])

  const changeChapter = (chapterId: string) => {
    setActiveChapterId(chapterId)
    setPageIndex(0)
    setScrollRatio(0)
    window.scrollTo({ top: 0 })
    persist(chapterId, 0, 0)
  }

  const setPage = (next: number) => {
    const safeNext = Math.min(Math.max(next, 0), pages.length - 1)
    setPageIndex(safeNext)
    persist(activeChapterId, safeNext)
  }

  const changeViewMode = (mode: 'scroll' | 'page') => {
    setViewMode(mode)
    setPageIndex(0)
    setScrollRatio(0)
    setControlsOpen(false)
  }

  const handleReaderSelection = () => {
    window.setTimeout(() => {
      const selection = window.getSelection()
      const text = selection?.toString().replace(/\s+/g, ' ').trim() ?? ''
      if (!selection?.rangeCount || text.length < 6) {
        setSelectedPassage(null)
        setShareStatus('idle')
        return
      }

      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      const element = container.nodeType === Node.ELEMENT_NODE ? (container as Element) : container.parentElement
      if (!element?.closest('.reader-content')) return

      setSelectedPassage(text.slice(0, 900))
      setShareStatus('idle')
    }, 0)
  }

  const shareSelectedPassage = async () => {
    if (!selectedPassage) return
    const url = makeHighlightUrl(book.id, activeChapterId, selectedPassage)
    const text = `${book.title}, ${book.author}\n\n"${selectedPassage}"\n\n${url}`

    if (navigator.share) {
      try {
        await navigator.share({ title: book.title, text: `"${selectedPassage}"`, url })
        setShareStatus('copied')
        return
      } catch {
        // Fall back to clipboard when the native share sheet is dismissed or unavailable.
      }
    }

    await navigator.clipboard.writeText(text)
    setShareStatus('copied')
  }

  const handlePageTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (viewMode !== 'page' || controlsOpen) return
    const touch = event.changedTouches[0]
    swipeStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
  }

  const handlePageTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start || viewMode !== 'page' || controlsOpen) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const elapsed = Date.now() - start.time
    const horizontalDistance = Math.abs(deltaX)
    const verticalDistance = Math.abs(deltaY)

    if (elapsed > 900 || horizontalDistance < 56 || horizontalDistance < verticalDistance * 1.25) return
    setPage(deltaX < 0 ? pageIndex + 1 : pageIndex - 1)
  }

  useEffect(() => {
    if (viewMode !== 'scroll') return
    const restoreKey = `${book.id}:${activeChapterId}:scroll`
    if (restoreKeyRef.current === restoreKey) return
    restoreKeyRef.current = restoreKey
    const ratio = book.lastReadPosition?.chapterId === activeChapterId ? book.lastReadPosition.scrollRatio : 0
    window.requestAnimationFrame(() => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo({ top: maxScroll * ratio })
      setScrollRatio(ratio)
    })
  }, [activeChapterId, book.id, book.lastReadPosition?.chapterId, book.lastReadPosition?.scrollRatio, viewMode])

  useEffect(() => {
    if (!sharedHighlight?.text) return
    const frame = window.requestAnimationFrame(() => {
      if (sharedHighlight.chapterId && book.chapters.some((chapter) => chapter.id === sharedHighlight.chapterId)) {
        setActiveChapterId(sharedHighlight.chapterId)
      }
      setViewMode('scroll')
      setPageIndex(0)
      setScrollRatio(0)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [book.chapters, sharedHighlight?.chapterId, sharedHighlight?.text])

  useEffect(() => {
    if (!sharedHighlight?.text || viewMode !== 'scroll') return
    const frame = window.requestAnimationFrame(() => {
      document.querySelector('[data-shared-highlight="true"]')?.scrollIntoView({ block: 'center' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [highlightedContent, sharedHighlight?.text, viewMode])

  useEffect(() => {
    if (viewMode !== 'scroll') return
    const handleScroll = () => {
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = window.setTimeout(() => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
        const nextRatio = Math.min(1, Math.max(0, window.scrollY / maxScroll))
        setScrollRatio(nextRatio)
        persist(activeChapterId, pageIndex, nextRatio)
      }, 250)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current)
    }
  }, [activeChapterId, pageIndex, persist, viewMode])

  useEffect(() => {
    if (viewMode !== 'page' || !pageArticleRef.current) return
    const observer = new ResizeObserver(() => {
      setPageMeasureKey((key) => key + 1)
    })
    observer.observe(pageArticleRef.current)
    return () => observer.disconnect()
  }, [viewMode])

  useLayoutEffect(() => {
    if (viewMode !== 'page') return

    const pageElement = pageArticleRef.current
    const measureElement = measureRef.current
    if (!pageElement || !measureElement || contentBlocks.length === 0) return

    const maxHeight = pageElement.clientHeight
    if (maxHeight <= 0) return

    measureElement.style.width = `${pageElement.clientWidth}px`
    measureElement.style.fontSize = `${fontSize}px`
    measureElement.innerHTML = ''

    const nextPages: string[] = []
    let currentBlocks: string[] = []

    for (const block of contentBlocks) {
      const candidateBlocks = [...currentBlocks, block]
      measureElement.innerHTML = candidateBlocks.join('')
      const fits = measureElement.scrollHeight <= maxHeight

      if (fits || currentBlocks.length === 0) {
        currentBlocks = candidateBlocks
      } else {
        nextPages.push(currentBlocks.join(''))
        currentBlocks = [block]
      }
    }

    if (currentBlocks.length > 0) nextPages.push(currentBlocks.join(''))

    const paginated = nextPages.length > 0 ? nextPages : fallbackPages
    const frame = window.requestAnimationFrame(() => {
      setMeasuredPages(paginated)
      setPageIndex((index) => Math.min(index, Math.max(0, paginated.length - 1)))
    })

    return () => window.cancelAnimationFrame(frame)
  }, [contentBlocks, fallbackPages, fontSize, justified, pageMeasureKey, viewMode])

  useEffect(() => {
    if (!controlsOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [controlsOpen])

  return (
    <main
      className={
        theme === 'dark'
          ? 'min-h-screen bg-stone-950 text-stone-50 [--reader-toolbar-height:0px] sm:[--reader-toolbar-height:69px]'
          : 'min-h-screen bg-[#f7f1e7] text-stone-950 [--reader-toolbar-height:0px] sm:[--reader-toolbar-height:69px]'
      }
    >
      <ReaderToolbar
        title={book.title}
        chapters={book.chapters}
        activeChapterId={activeChapterId}
        fontSize={fontSize}
        theme={theme}
        viewMode={viewMode}
        justified={justified}
        canGoPrev={pageIndex > 0}
        canGoNext={pageIndex < pages.length - 1}
        onBack={onBack}
        onChapterChange={changeChapter}
        onFontSizeChange={setFontSize}
        onThemeToggle={onThemeToggle}
        onViewModeChange={changeViewMode}
        onJustifiedChange={setJustified}
        onPrevPage={() => setPage(pageIndex - 1)}
        onNextPage={() => setPage(pageIndex + 1)}
      />

      <div className="fixed inset-x-0 top-[var(--reader-toolbar-height)] z-10 h-1 bg-stone-200 dark:bg-stone-800">
        <div className="h-full bg-stone-900 transition-all dark:bg-stone-200" style={{ width: `${progress}%` }} />
      </div>

      <MobileFloatingReaderButtons
        onBack={onBack}
        onOpenControls={() => setControlsOpen(true)}
      />

      <MobileReaderControls
        open={controlsOpen}
        chapters={book.chapters}
        activeChapterId={activeChapterId}
        fontSize={fontSize}
        justified={justified}
        theme={theme}
        viewMode={viewMode}
        canGoPrev={pageIndex > 0}
        canGoNext={pageIndex < pages.length - 1}
        onClose={() => setControlsOpen(false)}
        onChapterChange={(chapterId) => {
          changeChapter(chapterId)
          setControlsOpen(false)
        }}
        onFontSizeChange={setFontSize}
        onJustifiedChange={setJustified}
        onThemeToggle={onThemeToggle}
        onViewModeChange={changeViewMode}
        onPrevPage={() => setPage(pageIndex - 1)}
        onNextPage={() => setPage(pageIndex + 1)}
      />

      <PassageShareBar
        passage={selectedPassage}
        status={shareStatus}
        onShare={shareSelectedPassage}
        onClear={() => {
          window.getSelection()?.removeAllRanges()
          setSelectedPassage(null)
          setShareStatus('idle')
        }}
      />

      {viewMode === 'scroll' ? (
        <>
          <article
            ref={scrollArticleRef}
            className="reader-content mx-auto max-w-[72ch] px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-10 leading-[1.78] text-stone-900 dark:text-stone-100 sm:px-8 sm:pb-10"
            style={{ fontSize, textAlign: justified ? 'justify' : 'left' }}
            onBlur={() => persist(activeChapterId, pageIndex, scrollRatio)}
            onMouseUp={handleReaderSelection}
            onTouchEnd={handleReaderSelection}
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
          />
          <SourceReferencePanel pages={book.sourcePages} />
        </>
      ) : (
        <>
          <section
            className="mx-auto grid h-[calc(100svh-var(--reader-toolbar-height)-4px)] max-w-5xl grid-rows-[minmax(0,1fr)_auto] px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-4 [touch-action:pan-y] sm:px-8 sm:pb-5 sm:pt-5"
            onTouchStart={handlePageTouchStart}
            onTouchEnd={handlePageTouchEnd}
            onTouchCancel={() => {
              swipeStartRef.current = null
            }}
          >
            <article
              ref={pageArticleRef}
              className="reader-content min-h-0 overflow-hidden rounded-lg border border-stone-200 bg-[#fffaf1] px-6 py-7 leading-[1.72] shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:px-10 sm:py-9"
              style={{ fontSize, textAlign: justified ? 'justify' : 'left' }}
              onMouseUp={handleReaderSelection}
              dangerouslySetInnerHTML={{ __html: pages[pageIndex] ?? '' }}
            />
            <div
              ref={measureRef}
              aria-hidden="true"
              className="reader-content pointer-events-none fixed -left-[9999px] top-0 invisible rounded-lg border border-transparent px-6 py-7 leading-[1.72] sm:px-10 sm:py-9"
              style={{ textAlign: justified ? 'justify' : 'left' }}
            />
            <nav className="mt-4 hidden grid-cols-[1fr_auto_1fr] items-center gap-2 sm:grid">
              <button
                type="button"
                onClick={() => setPage(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-medium disabled:opacity-35 dark:border-stone-700 sm:h-12"
              >
                <ChevronLeft size={18} />
                Previous
              </button>
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {pageIndex + 1} / {pages.length}
              </span>
              <button
                type="button"
                onClick={() => setPage(pageIndex + 1)}
                disabled={pageIndex === pages.length - 1}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-medium disabled:opacity-35 dark:border-stone-700 sm:h-12"
              >
                Next
                <ChevronRight size={18} />
              </button>
            </nav>
          </section>
          <div className="hidden sm:block">
            <SourceReferencePanel pages={book.sourcePages} />
          </div>
        </>
      )}
    </main>
  )
}

function MobileFloatingReaderButtons({
  onBack,
  onOpenControls,
}: {
  onBack: () => void
  onOpenControls: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between px-4 sm:hidden">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-stone-300/70 bg-[#fbf5ea]/88 text-stone-900 shadow-lg backdrop-blur-md transition hover:bg-[#fbf5ea] dark:border-stone-700 dark:bg-stone-900/88 dark:text-stone-100"
        aria-label="Back to library"
        title="Back to library"
      >
        <Home size={23} />
      </button>
      <button
        type="button"
        onClick={onOpenControls}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-stone-300/70 bg-[#fbf5ea]/88 text-stone-900 shadow-lg backdrop-blur-md transition hover:bg-[#fbf5ea] dark:border-stone-700 dark:bg-stone-900/88 dark:text-stone-100"
        aria-label="Open reading controls"
        title="Open reading controls"
      >
        <SlidersHorizontal size={23} />
      </button>
    </div>
  )
}

function PassageShareBar({
  passage,
  status,
  onShare,
  onClear,
}: {
  passage: string | null
  status: 'idle' | 'copied'
  onShare: () => void
  onClear: () => void
}) {
  if (!passage) return null

  return (
    <div className="fixed inset-x-4 bottom-[calc(5.4rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-xl rounded-2xl bg-[#fbf5ea]/95 p-3 shadow-2xl ring-1 ring-stone-900/10 backdrop-blur dark:bg-[#14100d]/95 dark:ring-stone-700 sm:bottom-5">
      <p className="line-clamp-2 text-sm leading-5 text-stone-700 dark:text-stone-300">"{passage}"</p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-9 items-center rounded-full px-3 text-sm font-semibold text-stone-500 hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-stone-900 px-3 text-sm font-semibold text-[#fff8ea] dark:bg-stone-100 dark:text-stone-950"
        >
          {status === 'copied' ? <Check size={16} /> : <Share2 size={16} />}
          {status === 'copied' ? 'Copied' : 'Share passage'}
        </button>
      </div>
    </div>
  )
}

function MobileReaderControls({
  open,
  chapters,
  activeChapterId,
  fontSize,
  justified,
  theme,
  viewMode,
  canGoPrev,
  canGoNext,
  onClose,
  onChapterChange,
  onFontSizeChange,
  onJustifiedChange,
  onThemeToggle,
  onViewModeChange,
  onPrevPage,
  onNextPage,
}: {
  open: boolean
  chapters: Chapter[]
  activeChapterId: string
  fontSize: number
  justified: boolean
  theme: 'light' | 'dark'
  viewMode: 'scroll' | 'page'
  canGoPrev: boolean
  canGoNext: boolean
  onClose: () => void
  onChapterChange: (chapterId: string) => void
  onFontSizeChange: (size: number) => void
  onJustifiedChange: (justified: boolean) => void
  onThemeToggle: () => void
  onViewModeChange: (mode: 'scroll' | 'page') => void
  onPrevPage: () => void
  onNextPage: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] sm:hidden" role="dialog" aria-modal="true" aria-label="Reading controls">
      <button
        type="button"
        className="absolute inset-0 bg-stone-950/45 backdrop-blur-[2px]"
        aria-label="Close reading controls"
        onClick={onClose}
      />
      <section className="absolute inset-x-0 bottom-0 max-h-[82svh] overflow-y-auto rounded-t-3xl border border-stone-200 bg-[#fbf5ea] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 shadow-2xl dark:border-stone-800 dark:bg-[#14100d]">
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-stone-300 dark:bg-stone-700" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Reader</div>
            <h2 className="mt-1 font-serif text-xl font-semibold text-stone-950 dark:text-stone-50">Reading controls</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-700 hover:bg-stone-200/70 dark:text-stone-200 dark:hover:bg-stone-800"
            aria-label="Close reading controls"
            title="Close reading controls"
          >
            <X size={20} />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Chapter</span>
          <select
            value={activeChapterId}
            onChange={(event) => onChapterChange(event.target.value)}
            className="mt-2 h-12 w-full rounded-lg border border-stone-300 bg-white px-3 pr-9 text-sm text-stone-950 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-50"
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
            <ViewModeToggle mode={viewMode} onChange={onViewModeChange} />
          </ControlRow>
          <ControlRow label="Text align">
            <button
              type="button"
              onClick={() => onJustifiedChange(!justified)}
              className={`inline-flex h-10 items-center rounded-full px-3 text-sm font-semibold transition ${
                justified
                  ? 'bg-stone-900 text-[#fff8ea] dark:bg-stone-100 dark:text-stone-950'
                  : 'border border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300'
              }`}
              aria-pressed={justified}
            >
              Justified
            </button>
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

function SourceReferencePanel({ pages }: { pages: SourcePage[] }) {
  if (pages.length === 0) return null

  return (
    <aside className="mx-auto mb-12 mt-4 max-w-5xl px-4 sm:px-8">
      <div className="rounded-xl bg-[#fff8ea]/70 p-4 ring-1 ring-stone-900/8 dark:bg-[#17130f] dark:ring-[#342a22]">
        <div className="flex flex-col gap-1 border-b border-stone-900/10 pb-3 dark:border-[#342a22] sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">Source Reference</div>
            <h2 className="mt-1 font-serif text-xl font-semibold text-stone-950 dark:text-[#f5efe5]">Original scanned pages retained</h2>
          </div>
          <p className="text-sm text-stone-600 dark:text-stone-400">{pages.length} page records</p>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {pages.map((page) => (
            <figure key={page.id} className="w-24 shrink-0">
              <div className="aspect-[2/3] rounded-md bg-stone-100 shadow-sm ring-1 ring-stone-900/10 dark:bg-[#0e0c0a] dark:ring-[#43392f]" style={imageSurfaceStyle(page.imageUrl, page.spreadSide)} />
              <figcaption className="mt-2 text-xs leading-5 text-stone-600 dark:text-stone-400">
                <span className="block font-medium text-stone-800 dark:text-stone-200">Page {page.pageNumber}</span>
                <span className="capitalize">
                  {page.captureMode === 'spread' ? `${page.spreadSide} spread` : page.pageRole}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </aside>
  )
}

function makeHighlightUrl(bookId: string, chapterId: string, quote: string) {
  const params = new URLSearchParams({ chapter: chapterId, quote })
  return `${window.location.origin}${window.location.pathname}#/book/${encodeURIComponent(bookId)}?${params.toString()}`
}

function highlightQuoteInHtml(html: string, quote?: string) {
  const cleanQuote = quote?.replace(/\s+/g, ' ').trim()
  if (!html || !cleanQuote || typeof document === 'undefined') return html

  const template = document.createElement('template')
  template.innerHTML = html
  const textNodes: Array<{ node: Text; start: number; end: number }> = []
  let combinedText = ''

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const textNode = node as Text
    const text = textNode.textContent ?? ''
    textNodes.push({ node: textNode, start: combinedText.length, end: combinedText.length + text.length })
    combinedText += text
    node = walker.nextNode()
  }

  const startIndex = combinedText.indexOf(cleanQuote)
  if (startIndex < 0) return html

  const endIndex = startIndex + cleanQuote.length
  const startPart = textNodes.find((part) => startIndex >= part.start && startIndex <= part.end)
  const endPart = textNodes.find((part) => endIndex >= part.start && endIndex <= part.end)
  if (!startPart || !endPart) return html

  const range = document.createRange()
  range.setStart(startPart.node, startIndex - startPart.start)
  range.setEnd(endPart.node, endIndex - endPart.start)

  const mark = document.createElement('mark')
  mark.className = 'shared-highlight'
  mark.dataset.sharedHighlight = 'true'
  mark.appendChild(range.extractContents())
  range.insertNode(mark)

  return template.innerHTML
}

function normalizeFootnoteTargets(html: string) {
  if (!html || typeof document === 'undefined') return html

  const template = document.createElement('template')
  template.innerHTML = html

  template.content.querySelectorAll('li[id^="fn-"]').forEach((item) => {
    if (item.hasAttribute('value')) return
    const match = item.id.match(/^fn-(\d+)$/)
    if (match) item.setAttribute('value', match[1])
  })

  return template.innerHTML
}

function htmlToReaderBlocks(html: string) {
  if (typeof document === 'undefined') return html ? [html] : []

  const template = document.createElement('template')
  template.innerHTML = html

  return Array.from(template.content.childNodes)
    .map((node) => {
      if (node.nodeType === 3) {
        const text = node.textContent?.trim()
        return text ? `<p>${escapeHtml(text)}</p>` : ''
      }

      if (node instanceof HTMLElement) {
        return node.outerHTML
      }

      return ''
    })
    .filter(Boolean)
}

function splitIntoReaderPages(html: string) {
  const chunks = html.split(/<hr[^>]*>/g).filter(Boolean)
  if (chunks.length > 1) return chunks
  const paragraphs = html.split('</p>').filter(Boolean)
  const pages: string[] = []
  for (let index = 0; index < paragraphs.length; index += 3) {
    pages.push(paragraphs.slice(index, index + 3).map((part) => `${part}</p>`).join(''))
  }
  return pages.length ? pages : [html]
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
