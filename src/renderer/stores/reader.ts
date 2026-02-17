import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TocEntry } from '../../shared/types'
import { parseHeadings, stripAnchorSyntax, buildAnchorMap } from '../utils/toc-parser'

export interface Chapter {
  id: string
  title: string
  path: string
  content?: string
}

export interface Book {
  id: string
  title: string
  author?: string
  path: string
  chapters: Chapter[]
  isBabelfish?: boolean
  translationPath?: string
}

interface ReadingProgress {
  bookId: string
  chapterId: string
  scrollPosition: number
  lastRead: string
}

interface ReaderState {
  currentBook: Book | null
  currentChapter: Chapter | null
  chapterContent: string
  chapterToc: TocEntry[]
  anchorMap: Map<string, string>
  activeAnchor: string | null
  translationContent: string | null
  showComparison: boolean
  readingProgress: Record<string, ReadingProgress>

  // Actions
  setCurrentBook: (book: Book | null) => void
  setCurrentChapter: (chapter: Chapter | null) => void
  setChapterContent: (content: string) => void
  setTranslationContent: (content: string | null) => void
  setActiveAnchor: (anchor: string | null) => void
  toggleComparison: () => void
  nextChapter: () => void
  previousChapter: () => void
  saveProgress: (scrollPosition: number) => void
  loadBook: (path: string) => Promise<void>
}

export const useReaderStore = create<ReaderState>()(
  persist(
    (set, get) => ({
      currentBook: null,
      currentChapter: null,
      chapterContent: '',
      chapterToc: [],
      anchorMap: new Map(),
      activeAnchor: null,
      translationContent: null,
      showComparison: false,
      readingProgress: {},

      setCurrentBook: (book) => set({ currentBook: book }),

      setCurrentChapter: async (chapter) => {
        if (!chapter) {
          set({ currentChapter: null, chapterContent: '', chapterToc: [], anchorMap: new Map(), translationContent: null })
          return
        }

        // Load chapter content
        const rawContent = await window.api.readFile(chapter.path)
        const content = rawContent ? stripAnchorSyntax(rawContent) : ''
        const toc = rawContent ? parseHeadings(rawContent) : []
        const anchors = rawContent ? buildAnchorMap(rawContent) : new Map()
        set({
          currentChapter: chapter,
          chapterContent: content,
          chapterToc: toc,
          anchorMap: anchors,
        })

        // Load translation if in comparison mode and it's a Babelfish project
        const { currentBook, showComparison } = get()
        if (showComparison && currentBook?.isBabelfish && currentBook.translationPath) {
          const translationPath = chapter.path.replace(
            currentBook.path,
            currentBook.translationPath
          )
          const translationContent = await window.api.readFile(translationPath)
          set({ translationContent: translationContent || null })
        }
      },

      setChapterContent: (content) => set({ chapterContent: content }),

      setActiveAnchor: (anchor) => set({ activeAnchor: anchor }),

      setTranslationContent: (content) => set({ translationContent: content }),

      toggleComparison: () => {
        const { showComparison, currentChapter } = get()
        set({ showComparison: !showComparison })

        // Reload chapter to get/clear translation
        if (currentChapter) {
          get().setCurrentChapter(currentChapter)
        }
      },

      nextChapter: () => {
        const { currentBook, currentChapter } = get()
        if (!currentBook || !currentChapter) return

        const currentIndex = currentBook.chapters.findIndex(c => c.id === currentChapter.id)
        if (currentIndex < currentBook.chapters.length - 1) {
          get().setCurrentChapter(currentBook.chapters[currentIndex + 1])
        }
      },

      previousChapter: () => {
        const { currentBook, currentChapter } = get()
        if (!currentBook || !currentChapter) return

        const currentIndex = currentBook.chapters.findIndex(c => c.id === currentChapter.id)
        if (currentIndex > 0) {
          get().setCurrentChapter(currentBook.chapters[currentIndex - 1])
        }
      },

      saveProgress: (scrollPosition) => {
        const { currentBook, currentChapter } = get()
        if (!currentBook || !currentChapter) return

        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [currentBook.id]: {
              bookId: currentBook.id,
              chapterId: currentChapter.id,
              scrollPosition,
              lastRead: new Date().toISOString(),
            },
          },
        }))
      },

      loadBook: async (path) => {
        // Check if it's a Babelfish project
        const isBabelfish = await window.api.isBabelfishProject(path)

        // Try to read toc.json
        const tocJson = await window.api.readTocJson(path)

        let chapters: Chapter[] = []
        let bookTitle = path.split(/[/\\]/).pop() || 'Book'
        let bookAuthor: string | undefined

        if (tocJson) {
          // Use toc.json for chapter order and titles
          bookTitle = tocJson.title || bookTitle
          bookAuthor = tocJson.author
          for (const ch of tocJson.chapters) {
            chapters.push({
              id: `${path}/${ch.file}`,
              title: ch.title,
              path: `${path}/${ch.file}`,
            })
          }
        } else {
          // Fallback: scan directory for .md files
          const processDir = async (dirPath: string, prefix = '') => {
            const items = await window.api.readDir(dirPath)

            for (const item of items) {
              if (item.isDirectory) {
                await processDir(item.path, `${prefix}${item.name}/`)
              } else if (item.name.endsWith('.md')) {
                chapters.push({
                  id: item.path,
                  title: item.name.replace('.md', '').replace(/_/g, ' '),
                  path: item.path,
                })
              }
            }
          }

          // For Babelfish, read from source/ folder
          const sourcePath = isBabelfish ? `${path}/source` : path
          await processDir(sourcePath)

          // Sort chapters by name
          chapters.sort((a, b) => a.title.localeCompare(b.title))
        }

        const sourcePath = isBabelfish ? `${path}/source` : path
        const book: Book = {
          id: path,
          title: bookTitle,
          author: bookAuthor,
          path: tocJson ? path : sourcePath,
          chapters,
          isBabelfish,
          translationPath: isBabelfish ? `${path}/translated` : undefined,
        }

        set({ currentBook: book })

        // Load first chapter or resume from progress
        const progress = get().readingProgress[book.id]
        if (progress) {
          const chapter = chapters.find(c => c.id === progress.chapterId)
          if (chapter) {
            get().setCurrentChapter(chapter)
            return
          }
        }

        if (chapters.length > 0) {
          get().setCurrentChapter(chapters[0])
        }
      },
    }),
    {
      name: 'glyph-reader',
      partialize: (state) => ({
        readingProgress: state.readingProgress,
      }),
    }
  )
)
