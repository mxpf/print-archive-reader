import { ArrowLeft, BookOpen, Calendar, Tags } from 'lucide-react'
import type { Book } from '../types/book'
import { imageSurfaceStyle } from '../utils/media'

interface Props {
  book: Book
  onBack: () => void
  onRead: () => void
}

export function BookDetail({ book, onBack, onRead }: Props) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-5 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 px-4 text-sm font-medium text-stone-700 dark:border-stone-700 dark:text-stone-200"
      >
        <ArrowLeft size={17} />
        Library
      </button>
      <section className="grid gap-6 md:grid-cols-[230px_1fr]">
        <div className="mx-auto aspect-[2/3] w-48 rounded-md shadow-xl md:w-full" style={imageSurfaceStyle(book.coverImage)} />
        <div>
          <div className="flex flex-wrap gap-2 text-sm text-stone-500 dark:text-stone-400">
            <span className="inline-flex items-center gap-1">
              <BookOpen size={15} />
              {book.bookType}
            </span>
            {book.publicationYear ? (
              <span className="inline-flex items-center gap-1">
                <Calendar size={15} />
                {book.publicationYear}
              </span>
            ) : null}
          </div>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-stone-950 dark:text-white sm:text-5xl">{book.title}</h1>
          {book.subtitle ? <p className="mt-2 text-xl text-stone-600 dark:text-stone-300">{book.subtitle}</p> : null}
          <p className="mt-4 font-sans text-lg text-stone-800 dark:text-stone-200">{book.author}</p>
          <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600 dark:text-stone-300">{book.description}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Tags size={16} className="text-stone-500" />
            {book.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-stone-300 px-3 py-1 text-sm dark:border-stone-700">
                {tag}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onRead}
            className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-stone-950 px-6 py-4 text-sm font-semibold text-white shadow-sm dark:bg-stone-100 dark:text-stone-950"
          >
            <BookOpen size={18} />
            {book.lastReadPosition ? 'Continue reading' : 'Start reading'}
          </button>
        </div>
      </section>
    </main>
  )
}
