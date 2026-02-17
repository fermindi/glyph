import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readdir, readFile, stat } from 'fs/promises'
import { join } from 'path'

function devFsPlugin(): Plugin {
  return {
    name: 'dev-fs',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)

        if (url.pathname === '/__dev/readDir') {
          const dirPath = url.searchParams.get('path')
          if (!dirPath) { res.statusCode = 400; res.end('Missing path'); return }
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
            const filtered = result.filter(f => f.isDirectory || f.name.endsWith('.md') || f.name === 'toc.json')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(filtered))
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end('[]')
          }
          return
        }

        if (url.pathname === '/__dev/readFile') {
          const filePath = url.searchParams.get('path')
          if (!filePath) { res.statusCode = 400; res.end('Missing path'); return }
          try {
            const content = await readFile(filePath, 'utf-8')
            res.setHeader('Content-Type', 'text/plain; charset=utf-8')
            res.end(content)
          } catch {
            res.statusCode = 404
            res.end('')
          }
          return
        }

        if (url.pathname === '/__dev/stat') {
          const filePath = url.searchParams.get('path')
          if (!filePath) { res.statusCode = 400; res.end('Missing path'); return }
          try {
            await stat(filePath)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ exists: true }))
          } catch {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ exists: false }))
          }
          return
        }

        if (url.pathname === '/__dev/serveFile') {
          const filePath = url.searchParams.get('path')
          if (!filePath) { res.statusCode = 400; res.end('Missing path'); return }
          try {
            const content = await readFile(filePath)
            const ext = filePath.split('.').pop()?.toLowerCase()
            const mimeMap: Record<string, string> = {
              png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
              gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
            }
            res.setHeader('Content-Type', mimeMap[ext || ''] || 'application/octet-stream')
            res.end(content)
          } catch {
            res.statusCode = 404
            res.end('')
          }
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  root: 'src/renderer',
  plugins: [react(), devFsPlugin()],
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
