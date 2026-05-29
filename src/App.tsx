import { useEffect, useState } from 'react'
import { ImportWizard } from './components/ImportWizard'
import { LibraryView } from './components/LibraryView'
import { ReaderView } from './components/ReaderView'
import { getBooks, saveBook } from './services/storage'
import type { Book } from './types/book'
import type { LibraryFilters } from './utils/bookFilters'
import { getFilterOptions } from './utils/bookFilters'

type Screen = 'library' | 'reader' | 'import'

const initialFilters: LibraryFilters = {
  search: '',
  author: '',
  bookType: '',
  tag: '',
  readingStatus: 'All',
  sort: 'recent',
}

function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>('library')
  const [filters, setFilters] = useState(initialFilters)
  const [libraryViewMode, setLibraryViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('library-view') as 'grid' | 'list') || 'grid')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('reader-theme') as 'light' | 'dark') || 'light')

  useEffect(() => {
    getBooks().then(setBooks)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('reader-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('library-view', libraryViewMode)
  }, [libraryViewMode])

  const selectedBook = books.find((book) => book.id === selectedBookId)

  const persistBook = async (book: Book) => {
    const saved = await saveBook(book)
    setBooks((current) => current.map((item) => (item.id === saved.id ? saved : item)))
  }

  const saveImportedBook = async (book: Book) => {
    await saveBook(book)
    setBooks((current) => [book, ...current.filter((item) => item.id !== book.id)])
    setSelectedBookId(book.id)
    setScreen('reader')
  }

  if (screen === 'import') {
    return (
      <div className={theme === 'dark' ? 'min-h-screen bg-stone-950 text-stone-100' : 'min-h-screen bg-[#f7f1e7] text-stone-900'}>
        <ImportWizard metadataOptions={getFilterOptions(books)} onCancel={() => setScreen('library')} onSave={saveImportedBook} />
      </div>
    )
  }

  if (screen === 'reader' && selectedBook) {
    return (
      <ReaderView
        book={selectedBook}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onBack={() => setScreen('library')}
        onUpdateBook={persistBook}
      />
    )
  }

  return (
    <div
      className={
        theme === 'dark'
          ? 'min-h-screen bg-stone-950 text-stone-100 transition-colors'
          : 'min-h-screen bg-[#f7f1e7] text-stone-900 transition-colors'
      }
    >
      <LibraryView
        books={books}
        viewMode={libraryViewMode}
        theme={theme}
        filters={filters}
        onFiltersChange={setFilters}
        onViewModeChange={setLibraryViewMode}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenBook={(book) => {
          setSelectedBookId(book.id)
          setScreen('reader')
        }}
        onImport={() => setScreen('import')}
      />
    </div>
  )
}

export default App
