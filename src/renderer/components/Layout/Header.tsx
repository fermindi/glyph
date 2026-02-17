import { Sun, Moon, Scroll, PanelLeft, ArrowLeftRight, Minus, Plus } from 'lucide-react'
import { useSettingsStore } from '../../stores/settings'
import { useReaderStore } from '../../stores/reader'

export function Header() {
  const { theme, fontSize, cycleTheme, increaseFontSize, decreaseFontSize, toggleSidebar } = useSettingsStore()
  const { currentBook, currentChapter, showComparison, toggleComparison } = useReaderStore()

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Scroll

  return (
    <header
      className="h-12 flex items-center justify-between px-4 border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--bg-secondary)',
        WebkitAppRegion: 'drag',
      } as React.CSSProperties}
    >
      {/* Left side - menu and title */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded hover:opacity-70 transition-opacity"
          title="Toggle Sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <span className="font-bold text-lg">Glyph</span>
        {currentBook && (
          <span className="text-sm opacity-60">
            / {currentBook.title}
            {currentChapter && ` / ${currentChapter.title}`}
          </span>
        )}
      </div>

      {/* Right side - controls */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* Comparison mode (for Babelfish projects) */}
        {currentBook?.isBabelfish && (
          <button
            onClick={toggleComparison}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              showComparison ? 'bg-blue-500 text-white' : 'hover:opacity-70'
            }`}
            style={{ backgroundColor: showComparison ? 'var(--accent)' : undefined }}
            title="Toggle Comparison View"
          >
            <ArrowLeftRight size={14} className="inline mr-1" /> Compare
          </button>
        )}

        {/* Font size controls */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={decreaseFontSize}
            className="px-2 py-1 rounded hover:opacity-70 transition-opacity"
            title="Decrease Font Size"
          >
            <Minus size={14} />
          </button>
          <span className="text-sm w-8 text-center">{fontSize}</span>
          <button
            onClick={increaseFontSize}
            className="px-2 py-1 rounded hover:opacity-70 transition-opacity"
            title="Increase Font Size"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="p-2 rounded hover:opacity-70 transition-opacity"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon size={18} />
        </button>
      </div>
    </header>
  )
}
