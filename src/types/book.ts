export type ReadingStatus = 'Unread' | 'Reading' | 'Finished' | 'Reference'

export type OcrStatus = 'not_started' | 'capturing' | 'reviewing' | 'processing' | 'correcting' | 'complete'

export type CleanupStatus = 'pending' | 'accepted' | 'retake'

export type PageRole = 'text' | 'cover' | 'illustration'

export type CaptureMode = 'single' | 'spread'

export type SpreadSide = 'left' | 'right'

export interface BookImageAsset {
  id: string
  sourcePageId: string
  pageNumber: number
  role: Exclude<PageRole, 'text'>
  imageUrl: string
  spreadSide?: SpreadSide
  caption?: string
  includeInReader: boolean
}

export interface SourcePage {
  id: string
  pageNumber: number
  imageUrl: string
  captureMode: CaptureMode
  spreadId?: string
  spreadSide?: SpreadSide
  pageRole: PageRole
  preserveImage: boolean
  note?: string
  skipped?: boolean
  cleanupStatus: CleanupStatus
  rotation: number
  brightness: number
  contrast: number
}

export interface OcrPage {
  pageId: string
  pageNumber: number
  html: string
  confidence: number
  status: 'queued' | 'processing' | 'complete' | 'needs_review'
}

export interface Chapter {
  id: string
  title: string
  startPage: number
  contentHtml: string
}

export interface LastReadPosition {
  chapterId: string
  scrollRatio: number
  pageIndex: number
  updatedAt: string
}

export interface Book {
  id: string
  title: string
  subtitle?: string
  author: string
  publicationYear?: number
  bookType: string
  tags: string[]
  description: string
  coverImage: string
  dateAdded: string
  readingStatus: ReadingStatus
  lastReadPosition?: LastReadPosition
  sourcePages: SourcePage[]
  preservedImages?: BookImageAsset[]
  ocrStatus: OcrStatus
  chapters: Chapter[]
  richTextContent: string
}

export interface ImportDraft {
  id: string
  metadata: Omit<
    Book,
    'id' | 'dateAdded' | 'readingStatus' | 'lastReadPosition' | 'sourcePages' | 'ocrStatus' | 'chapters' | 'richTextContent'
  >
  sourcePages: SourcePage[]
  ocrPages: OcrPage[]
  chapters: Chapter[]
  ocrStatus: OcrStatus
}

export type SortKey = 'recent' | 'title' | 'author' | 'publicationYear' | 'bookType'
