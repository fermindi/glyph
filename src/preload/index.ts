import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods to the renderer
contextBridge.exposeInMainWorld('api', {
  // Dialog
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  openFile: () => ipcRenderer.invoke('dialog:openFile'),

  // File system
  readDir: (path: string) => ipcRenderer.invoke('fs:readDir', path),
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  isBabelfishProject: (path: string) => ipcRenderer.invoke('fs:isBabelfishProject', path),
  readTocJson: (path: string) => ipcRenderer.invoke('fs:readTocJson', path),
  resolveImagePath: (src: string, chapterFilePath: string, bookRoot: string) =>
    ipcRenderer.invoke('fs:resolveImagePath', src, chapterFilePath, bookRoot),
})

// Type declarations
declare global {
  interface Window {
    api: {
      openFolder: () => Promise<string | null>
      openFile: () => Promise<string | null>
      readDir: (path: string) => Promise<FileEntry[]>
      readFile: (path: string) => Promise<string | null>
      isBabelfishProject: (path: string) => Promise<boolean>
      readTocJson: (path: string) => Promise<import('../shared/types').TocJson | null>
      resolveImagePath: (src: string, chapterFilePath: string, bookRoot: string) => Promise<string | null>
    }
  }
}

interface FileEntry {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string
}

export {}
