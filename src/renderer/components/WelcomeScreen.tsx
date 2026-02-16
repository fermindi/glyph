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
        <div className="text-6xl mb-6">📖</div>

        <h1 className="text-3xl font-bold mb-2">Welcome to Glyph</h1>
        <p className="opacity-60 mb-8">
          A beautiful Markdown reader for books and documents
        </p>

        {/* Open buttons */}
        <div className="flex gap-4 justify-center mb-8">
          <button
            onClick={handleOpenFolder}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--accent)', color: 'white' }}
          >
            📂 Open Folder
          </button>
          <button
            onClick={handleOpenFile}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            📄 Open File
          </button>
        </div>

        {/* Keyboard shortcuts */}
        <div className="text-sm opacity-40">
          <p className="mb-1">Keyboard Shortcuts:</p>
          <p>← → Navigate chapters • D Toggle theme • +/- Font size</p>
        </div>

        {/* Babelfish note */}
        <div className="mt-8 p-4 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <p className="font-semibold mb-1">📚 Babelfish Integration</p>
          <p className="opacity-60">
            Open a Babelfish project folder to compare original and translated text side-by-side.
          </p>
        </div>
      </div>
    </div>
  )
}
