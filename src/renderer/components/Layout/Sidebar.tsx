import { useSettingsStore } from '../../stores/settings'
import { useReaderStore, Chapter } from '../../stores/reader'

export function Sidebar() {
  const { sidebarVisible } = useSettingsStore()
  const { currentBook, currentChapter, setCurrentChapter } = useReaderStore()

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
            <ChapterItem
              key={chapter.id}
              chapter={chapter}
              isActive={currentChapter?.id === chapter.id}
              onClick={() => setCurrentChapter(chapter)}
            />
          ))}
        </nav>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="p-4 text-xs opacity-50 border-t" style={{ borderColor: 'var(--bg-primary)' }}>
        <p>← → Navigate chapters</p>
        <p>D: Toggle theme</p>
        <p>+/- Font size</p>
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
