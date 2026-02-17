import { useState, useEffect, type ComponentPropsWithoutRef } from 'react'
import { generateSlug } from '../../utils/toc-parser'
import { useReaderStore } from '../../stores/reader'

function HeadingWithAnchor({
  level,
  children,
  ...props
}: ComponentPropsWithoutRef<'h1'> & { level: number }) {
  const { anchorMap } = useReaderStore()
  const text = extractText(children)
  const slug = generateSlug(text)
  // Use explicit anchor from {#id} if available, otherwise use generated slug
  const id = props.id || anchorMap.get(slug) || slug
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3'

  return (
    <Tag id={id} {...props}>
      {children}
    </Tag>
  )
}

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText((children as React.ReactElement).props.children)
  }
  return ''
}

function MarkdownImage({ src, alt, ...props }: ComponentPropsWithoutRef<'img'>) {
  const { currentChapter, currentBook } = useReaderStore()
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src) return

    // If it's an absolute URL, use as-is
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
      setResolvedSrc(src)
      return
    }

    // Try to resolve via IPC
    if (currentChapter && currentBook && window.api.resolveImagePath) {
      window.api.resolveImagePath(src, currentChapter.path, currentBook.path)
        .then((resolved) => {
          if (resolved) {
            // If already a URL (web mode dev server), use as-is; otherwise file:// for Electron
            setResolvedSrc(resolved.startsWith('/') && !resolved.startsWith('/__')
              ? `file://${resolved}`
              : resolved)
          } else {
            setError(true)
          }
        })
        .catch(() => setError(true))
    } else {
      // Web mode: use src as-is
      setResolvedSrc(src)
    }
  }, [src, currentChapter, currentBook])

  if (error || (!resolvedSrc && !src)) {
    return (
      <span className="image-placeholder" role="img" aria-label={alt || 'Image not found'}>
        [{alt || 'Image not found'}]
      </span>
    )
  }

  return <img src={resolvedSrc || src} alt={alt} {...props} />
}

function resolveRelativePath(href: string, currentChapterPath: string): string {
  // Split off the anchor
  const [filePart] = href.split('#')
  if (!filePart) return ''

  const currentDir = currentChapterPath.substring(0, currentChapterPath.lastIndexOf('/'))
  const parts = `${currentDir}/${filePart}`.split('/')
  const resolved: string[] = []

  for (const part of parts) {
    if (part === '..') {
      resolved.pop()
    } else if (part !== '.' && part !== '') {
      resolved.push(part)
    }
  }

  return '/' + resolved.join('/')
}

function MarkdownLink({ href, children, ...props }: ComponentPropsWithoutRef<'a'>) {
  const { currentBook, currentChapter, setCurrentChapter } = useReaderStore()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href) return

    e.preventDefault()

    // Anchor link — scroll to element in current chapter
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      return
    }

    // External link — open in new tab
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener')
      return
    }

    // Relative .md link — find matching chapter and navigate
    if (currentBook && currentChapter) {
      const anchor = href.includes('#') ? href.split('#')[1] : null
      const resolvedPath = resolveRelativePath(href, currentChapter.path)
      const fileName = resolvedPath.split('/').pop() || ''

      // Try exact path match first, then match by filename
      const targetChapter = currentBook.chapters.find(c => c.path === resolvedPath)
        || currentBook.chapters.find(c => c.path.endsWith('/' + fileName))
        || currentBook.chapters.find(c => c.path.endsWith(fileName.replace('.md', '') + '.md'))

      if (targetChapter) {
        setCurrentChapter(targetChapter)
        // Scroll to anchor after chapter loads
        if (anchor) {
          setTimeout(() => {
            const el = document.getElementById(anchor)
            if (el) el.scrollIntoView({ behavior: 'smooth' })
          }, 300)
        }
      }
    }
  }

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

export const markdownComponents = {
  h1: (props: ComponentPropsWithoutRef<'h1'>) => <HeadingWithAnchor level={1} {...props} />,
  h2: (props: ComponentPropsWithoutRef<'h2'>) => <HeadingWithAnchor level={2} {...props} />,
  h3: (props: ComponentPropsWithoutRef<'h3'>) => <HeadingWithAnchor level={3} {...props} />,
  img: (props: ComponentPropsWithoutRef<'img'>) => <MarkdownImage {...props} />,
  a: (props: ComponentPropsWithoutRef<'a'>) => <MarkdownLink {...props} />,
}
