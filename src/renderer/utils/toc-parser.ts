import type { TocEntry } from '../../shared/types'

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function parseHeadings(markdown: string): TocEntry[] {
  const lines = markdown.split('\n')
  const root: TocEntry[] = []
  const stack: { level: number; entry: TocEntry }[] = []

  for (const line of lines) {
    // Skip headings inside code blocks
    if (line.trim().startsWith('```')) continue

    const match = line.match(/^(#{1,3})\s+(.+)$/)
    if (!match) continue

    const level = match[1].length
    let title = match[2].trim()

    // Extract explicit anchor {#id}
    let anchor: string
    const anchorMatch = title.match(/\{#([^}]+)\}\s*$/)
    if (anchorMatch) {
      anchor = anchorMatch[1]
      title = title.replace(/\s*\{#[^}]+\}\s*$/, '').trim()
    } else {
      anchor = generateSlug(title)
    }

    const entry: TocEntry = { level, title, anchor, children: [] }

    // Find parent: walk stack backwards to find a level < current
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      root.push(entry)
    } else {
      stack[stack.length - 1].entry.children.push(entry)
    }

    stack.push({ level, entry })
  }

  return root
}

export function stripAnchorSyntax(markdown: string): string {
  // Remove {#id} from heading lines
  return markdown.replace(/^(#{1,6}\s+.+?)\s*\{#[^}]+\}\s*$/gm, '$1')
}

/**
 * Build a map from slug(title) -> explicit anchor ID.
 * Used by HeadingWithAnchor to set the correct ID on headings
 * that had explicit {#id} in the original markdown.
 */
export function buildAnchorMap(markdown: string): Map<string, string> {
  const map = new Map<string, string>()
  const lines = markdown.split('\n')

  for (const line of lines) {
    const match = line.match(/^#{1,3}\s+(.+)$/)
    if (!match) continue

    const raw = match[1].trim()
    const anchorMatch = raw.match(/\{#([^}]+)\}\s*$/)
    if (anchorMatch) {
      const explicitId = anchorMatch[1]
      const title = raw.replace(/\s*\{#[^}]+\}\s*$/, '').trim()
      const slug = generateSlug(title)
      map.set(slug, explicitId)
    }
  }

  return map
}
