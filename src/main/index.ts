import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readdir, readFile, stat } from 'fs/promises'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the renderer
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers

// Open folder dialog
ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    title: 'Select Book Folder',
  })

  if (result.canceled) return null
  return result.filePaths[0]
})

// Open file dialog
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    title: 'Select Markdown File',
  })

  if (result.canceled) return null
  return result.filePaths[0]
})

// Read directory contents
ipcMain.handle('fs:readDir', async (_, dirPath: string) => {
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const result = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(dirPath, entry.name)
        const stats = await stat(fullPath)
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          modified: stats.mtime.toISOString(),
        }
      })
    )
    return result.filter(f => f.isDirectory || f.name.endsWith('.md'))
  } catch (error) {
    console.error('Error reading directory:', error)
    return []
  }
})

// Read file contents
ipcMain.handle('fs:readFile', async (_, filePath: string) => {
  try {
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Error reading file:', error)
    return null
  }
})

// Check if path is Babelfish project
ipcMain.handle('fs:isBabelfishProject', async (_, dirPath: string) => {
  try {
    const bookYaml = join(dirPath, 'book.yaml')
    await stat(bookYaml)
    return true
  } catch {
    return false
  }
})
