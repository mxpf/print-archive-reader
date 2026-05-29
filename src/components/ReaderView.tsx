import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReaderToolbar } from './ReaderToolbar'
import type { Book, SourcePage } from '../types/book'
import { imageSurfaceStyle } from '../utils/media'

interface Props {
  book: Book
  theme: 'light' | 'dark'
  onThemeToggle: () => void
  onBack: () => void
  onUpdateBook: (book: Book) => void
}

export function ReaderView({ book, theme, onThemeToggle, onBack, onUpdateBook }: Props) {
  const initialChapter = book.lastReadPosition?.chapterId ?? book.chapters[0]?.id
  const [activeChapterId, setActiveChapterId] = useState(initialChapter)
  const [viewMode, setViewMode] = useState<'scroll' | 'page'>('scroll')
  const [fontSize, setFontSize] = useState(19)
  const [pageIndex, setPageIndex] = useState(book.lastReadPosition?.pageIndex ?? 0)
  const [scrollRatio, setScrollRatio] = useState(book.lastReadPosition?.scrollRatio ?? 0)
  const restoreKeyRef = useRef('')
  const scrollTimerRef = useRef<number | null>(null)

  const activeChapter = book.chapters.find((chapter) => chapter.id === activeChapterId) ?? book.chapters[0]
  const pages = useMemo(() => splitIntoReaderPages(activeChapter?.contentHtml ?? ''), [activeChapter?.contentHtml])
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

  return (
    <main
      className={
        theme === 'dark'
          ? 'min-h-screen bg-stone-950 text-stone-50'
          : 'min-h-screen bg-[#f7f1e7] text-stone-950'
      }
    >
      <ReaderToolbar
        title={book.title}
        chapters={book.chapters}
        activeChapterId={activeChapterId}
        fontSize={fontSize}
        theme={theme}
        viewMode={viewMode}
        canGoPrev={pageIndex > 0}
        canGoNext={pageIndex < pages.length - 1}
        onBack={onBack}
        onChapterChange={changeChapter}
        onFontSizeChange={setFontSize}
        onThemeToggle={onThemeToggle}
        onViewModeChange={(mode) => {
          setViewMode(mode)
          setPageIndex(0)
          setScrollRatio(0)
        }}
        onPrevPage={() => setPage(pageIndex - 1)}
        onNextPage={() => setPage(pageIndex + 1)}
      />

      <div className="fixed inset-x-0 top-[69px] z-10 h-1 bg-stone-200 dark:bg-stone-800">
        <div className="h-full bg-stone-900 transition-all dark:bg-stone-200" style={{ width: `${progress}%` }} />
      </div>

      {viewMode === 'scroll' ? (
        <>
          <article
            className="reader-content mx-auto max-w-[72ch] px-5 py-10 leading-[1.78] text-stone-900 dark:text-stone-100 sm:px-8"
            style={{ fontSize }}
            onBlur={() => persist(activeChapterId, pageIndex, scrollRatio)}
            dangerouslySetInnerHTML={{ __html: activeChapter?.contentHtml ?? '' }}
          />
          <SourceReferencePanel pages={book.sourcePages} />
        </>
      ) : (
        <section className="mx-auto flex min-h-[calc(100vh-74px)] max-w-5xl flex-col px-4 py-6 sm:px-8">
          <article
            className="reader-content flex-1 rounded-lg border border-stone-200 bg-[#fffaf1] px-6 py-8 leading-[1.75] shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:px-10"
            style={{ fontSize }}
            dangerouslySetInnerHTML={{ __html: pages[pageIndex] ?? '' }}
          />
          <nav className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-medium disabled:opacity-35 dark:border-stone-700"
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
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-medium disabled:opacity-35 dark:border-stone-700"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </nav>
          <SourceReferencePanel pages={book.sourcePages} />
        </section>
      )}
    </main>
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
