import { useEffect, useState } from 'react'
import { ImportWizard } from './components/ImportWizard'
import { LibraryView } from './components/LibraryView'
import { ReaderView } from './components/ReaderView'
import { getBooks, saveBook } from './services/storage'
import type { Book } from './types/book'
import type { LibraryFilters } from './utils/bookFilters'
import { getFilterOptions } from './utils/bookFilters'

type Screen = 'library' | 'reader' | 'import'

interface AppRoute {
  screen: Screen
  bookId?: string
  chapterId?: string
  quote?: string
}

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
  const [sharedHighlight, setSharedHighlight] = useState<{ chapterId?: string; text: string } | null>(null)
  const [filters, setFilters] = useState(initialFilters)
  const [libraryViewMode, setLibraryViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('library-view') as 'grid' | 'list') || 'grid')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('reader-theme') as 'light' | 'dark') || 'light')

  useEffect(() => {
    getBooks().then(setBooks)
  }, [])

  useEffect(() => {
    const applyRoute = () => {
      const route = parseRoute()
      setScreen(route.screen)
      setSelectedBookId(route.bookId ?? null)
      setSharedHighlight(route.quote ? { chapterId: route.chapterId, text: route.quote } : null)
    }

    applyRoute()
    window.addEventListener('hashchange', applyRoute)
    return () => window.removeEventListener('hashchange', applyRoute)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('reader-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('library-view', libraryViewMode)
  }, [libraryViewMode])

  const selectedBook = books.find((book) => book.id === selectedBookId)

  const navigateLibrary = () => updateRoute({ screen: 'library' })
  const navigateImport = () => updateRoute({ screen: 'import' })
  const navigateBook = (bookId: string) => updateRoute({ screen: 'reader', bookId })

  const persistBook = async (book: Book) => {
    const saved = await saveBook(book)
    setBooks((current) => current.map((item) => (item.id === saved.id ? saved : item)))
  }

  const saveImportedBook = async (book: Book) => {
    await saveBook(book)
    setBooks((current) => [book, ...current.filter((item) => item.id !== book.id)])
    navigateBook(book.id)
  }

  if (screen === 'import') {
    return (
      <div className={theme === 'dark' ? 'min-h-screen bg-stone-950 text-stone-100' : 'min-h-screen bg-[#f7f1e7] text-stone-900'}>
        <ImportWizard metadataOptions={getFilterOptions(books)} onCancel={navigateLibrary} onSave={saveImportedBook} />
      </div>
    )
  }

  if (screen === 'reader' && selectedBook) {
    return (
      <ReaderView
        book={selectedBook}
        sharedHighlight={sharedHighlight}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onBack={navigateLibrary}
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
        onOpenBook={(book) => navigateBook(book.id)}
        onImport={navigateImport}
      />
    </div>
  )
}

function parseRoute(): AppRoute {
  const rawHash = window.location.hash.replace(/^#\/?/, '')
  const [path = '', query = ''] = rawHash.split('?')
  const params = new URLSearchParams(query)
  const parts = path.split('/').filter(Boolean)

  if (parts[0] === 'book' && parts[1]) {
    return {
      screen: 'reader',
      bookId: decodeURIComponent(parts[1]),
      chapterId: params.get('chapter') ?? undefined,
      quote: params.get('quote') ?? undefined,
    }
  }

  if (parts[0] === 'import') return { screen: 'import' }

  return { screen: 'library' }
}

function updateRoute(route: AppRoute) {
  const nextHash =
    route.screen === 'reader' && route.bookId
      ? `#/book/${encodeURIComponent(route.bookId)}${route.chapterId || route.quote ? `?${makeRouteQuery(route)}` : ''}`
      : route.screen === 'import'
        ? '#/import'
        : '#/'

  if (window.location.hash === nextHash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    return
  }

  window.location.hash = nextHash
}

function makeRouteQuery(route: AppRoute) {
  const params = new URLSearchParams()
  if (route.chapterId) params.set('chapter', route.chapterId)
  if (route.quote) params.set('quote', route.quote)
  return params.toString()
}

export default App
