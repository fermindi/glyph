import { useSettingsStore } from '../../stores/settings'
import { useReaderStore, Chapter } from '../../stores/reader'
import { ArrowLeft, ArrowRight, Palette, Plus, Minus } from 'lucide-react'
import type { TocEntry } from '../../../shared/types'

export function Sidebar() {
  const { sidebarVisible } = useSettingsStore()
  const { currentBook, currentChapter, setCurrentChapter, chapterToc, activeAnchor } = useReaderStore()

  if (!sidebarVisible) return null

  return (
    <aside
      className="w-64 border-r overflow-y-auto flex flex-col"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--bg-primary)',
      }}
    >
      {/* Book info */}
      {currentBook && (
        <div className="p-4 border-b" style={{ borderColor: 'var(--bg-primary)' }}>
          <h2 className="font-bold text-lg truncate" title={currentBook.title}>
            {currentBook.title}
          </h2>
          {currentBook.author && (
            <p className="text-sm opacity-60">{currentBook.author}</p>
          )}
          {currentBook.isBabelfish && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded bg-blue-500 text-white">
              Babelfish Project
            </span>
          )}
        </div>
      )}

      {/* Chapter list */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="px-4 py-2 text-sm font-semibold uppercase tracking-wide opacity-50">
          Chapters
        </h3>
        <nav className="pb-4">
          {currentBook?.chapters.map((chapter) => (
            <div key={chapter.id}>
              <ChapterItem
                chapter={chapter}
                isActive={currentChapter?.id === chapter.id}
                onClick={() => setCurrentChapter(chapter)}
              />
              {currentChapter?.id === chapter.id && chapterToc.length > 0 && (
                <TocTree entries={flattenH1(chapterToc)} activeAnchor={activeAnchor} />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="p-4 text-xs opacity-50 border-t flex flex-col gap-1" style={{ borderColor: 'var(--bg-primary)' }}>
        <span className="flex items-center gap-1.5"><ArrowLeft size={11} /><ArrowRight size={11} /> Chapters</span>
        <span className="flex items-center gap-1.5"><Palette size={11} /> <kbd className="px-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}>D</kbd> Theme</span>
        <span className="flex items-center gap-1.5"><Minus size={11} /><Plus size={11} /> Font size</span>
      </div>
    </aside>
  )
}

function ChapterItem({
  chapter,
  isActive,
  onClick,
}: {
  chapter: Chapter
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-80 ${
        isActive ? 'font-semibold' : ''
      }`}
      style={{
        backgroundColor: isActive ? 'var(--bg-primary)' : undefined,
        color: isActive ? 'var(--accent)' : undefined,
      }}
    >
      {chapter.title}
    </button>
  )
}

// Skip h1 entries (already shown as chapter title), promote their children
function flattenH1(entries: TocEntry[]): TocEntry[] {
  const result: TocEntry[] = []
  for (const entry of entries) {
    if (entry.level === 1) {
      result.push(...entry.children)
    } else {
      result.push(entry)
    }
  }
  return result
}

function TocTree({ entries, activeAnchor }: { entries: TocEntry[]; activeAnchor: string | null }) {
  return (
    <div className="toc-tree">
      {entries.map((entry) => (
        <TocNode key={entry.anchor} entry={entry} activeAnchor={activeAnchor} />
      ))}
    </div>
  )
}

function TocNode({ entry, activeAnchor }: { entry: TocEntry; activeAnchor: string | null }) {
  const isActive = activeAnchor === entry.anchor

  const handleClick = () => {
    const el = document.getElementById(entry.anchor)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`toc-entry w-full text-left text-xs py-1 transition-opacity ${isActive ? 'font-semibold' : 'hover:opacity-80'}`}
        style={{
          paddingLeft: `${(entry.level - 2) * 0.75 + 1.5}rem`,
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        }}
      >
        {entry.title}
      </button>
      {entry.children.length > 0 && (
        <TocTree entries={entry.children} activeAnchor={activeAnchor} />
      )}
    </>
  )
}
