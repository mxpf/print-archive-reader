import type { Book, ReadingStatus, SortKey } from '../types/book'

export interface LibraryFilters {
  search: string
  author: string
  bookType: string
  tag: string
  readingStatus: ReadingStatus | 'All'
  sort: SortKey
}

export function getFilterOptions(books: Book[]) {
  return {
    authors: Array.from(new Set(books.map((book) => book.author))).sort(),
    bookTypes: Array.from(new Set(books.map((book) => book.bookType))).sort(),
    tags: Array.from(new Set(books.flatMap((book) => book.tags))).sort(),
  }
}

export function filterAndSortBooks(books: Book[], filters: LibraryFilters) {
  const query = filters.search.trim().toLowerCase()

  return [...books]
    .filter((book) => {
      const haystack = [
        book.title,
        book.subtitle,
        book.author,
        book.bookType,
        book.description,
        book.publicationYear?.toString(),
        ...book.tags,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return (
        (!query || haystack.includes(query)) &&
        (!filters.author || book.author === filters.author) &&
        (!filters.bookType || book.bookType === filters.bookType) &&
        (!filters.tag || book.tags.includes(filters.tag)) &&
        (filters.readingStatus === 'All' || book.readingStatus === filters.readingStatus)
      )
    })
    .sort((a, b) => {
      if (filters.sort === 'title') return a.title.localeCompare(b.title)
      if (filters.sort === 'author') return a.author.localeCompare(b.author)
      if (filters.sort === 'publicationYear') return (a.publicationYear ?? 0) - (b.publicationYear ?? 0)
      if (filters.sort === 'bookType') return a.bookType.localeCompare(b.bookType)
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()
    })
}
