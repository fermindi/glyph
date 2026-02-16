import { useEffect } from 'react'
import { useSettingsStore } from './stores/settings'
import { useReaderStore } from './stores/reader'
import { Sidebar } from './components/Layout/Sidebar'
import { Reader } from './components/Reader/Reader'
import { Header } from './components/Layout/Header'
import { WelcomeScreen } from './components/WelcomeScreen'

function App() {
  const { theme } = useSettingsStore()
  const { currentBook, currentChapter } = useReaderStore()

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key) {
        case 'ArrowLeft':
          useReaderStore.getState().previousChapter()
          break
        case 'ArrowRight':
          useReaderStore.getState().nextChapter()
          break
        case 'd':
        case 'D':
          useSettingsStore.getState().cycleTheme()
          break
        case '+':
        case '=':
          useSettingsStore.getState().increaseFontSize()
          break
        case '-':
          useSettingsStore.getState().decreaseFontSize()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {currentBook && currentChapter ? (
            <Reader />
          ) : (
            <WelcomeScreen />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
