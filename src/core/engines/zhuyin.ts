import { ImTable, prefixCandidates } from '../table'
import type { Composer, ComposerState, ComposeResult, KeyInput } from '../types'

export const INITIAL_KEYS: ReadonlySet<string> = new Set('1qaz2wsxedcrfv5tgbyhn')
export const MEDIAL_KEYS: ReadonlySet<string> = new Set('ujm')
export const FINAL_KEYS: ReadonlySet<string> = new Set('8ik,9ol.0p;/-')
export const TONE_KEYS: ReadonlySet<string> = new Set('3467')

function category(key: string): number {
  if (INITIAL_KEYS.has(key)) return 0
  if (MEDIAL_KEYS.has(key)) return 1
  if (FINAL_KEYS.has(key)) return 2
  if (TONE_KEYS.has(key)) return 3
  return -1
}

/** Dachen categories replace one another; a tone (or first-tone space) commits immediately. */
export class ZhuyinComposer implements Composer {
  readonly state: ComposerState = { buffer: '', preedit: [], candidates: [], exact: false }

  constructor(private readonly table: ImTable) {}

  handle(key: string | null, input: KeyInput): ComposeResult {
    if (input.ctrlKey || input.metaKey || input.altKey) return { type: 'ignored' }
    if (input.code === 'Escape') {
      if (!this.state.buffer) return { type: 'ignored' }
      this.reset()
      return { type: 'update' }
    }
    if (input.code === 'Backspace') {
      if (!this.state.buffer) return { type: 'ignored' }
      // An exact first-tone query has no explicit tone character to remove.
      if (!this.state.exact || TONE_KEYS.has(this.state.buffer.at(-1)!)) {
        this.state.buffer = this.state.buffer.slice(0, -1)
      }
      this.refresh(false)
      return { type: 'update' }
    }
    if (!key) return { type: 'ignored' }
    const group = category(key)
    if (key === ' ' || group === 3) {
      const syllable = [...this.state.buffer].filter((part) => !TONE_KEYS.has(part)).join('')
      if (!syllable) return { type: 'ignored' }
      const code = syllable + (key === ' ' ? '' : key)
      this.state.buffer = code
      this.refresh(true)
      const candidates = this.table.lookup(code)
      return candidates.length
        ? { type: 'commit', code, candidates, index: -1, commitKey: key }
        : { type: 'invalid', code, commitKey: key }
    }
    if (group < 0) return { type: 'ignored' }
    this.state.buffer = [...this.state.buffer]
      .filter((part) => category(part) !== group && !TONE_KEYS.has(part))
      .concat(key)
      .sort((a, b) => category(a) - category(b))
      .join('')
    this.refresh(false)
    return { type: 'update' }
  }

  reset(): void {
    this.state.buffer = ''
    this.refresh(false)
  }

  private refresh(exact: boolean): void {
    const { buffer } = this.state
    this.state.preedit = [...buffer].map((key) => ({ key, label: this.table.file.keynames[key] ?? key }))
    this.state.candidates = exact ? this.table.lookup(buffer) : prefixCandidates(this.table, buffer)
    this.state.exact = exact
  }
}
