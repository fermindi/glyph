/**
 * Mock of Electron's window.api for browser dev mode.
 * Uses Vite dev-fs middleware to access the server filesystem via HTTP.
 * Falls back to <input type="file"> for Open Folder/File dialogs.
 */

const DEV_API = '/__dev'

async function devReadDir(path: string) {
  const res = await fetch(`${DEV_API}/readDir?path=${encodeURIComponent(path)}`)
  if (!res.ok) return []
  return res.json()
}

async function devReadFile(path: string): Promise<string | null> {
  const res = await fetch(`${DEV_API}/readFile?path=${encodeURIComponent(path)}`)
  if (!res.ok) return null
  return res.text()
}

async function devStat(path: string): Promise<boolean> {
  const res = await fetch(`${DEV_API}/stat?path=${encodeURIComponent(path)}`)
  if (!res.ok) return false
  const data = await res.json()
  return data.exists
}

function pickFiles(accept: string, webkitdirectory: boolean): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    if (webkitdirectory) {
      input.setAttribute('webkitdirectory', '')
    }
    input.onchange = () => resolve(input.files)
    input.oncancel = () => resolve(null)
    input.click()
  })
}

// In-memory stores for files opened via browser file picker
const fileStore = new Map<string, string>()
const dirStore = new Map<string, Array<{ name: string; path: string; isDirectory: boolean; size: number; modified: string }>>()

function buildDirTree(files: FileList, rootPath: string) {
  dirStore.clear()
  fileStore.clear()

  const dirs = new Map<string, Array<{ name: string; path: string; isDirectory: boolean; size: number; modified: string }>>()

  for (const file of Array.from(files)) {
    const relativePath = file.webkitRelativePath || file.name
    const fullPath = `${rootPath}/${relativePath}`
    const parts = relativePath.split('/')

    for (let i = 1; i < parts.length; i++) {
      const dirPath = `${rootPath}/${parts.slice(0, i).join('/')}`
      if (!dirs.has(dirPath)) {
        dirs.set(dirPath, [])
      }
    }

    const parentParts = parts.slice(0, -1)
    const parentPath = parentParts.length > 0 ? `${rootPath}/${parentParts.join('/')}` : rootPath
    if (!dirs.has(parentPath)) {
      dirs.set(parentPath, [])
    }

    dirs.get(parentPath)!.push({
      name: parts[parts.length - 1],
      path: fullPath,
      isDirectory: false,
      size: file.size,
      modified: new Date(file.lastModified).toISOString(),
    })

    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = () => {
      fileStore.set(fullPath, reader.result as string)
    }
  }

  for (const [dirPath] of dirs) {
    const parts = dirPath.replace(`${rootPath}/`, '').split('/')
    if (parts.length > 1) {
      const parentPath = `${rootPath}/${parts.slice(0, -1).join('/')}`
      const parent = dirs.get(parentPath)
      if (parent && !parent.find((e) => e.path === dirPath)) {
        parent.push({
          name: parts[parts.length - 1],
          path: dirPath,
          isDirectory: true,
          size: 0,
          modified: new Date().toISOString(),
        })
      }
    }
  }

  if (!dirs.has(rootPath)) {
    dirs.set(rootPath, [])
  }
  for (const [dirPath] of dirs) {
    const relative = dirPath.replace(`${rootPath}/`, '')
    if (!relative.includes('/') && relative !== '') {
      const root = dirs.get(rootPath)!
      if (!root.find((e) => e.path === dirPath)) {
        root.push({
          name: relative,
          path: dirPath,
          isDirectory: true,
          size: 0,
          modified: new Date().toISOString(),
        })
      }
    }
  }

  for (const [k, v] of dirs) {
    dirStore.set(k, v)
  }
}

function waitForFile(path: string, timeout = 2000): Promise<string | null> {
  return new Promise((resolve) => {
    if (fileStore.has(path)) {
      resolve(fileStore.get(path)!)
      return
    }
    const start = Date.now()
    const interval = setInterval(() => {
      if (fileStore.has(path)) {
        clearInterval(interval)
        resolve(fileStore.get(path)!)
      } else if (Date.now() - start > timeout) {
        clearInterval(interval)
        resolve(null)
      }
    }, 50)
  })
}

/**
 * Check if a path is a real server filesystem path (starts with /)
 * vs a virtual /web/ path from the file picker.
 */
function isServerPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('/web/')
}

export function installWebApiMock() {
  if (window.api) return // Already has Electron API

  window.api = {
    openFolder: async () => {
      // Prompt user for a server path first
      const serverPath = prompt('Enter server folder path (or cancel for file picker):')
      if (serverPath) {
        return serverPath
      }

      // Fall back to browser file picker
      const files = await pickFiles('.md', true)
      if (!files || files.length === 0) return null

      const firstRelative = files[0].webkitRelativePath
      const rootName = firstRelative.split('/')[0]
      const rootPath = `/web/${rootName}`

      buildDirTree(files, rootPath)
      return rootPath
    },

    openFile: async () => {
      const files = await pickFiles('.md', false)
      if (!files || files.length === 0) return null

      const file = files[0]
      const path = `/web/${file.name}`
      const content = await file.text()
      fileStore.set(path, content)
      return path
    },

    readDir: async (path: string) => {
      if (isServerPath(path)) {
        return devReadDir(path)
      }
      return dirStore.get(path) || []
    },

    readFile: async (path: string) => {
      if (isServerPath(path)) {
        return devReadFile(path)
      }
      return waitForFile(path)
    },

    isBabelfishProject: async (path: string) => {
      if (isServerPath(path)) {
        return devStat(`${path}/book.yaml`)
      }
      return dirStore.has(`${path}/source`)
    },

    readTocJson: async (path: string) => {
      if (isServerPath(path)) {
        const content = await devReadFile(`${path}/toc.json`)
        if (content) {
          try { return JSON.parse(content) } catch { return null }
        }
        return null
      }
      const tocPath = `${path}/toc.json`
      const content = fileStore.get(tocPath)
      if (content) {
        try { return JSON.parse(content) } catch { return null }
      }
      return null
    },

    resolveImagePath: async (src: string, chapterFilePath: string, bookRoot: string) => {
      if (!isServerPath(bookRoot)) return src

      // Resolve like the Electron version but return a dev server URL
      const chapterDir = chapterFilePath.substring(0, chapterFilePath.lastIndexOf('/'))
      const candidates = [
        `${chapterDir}/${src}`,
        `${bookRoot}/images/${src}`,
        `${bookRoot}/${src}`,
      ]

      for (const candidate of candidates) {
        const exists = await devStat(candidate)
        if (exists) {
          return `${DEV_API}/serveFile?path=${encodeURIComponent(candidate)}`
        }
      }
      return null
    },
  }
}
