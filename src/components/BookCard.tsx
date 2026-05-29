import { BookOpen, Clock3, FileText, ListOrdered, ScanLine } from 'lucide-react'
import type { Book } from '../types/book'
import { imageSurfaceStyle, isImageSource } from '../utils/media'

interface Props {
  book: Book
  variant?: 'card' | 'list'
  onOpen: (book: Book) => void
}

export function BookCard({ book, variant = 'card', onOpen }: Props) {
  const progressLabel = book.lastReadPosition
    ? `Resume ${Math.round(book.lastReadPosition.scrollRatio * 100)}%`
    : book.readingStatus
  const notes = hasNotes(book)
  const scans = book.sourcePages.length
  const lastDate = book.lastReadPosition?.updatedAt ?? book.dateAdded
  const lastDateLabel = book.lastReadPosition ? 'Last opened' : 'Added'

  if (variant === 'list') {
    return (
      <button
        type="button"
        onClick={() => onOpen(book)}
        className="group grid w-full grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-stone-900/8 px-3 py-3 text-left transition last:border-b-0 hover:bg-[#f7eddd] dark:border-[#2d251f] dark:hover:bg-[#211a14]"
      >
        <FileText size={17} className="text-stone-400 transition group-hover:text-stone-700 dark:text-stone-500 dark:group-hover:text-stone-200" />
        <span className="min-w-0">
          <span className="block truncate font-serif text-[15px] font-semibold leading-tight text-stone-950 dark:text-[#f5efe5]">{book.title}</span>
          <span className="mt-0.5 block truncate font-sans text-xs leading-tight text-stone-500 dark:text-stone-400">{book.author}</span>
        </span>
        <span className="hidden items-center gap-3 text-xs text-stone-500 dark:text-stone-500 sm:inline-flex">
          <span>{book.bookType}</span>
          {notes ? <ListOrdered size={14} aria-label="Has notes" /> : null}
          {scans ? <ScanLine size={14} aria-label="Has scans" /> : null}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(book)}
      className="group grid w-full grid-cols-[5.5rem_minmax(0,1fr)] gap-4 rounded-xl bg-[#fffaf1]/70 p-3 text-left shadow-[0_18px_55px_rgba(69,52,35,0.08)] ring-1 ring-stone-900/7 transition hover:-translate-y-0.5 hover:bg-white dark:bg-[#17130f]/78 dark:shadow-none dark:ring-[#342a22] dark:hover:bg-[#211a14] sm:grid-cols-[7rem_minmax(0,1fr)]"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-md shadow-[0_12px_28px_rgba(69,52,35,0.22)]"
        style={imageSurfaceStyle(book.coverImage)}
        aria-hidden="true"
      >
        {isImageSource(book.coverImage) ? <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/10" /> : null}
        {!isImageSource(book.coverImage) ? (
          <>
            <div className="absolute inset-x-3 top-4 h-px bg-white/45" />
            <div className="absolute inset-x-4 bottom-5">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">{book.bookType}</div>
              <div className="mt-1 font-serif text-sm font-semibold leading-tight text-white drop-shadow-sm">{book.title}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="min-w-0 py-1">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-stone-500 dark:text-stone-500">
          <span>{book.bookType}</span>
          {book.publicationYear ? <span>{book.publicationYear}</span> : null}
          <span className="inline-flex items-center gap-1">
            <Clock3 size={13} />
            {lastDateLabel} {new Date(lastDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <h3 className="mt-2 line-clamp-2 font-serif text-xl font-semibold leading-tight text-stone-950 dark:text-[#f5efe5]">
          {book.title}
        </h3>
        {book.subtitle ? <p className="mt-1 line-clamp-1 text-sm text-stone-600 dark:text-stone-400">{book.subtitle}</p> : null}
        <p className="mt-2 font-sans text-sm text-stone-800 dark:text-stone-300">{book.author}</p>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-stone-600 dark:text-stone-400">{book.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {book.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-stone-900/5 px-2 py-1 text-[12px] text-stone-600 ring-1 ring-stone-900/8 dark:bg-white/4 dark:text-stone-300 dark:ring-white/8"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-stone-700 dark:text-stone-300">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={14} />
            {progressLabel}
          </span>
          {notes ? (
            <span className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
              <ListOrdered size={14} />
              Notes
            </span>
          ) : null}
          {scans ? (
            <span className="inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
              <ScanLine size={14} />
              {scans} scans
            </span>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function hasNotes(book: Book) {
  const content = book.richTextContent || book.chapters.map((chapter) => chapter.contentHtml).join('\n')
  return /footnote|endnote|fnref-|fn-\d+|page-footnotes/.test(content)
}
