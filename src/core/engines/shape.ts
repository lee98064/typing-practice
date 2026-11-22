import { ImTable, prefixCandidates } from '../table'
import type { Composer, ComposerState, ComposeResult, ImMeta, KeyInput } from '../types'

/** Terminal results retain preedit until reset(), allowing callers to inspect the attempt. */
export class ShapeComposer implements Composer {
  readonly state: ComposerState = { buffer: '', preedit: [], candidates: [], exact: false }
  private readonly compositionKeys: ReadonlySet<string>

  constructor(
    private readonly table: ImTable,
    private readonly meta: ImMeta = table.file.meta,
    compositionKeys: Iterable<string> = Object.keys(table.file.keynames),
  ) {
    this.compositionKeys = new Set(compositionKeys)
  }

  handle(key: string | null, input: KeyInput): ComposeResult {
    if (input.ctrlKey || input.metaKey || input.altKey) return { type: 'ignored' }
    if (input.code === 'Backspace') {
      if (!this.state.buffer) return { type: 'ignored' }
      this.state.buffer = this.state.buffer.slice(0, -1)
      this.refresh()
      return { type: 'update' }
    }
    if (input.code === 'Escape') {
      if (!this.state.buffer) return { type: 'ignored' }
      this.reset()
      return { type: 'update' }
    }
    if (!key) return { type: 'ignored' }
    const { buffer } = this.state
    if (key === ' ' || this.meta.commitKeys.includes(key)) {
      if (!buffer) return { type: 'ignored' }
      const candidates = this.table.lookup(buffer)
      return candidates.length
        ? { type: 'commit', code: buffer, candidates, index: 0, commitKey: key }
        : { type: 'invalid', code: buffer, commitKey: key }
    }
    const selection = this.meta.selKeys.indexOf(key)
    const isComposition = this.compositionKeys.has(key)
    if (selection >= 0 && (!isComposition || buffer.length >= this.meta.maxCodeLength)) {
      if (!buffer) return { type: 'ignored' }
      const quick = this.table.shortcode(buffer)
      if (quick) {
        return quick[selection]
          ? { type: 'commit', code: buffer, candidates: quick, index: selection, commitKey: key }
          : { type: 'update' }
      }
      const candidates = this.table.lookup(buffer)
      return selection < candidates.length
        ? { type: 'commit', code: buffer, candidates, index: selection, commitKey: key }
        : { type: 'update' }
    }
    if (!isComposition) return { type: 'ignored' }
    if (buffer.length < this.meta.maxCodeLength) this.state.buffer += key
    this.refresh()
    return { type: 'update' }
  }

  reset(): void {
    this.state.buffer = ''
    this.refresh()
  }

  private refresh(): void {
    const { buffer } = this.state
    this.state.preedit = [...buffer].map((key) => ({ key, label: this.table.file.keynames[key] ?? key }))
    // 行列簡碼: 1–2 keys show the quick-code slots, picked with digits.
    const quick = buffer ? this.table.shortcode(buffer) : undefined
    if (quick) {
      this.state.candidates = quick
      this.state.exact = true
      return
    }
    const exact = buffer ? this.table.lookup(buffer) : []
    this.state.candidates = exact.length ? exact : prefixCandidates(this.table, buffer)
    this.state.exact = exact.length > 0
  }
}
