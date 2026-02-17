import { useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useReaderStore } from '../../stores/reader'
import { useSettingsStore } from '../../stores/settings'
import { markdownComponents } from './MarkdownComponents'

export function Reader() {
  const { chapterContent, translationContent, showComparison, currentBook, currentChapter, saveProgress, nextChapter, previousChapter, setActiveAnchor } = useReaderStore()
  const { fontSize, fontFamily, lineHeight } = useSettingsStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const overscrollAccum = useRef(0)
  const overscrollTimer = useRef<NodeJS.Timeout | null>(null)
  const navigatingRef = useRef(false)

  const OVERSCROLL_THRESHOLD = 150 // pixels of accumulated overscroll to trigger
  const OVERSCROLL_RESET_MS = 800 // reset accumulator after idle

  const handleOverscrollNav = useCallback((direction: 'next' | 'prev') => {
    if (navigatingRef.current) return
    navigatingRef.current = true
    overscrollAccum.current = 0

    if (direction === 'next') {
      nextChapter()
    } else {
      previousChapter()
    }

    // Prevent immediate re-trigger after chapter change
    setTimeout(() => {
      navigatingRef.current = false
    }, 500)
  }, [nextChapter, previousChapter])

  // Save scroll position periodically
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollPosition = container.scrollTop / (container.scrollHeight - container.clientHeight)
      saveProgress(scrollPosition)
    }

    // Debounce scroll saves
    let timeout: NodeJS.Timeout
    const debouncedScroll = () => {
      clearTimeout(timeout)
      timeout = setTimeout(handleScroll, 500)
    }

    container.addEventListener('scroll', debouncedScroll)
    return () => {
      container.removeEventListener('scroll', debouncedScroll)
      clearTimeout(timeout)
    }
  }, [saveProgress])

  // Overscroll chapter navigation via wheel
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (navigatingRef.current) return

      const atTop = container.scrollTop <= 0
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1

      if (atBottom && e.deltaY > 0) {
        overscrollAccum.current += e.deltaY
        if (overscrollAccum.current >= OVERSCROLL_THRESHOLD) {
          handleOverscrollNav('next')
        }
      } else if (atTop && e.deltaY < 0) {
        overscrollAccum.current += Math.abs(e.deltaY)
        if (overscrollAccum.current >= OVERSCROLL_THRESHOLD) {
          handleOverscrollNav('prev')
        }
      } else {
        overscrollAccum.current = 0
      }

      // Reset accumulator after pause
      if (overscrollTimer.current) clearTimeout(overscrollTimer.current)
      overscrollTimer.current = setTimeout(() => {
        overscrollAccum.current = 0
      }, OVERSCROLL_RESET_MS)
    }

    container.addEventListener('wheel', handleWheel, { passive: true })
    return () => {
      container.removeEventListener('wheel', handleWheel)
      if (overscrollTimer.current) clearTimeout(overscrollTimer.current)
    }
  }, [handleOverscrollNav])

  // Track which heading is currently visible for TOC highlighting
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateActiveHeading = () => {
      const headings = container.querySelectorAll('h1[id], h2[id], h3[id]')
      let current: string | null = null

      for (const heading of headings) {
        const rect = heading.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()
        // Heading is at or above the top quarter of the container
        if (rect.top <= containerRect.top + containerRect.height * 0.25) {
          current = heading.id
        } else {
          break
        }
      }

      setActiveAnchor(current)
    }

    let raf: number
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(updateActiveHeading)
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    // Initial check
    updateActiveHeading()

    return () => {
      container.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [chapterContent, setActiveAnchor])

  const contentStyle = {
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily === 'serif' ? '"Literata", Georgia, Cambria, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif',
    lineHeight,
  }

  if (showComparison && translationContent) {
    return (
      <div className="h-full flex" ref={containerRef}>
        {/* Original */}
        <div className="flex-1 overflow-y-auto border-r" style={{ borderColor: 'var(--bg-secondary)' }}>
          <div className="px-4 py-2 text-xs uppercase tracking-wide opacity-50 sticky top-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            Original
          </div>
          <article className="markdown-content" style={contentStyle}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}components={markdownComponents}>
              {chapterContent}
            </ReactMarkdown>
          </article>
        </div>

        {/* Translation */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs uppercase tracking-wide opacity-50 sticky top-0" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            Translation
          </div>
          <article className="markdown-content" style={contentStyle}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}components={markdownComponents}>
              {translationContent}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto" ref={containerRef}>
      <article className="markdown-content" style={contentStyle}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}components={markdownComponents}>
          {chapterContent}
        </ReactMarkdown>
      </article>

      {/* Navigation footer */}
      <footer className="flex justify-between items-center p-4 border-t" style={{ borderColor: 'var(--bg-secondary)' }}>
        <button
          onClick={previousChapter}
          className="px-4 py-2 rounded hover:opacity-70 transition-opacity"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          ← Previous
        </button>

        {currentBook && currentChapter && (
          <span className="text-sm opacity-50">
            {currentBook.chapters.findIndex(c => c.id === currentChapter.id) + 1} / {currentBook.chapters.length}
          </span>
        )}

        <button
          onClick={nextChapter}
          className="px-4 py-2 rounded hover:opacity-70 transition-opacity"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          Next →
        </button>
      </footer>
    </div>
  )
}
