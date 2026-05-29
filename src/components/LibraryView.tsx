import { Archive, BookOpen, LayoutGrid, List, Plus } from 'lucide-react'
import { BookCard } from './BookCard'
import { SearchSortFilterControls } from './SearchSortFilterControls'
import { ThemeToggle } from './ThemeToggle'
import type { Book } from '../types/book'
import type { LibraryFilters } from '../utils/bookFilters'
import { filterAndSortBooks, getFilterOptions } from '../utils/bookFilters'

interface Props {
  books: Book[]
  viewMode: 'grid' | 'list'
  theme: 'light' | 'dark'
  filters: LibraryFilters
  onFiltersChange: (filters: LibraryFilters) => void
  onViewModeChange: (mode: 'grid' | 'list') => void
  onThemeToggle: () => void
  onOpenBook: (book: Book) => void
  onImport: () => void
}

export function LibraryView({
  books,
  viewMode,
  theme,
  filters,
  onFiltersChange,
  onViewModeChange,
  onThemeToggle,
  onOpenBook,
  onImport,
}: Props) {
  const filteredBooks = filterAndSortBooks(books, filters)
  const options = getFilterOptions(books)
  const importedCount = books.filter((book) => book.sourcePages.length > 0).length
  const readingCount = books.filter((book) => book.readingStatus === 'Reading').length

  return (
    <main className="min-h-screen bg-[#f4ecde] text-stone-900 dark:bg-[#100d0a] dark:text-stone-100">
      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:px-8">
        <header className="border-b border-stone-900/10 pb-5 dark:border-[#342a22]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-500">
                <Archive size={15} />
                Personal archive
              </div>
              <h1 className="font-serif text-3xl font-semibold leading-tight text-stone-950 dark:text-[#f5efe5] sm:text-4xl">
                Bibliotheque
              </h1>
              <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">
                {books.length} books · {importedCount} imported · {readingCount} in progress
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-full bg-white/55 p-1 ring-1 ring-stone-900/10 dark:bg-[#19140f] dark:ring-[#3a3028]">
                <ModeButton icon={LayoutGrid} active={viewMode === 'grid'} label="Grid view" onClick={() => onViewModeChange('grid')} />
                <ModeButton icon={List} active={viewMode === 'list'} label="List view" onClick={() => onViewModeChange('list')} />
              </div>
              <ThemeToggle theme={theme} onToggle={onThemeToggle} />
              <button
                type="button"
                onClick={onImport}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2d241b] px-4 text-sm font-semibold text-[#fff8ea] shadow-sm transition hover:bg-[#3f3022] dark:bg-[#eadfce] dark:text-[#15110d] dark:hover:bg-white"
              >
                <Plus size={17} />
                Import Book
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 pt-5 xl:grid-cols-[17rem_minmax(0,1fr)] xl:items-start">
          <aside className="xl:sticky xl:top-5">
            <SearchSortFilterControls filters={filters} options={options} onChange={onFiltersChange} />
            <div className="mt-4 hidden rounded-xl bg-[#eadfce]/55 p-4 text-sm leading-6 text-stone-600 ring-1 ring-stone-900/5 dark:bg-[#17130f] dark:text-stone-400 dark:ring-[#342a22] xl:block">
              <div className="mb-2 inline-flex items-center gap-2 font-semibold text-stone-800 dark:text-stone-200">
                <BookOpen size={16} />
                Archive Notes
              </div>
              <p>Scans are retained with page numbers, image roles, footnote sections, and endnote links for later verification.</p>
            </div>
          </aside>

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">Collection</div>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  {filteredBooks.length} {filteredBooks.length === 1 ? 'volume' : 'volumes'} shown
                </p>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="overflow-hidden rounded-xl bg-[#fffaf1]/65 shadow-[0_18px_60px_rgba(69,52,35,0.08)] ring-1 ring-stone-900/6 dark:bg-[#17130f]/78 dark:shadow-none dark:ring-[#342a22]">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} variant="list" onOpen={onOpenBook} />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredBooks.map((book) => (
                  <BookCard key={book.id} book={book} onOpen={onOpenBook} />
                ))}
              </div>
            )}

            {filteredBooks.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-stone-300/80 p-8 text-center text-stone-600 dark:border-[#43392f] dark:text-stone-300">
                No books match those filters.
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}

function ModeButton({
  icon: Icon,
  active,
  label,
  onClick,
}: {
  icon: typeof LayoutGrid
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
        active
          ? 'bg-[#2d241b] text-[#fff8ea] shadow-sm dark:bg-[#eadfce] dark:text-[#15110d]'
          : 'text-stone-500 hover:bg-white/70 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:text-stone-100'
      }`}
      aria-label={label}
      title={label}
    >
      <Icon size={17} />
    </button>
  )
}
