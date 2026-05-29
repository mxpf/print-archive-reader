import { sampleBooks } from '../data/sampleBooks'
import type { Book } from '../types/book'

const DB_NAME = 'print-archive-reader'
const DB_VERSION = 1
const STORE = 'books'
const SEEDED_KEY = 'print-archive-reader:seeded'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = run(transaction.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function seedBooksIfNeeded() {
  if (localStorage.getItem(SEEDED_KEY)) return
  await Promise.all(sampleBooks.map((book) => saveBook(book)))
  localStorage.setItem(SEEDED_KEY, 'true')
}

export async function getBooks(): Promise<Book[]> {
  await seedBooksIfNeeded()
  return withStore<Book[]>('readonly', (store) => store.getAll() as IDBRequest<Book[]>)
}

export async function saveBook(book: Book): Promise<Book> {
  await withStore<IDBValidKey>('readwrite', (store) => store.put(book))
  return book
}

export async function getBook(id: string): Promise<Book | undefined> {
  await seedBooksIfNeeded()
  return withStore<Book | undefined>('readonly', (store) => store.get(id) as IDBRequest<Book | undefined>)
}
