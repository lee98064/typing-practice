import type { ImTableFile } from './types'

/** Immutable indexes. Construction is linear apart from sorting the distinct codes. */
export class ImTable {
  private readonly entries = new Map<string, string[]>()
  private readonly reverse = new Map<string, string[]>()
  private readonly sortedCodes: string[]
  private readonly shortReverse = new Map<string, { code: string; index: number }[]>()

  constructor(readonly file: ImTableFile) {
    for (const [code, slots] of Object.entries(file.shortcodes ?? {})) {
      slots.forEach((char, index) => {
        if (!char) return
        const list = this.shortReverse.get(char)
        if (list) list.push({ code, index })
        else this.shortReverse.set(char, [{ code, index }])
      })
    }
    for (const [code, candidates] of Object.entries(file.table)) {
      this.entries.set(code, candidates)
      for (const char of candidates) {
        const codes = this.reverse.get(char)
        if (codes) codes.push(code)
        else this.reverse.set(char, [code])
      }
    }
    this.sortedCodes = [...this.entries.keys()].sort()
  }

  /** Treat returned arrays as read-only; the indexes are shared across sessions. */
  lookup(code: string): string[] {
    return this.entries.get(code.toLowerCase()) ?? []
  }

  codesOf(char: string): string[] {
    return this.reverse.get(char) ?? []
  }

  /** Quick-code slots for a code (行列簡碼), or undefined. */
  shortcode(code: string): string[] | undefined {
    return this.file.shortcodes?.[code.toLowerCase()]
  }

  /** Where `char` sits in the quick-code table. */
  shortcodesOf(char: string): { code: string; index: number }[] {
    return this.shortReverse.get(char) ?? []
  }

  /** Return matching *codes*, in lexical order, starting at a binary-search lower bound. */
  prefix(code: string, limit = 10): string[] {
    if (limit <= 0 || Number.isNaN(limit)) return []
    const query = code.toLowerCase()
    const result: string[] = []
    let index = this.lowerBound(query)
    while (index < this.sortedCodes.length && result.length < limit) {
      const match = this.sortedCodes[index]!
      if (!match.startsWith(query)) break
      result.push(match)
      index++
    }
    return result
  }

  hasPrefix(code: string): boolean {
    const query = code.toLowerCase()
    return this.sortedCodes[this.lowerBound(query)]?.startsWith(query) ?? false
  }

  private lowerBound(code: string): number {
    let lo = 0
    let hi = this.sortedCodes.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (this.sortedCodes[mid]! < code) lo = mid + 1
      else hi = mid
    }
    return lo
  }
}

/** Bounded, deduplicated preview; selection is always based on exact lookup instead. */
export function prefixCandidates(table: ImTable, code: string, limit = 10): string[] {
  if (!code || limit <= 0) return []
  const seen = new Set<string>()
  for (const match of table.prefix(code, limit)) {
    for (const char of table.lookup(match)) {
      seen.add(char)
      if (seen.size >= limit) return [...seen]
    }
  }
  return [...seen]
}
