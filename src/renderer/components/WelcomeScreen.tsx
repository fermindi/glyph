import { BookOpen, FolderOpen, FileText, FlaskConical, Languages, ArrowLeft, ArrowRight, Palette, Plus, Minus, Keyboard } from 'lucide-react'
import { useReaderStore } from '../stores/reader'

export function WelcomeScreen() {
  const { loadBook } = useReaderStore()

  const handleOpenFolder = async () => {
    const path = await window.api.openFolder()
    if (path) {
      await loadBook(path)
    }
  }

  const handleOpenFile = async () => {
    const path = await window.api.openFile()
    if (path) {
      // For single file, create a minimal book
      const content = await window.api.readFile(path)
      if (content) {
        const fileName = path.split(/[/\\]/).pop() || 'Document'
        useReaderStore.setState({
          currentBook: {
            id: path,
            title: fileName.replace('.md', ''),
            path: path,
            chapters: [{
              id: path,
              title: fileName.replace('.md', ''),
              path: path,
            }],
          },
          currentChapter: {
            id: path,
            title: fileName.replace('.md', ''),
            path: path,
          },
          chapterContent: content,
        })
      }
    }
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <BookOpen size={64} strokeWidth={1.2} style={{ color: 'var(--accent)' }} />
        </div>

        <h1 className="text-3xl font-bold mb-2">Welcome to Glyph</h1>
        <p className="opacity-60 mb-8">
          A beautiful Markdown reader for books and documents
        </p>

        {/* Open buttons */}
        <div className="flex gap-4 justify-center mb-4">
          <button
            onClick={handleOpenFolder}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            <FolderOpen size={18} className="inline mr-2" /> Open Folder
          </button>
          <button
            onClick={handleOpenFile}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <FileText size={18} className="inline mr-2" /> Open File
          </button>
        </div>

        {/* Dev test book */}
        <div className="mb-8">
          <button
            onClick={() => loadBook('/home/fermindi/projects/babelfish/Financial Statements/final')}
            className="px-4 py-2 rounded text-xs transition-colors opacity-50 hover:opacity-80"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <FlaskConical size={14} className="inline mr-1" /> Load Test Book (Financial Statements)
          </button>
        </div>

        {/* Keyboard shortcuts */}
        <div className="text-sm opacity-40">
          <p className="mb-2 flex items-center justify-center gap-1">
            <Keyboard size={14} /> Shortcuts
          </p>
          <div className="flex justify-center gap-6">
            <span className="flex items-center gap-1">
              <ArrowLeft size={13} /><ArrowRight size={13} /> Chapters
            </span>
            <span className="flex items-center gap-1">
              <Palette size={13} /> <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)' }}>D</kbd> Theme
            </span>
            <span className="flex items-center gap-1">
              <Minus size={13} /><Plus size={13} /> Font
            </span>
          </div>
        </div>

        {/* Babelfish note */}
        <div className="mt-8 p-4 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <p className="font-semibold mb-1"><Languages size={16} className="inline mr-1" /> Babelfish Integration</p>
          <p className="opacity-60">
            Open a Babelfish project folder to compare original and translated text side-by-side.
          </p>
        </div>
      </div>
    </div>
  )
}
