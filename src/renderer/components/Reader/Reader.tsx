import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useReaderStore } from '../../stores/reader'
import { useSettingsStore } from '../../stores/settings'

export function Reader() {
  const { chapterContent, translationContent, showComparison, currentBook, currentChapter, saveProgress, nextChapter, previousChapter } = useReaderStore()
  const { fontSize, fontFamily, lineHeight } = useSettingsStore()
  const containerRef = useRef<HTMLDivElement>(null)

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

  const contentStyle = {
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily === 'serif' ? 'Georgia, Cambria, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif',
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
