export interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string
}

export interface BookMetadata {
  title: string
  author?: string
  language?: string
  cover?: string
}

export interface Annotation {
  id: string
  bookId: string
  chapterId: string
  type: 'highlight' | 'note'
  color?: string
  content?: string
  startOffset: number
  endOffset: number
  selectedText: string
  createdAt: string
}

export interface ReadingProgress {
  bookId: string
  chapterId: string
  scrollPosition: number
  lastRead: string
}

export interface TocEntry {
  level: number
  title: string
  anchor: string
  children: TocEntry[]
}

export interface TocJson {
  title: string
  author?: string
  language?: string
  chapters: Array<{
    file: string
    title: string
  }>
}
