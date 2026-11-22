import { TONE_KEYS } from './engines/zhuyin'
import { ImTable } from './table'
import type { ImTableFile } from './types'

/** Phrase codes are per Unicode code point, in Dachen keys (first tone has no suffix). */
export interface ZhuyinPhraseFile {
  phrases: Record<string, string[]>
  /** Most common reading of each heteronym (破音字), used outside known phrases. */
  defaults?: Record<string, string>
}

interface PhraseNode {
  children: Map<string, PhraseNode>
  codes?: string[]
}

function phraseTrie(phrases: ZhuyinPhraseFile): PhraseNode {
  const root: PhraseNode = { children: new Map() }
  for (const [phrase, codes] of Object.entries(phrases.phrases)) {
    const chars = [...phrase]
    if (!chars.length || chars.length !== codes.length) continue
    let node = root
    for (const char of chars) {
      let child = node.children.get(char)
      if (!child) node.children.set(char, child = { children: new Map() })
      node = child
    }
    node.codes = codes.map((code) => code.toLowerCase())
  }
  return root
}

/** Inject the character table once, then annotate(text, phrases?) without global data. */
export class ZhuyinReading {
  readonly table: ImTable
  private readonly tries = new WeakMap<ZhuyinPhraseFile, PhraseNode>()

  constructor(table: ImTable | ImTableFile, private readonly phrases?: ZhuyinPhraseFile) {
    this.table = table instanceof ImTable ? table : new ImTable(table)
  }

  /** Default reading of a char: the dictionary's most common reading, else the first. */
  defaultCode(char: string, phrases = this.phrases): string | undefined {
    return phrases?.defaults?.[char] ?? this.table.codesOf(char)[0]
  }

  annotate(text: string, phrases = this.phrases): (string | undefined)[] {
    const chars = [...text]
    const result = chars.map((char) => this.defaultCode(char, phrases))
    if (!phrases) return result
    let root = this.tries.get(phrases)
    if (!root) this.tries.set(phrases, root = phraseTrie(phrases))
    for (let i = 0; i < chars.length;) {
      let node = root
      let match: string[] | undefined
      for (let j = i; j < chars.length; j++) {
        const next = node.children.get(chars[j]!)
        if (!next) break
        node = next
        if (node.codes) match = node.codes
      }
      if (match) {
        for (let offset = 0; offset < match.length; offset++) result[i + offset] = match[offset]
        i += match.length
      } else i++
    }
    return result
  }
}

export function createZhuyinAnnotator(table: ImTable | ImTableFile, phrases?: ZhuyinPhraseFile) {
  const reader = new ZhuyinReading(table, phrases)
  return (text: string, overrides?: ZhuyinPhraseFile): (string | undefined)[] => reader.annotate(text, overrides)
}

/** Tone always follows the syllable; first tone has no visible mark. */
export function readingLabel(code: string, keynames: Record<string, string>): string {
  const keys = [...code.toLowerCase()].filter((key) => key !== ' ')
  return [...keys.filter((key) => !TONE_KEYS.has(key)), ...keys.filter((key) => TONE_KEYS.has(key))]
    .map((key) => keynames[key] ?? key).join('')
}
