import { toImKey } from './keyboard'
import type {
  CharKind, Composer, KeyInput, ReadingCtx, SessionEvent, SessionOptions,
  SessionResult, SessionState, TypingSessionApi,
} from './types'

/** Code-point classification, including supplementary Han and compatibility ideographs. */
export function classifyChar(ch: string): CharKind {
  if (/^[\r\n\u0085\u2028\u2029]$/u.test(ch)) return 'newline'
  if (/^\s$/u.test(ch)) return 'space'
  if (/^[\p{Unified_Ideograph}\uf900-\ufaff\u{2f800}-\u{2fa1f}〇]$/u.test(ch)) return 'cjk'
  if (/^[a-zA-Z0-9Ａ-Ｚａ-ｚ０-９]$/u.test(ch)) return 'latin'
  // The contract has no "other" kind: symbols and emoji follow punctuation policy too.
  return 'punct'
}

function isModifier(input: KeyInput): boolean {
  return /^(Shift|Control|Alt|Meta)(Left|Right)?$/.test(input.code)
    || ['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock', 'NumLock', 'ScrollLock', 'Fn'].includes(input.key)
}

export class TypingSession implements TypingSessionApi {
  readonly state: SessionState
  private readonly composer: Composer
  private readonly clock: { pausedTotal: number; pausedAt?: number }
  /** CJK cells the current IM cannot type (not in its table): skipped with any key, not scored. */
  private readonly untypeable = new Set<number>()

  constructor(private readonly opts: SessionOptions) {
    const wrap = opts.wrap ?? (<T extends object>(value: T): T => value)
    // Only the composer's STATE is observable; the composer and its (huge) tables stay raw so
    // lookups never go through reactive proxies.
    this.composer = opts.im.createComposer()
    Object.defineProperty(this.composer, 'state', { value: wrap(this.composer.state), writable: false })
    this.clock = wrap({ pausedTotal: 0, pausedAt: undefined })
    const expected = opts.im.annotate?.(opts.text)
    const cells = [...opts.text].map((char, index) => ({
      index, char, kind: classifyChar(char), status: 'pending' as const,
      errors: 0, hinted: false, expected: expected?.[index],
    }))
    const typeable = new Map<string, boolean>()
    for (const cell of cells) {
      if (cell.kind !== 'cjk') continue
      let ok = typeable.get(cell.char)
      if (ok === undefined) typeable.set(cell.char, ok = opts.im.codesFor(cell.char).length > 0)
      if (!ok) this.untypeable.add(cell.index)
    }
    this.state = wrap<SessionState>({
      cells, cursor: 0, composer: this.composer.state,
      hint: { open: false, cellIndex: -1 }, paused: false,
      stats: {
        done: 0, total: cells.filter((cell) => cell.kind === 'cjk' && !this.untypeable.has(cell.index)).length,
        errors: 0, hinted: 0, cpm: 0, accuracy: 1, combo: 0, maxCombo: 0, elapsedMs: 0,
      },
      errorKeys: {}, timeline: [],
    })
    this.advance([])
    if (this.state.cursor === cells.length) this.state.finishedAt = 0
  }

  handle(input: KeyInput, now: number): SessionEvent[] {
    if (this.state.paused || this.state.finishedAt !== undefined) return []
    if (input.ctrlKey || input.metaKey || input.altKey || isModifier(input)) return []
    const events = this.tick(now)
    if (this.state.finishedAt !== undefined) return events
    const cell = this.state.cells[this.state.cursor]
    if (!cell) return events
    const context = this.context()
    const anyKey = cell.kind === 'latin' || this.untypeable.has(cell.index) || (cell.kind === 'punct'
      && (this.opts.punctMode === 'any-key' || !this.opts.im.codesFor(cell.char, context).length))
    if (anyKey && !this.state.composer.buffer) {
      this.start(now, events)
      cell.status = 'skipped'
      events.push({ type: 'skip', cellIndex: cell.index })
      this.closeHint()
      this.state.cursor++
      this.advance(events)
      this.refresh(now)
      if (this.state.cursor === this.state.cells.length) this.finish(now, events)
      return events
    }
    const key = toImKey(input)
    const result = this.composer.handle(key, input)
    if (result.type === 'ignored') return events
    this.start(now, events)
    this.refresh(now)
    if (result.type === 'update') return events
    const correct = result.type === 'commit' && (result.index === -1
      ? result.candidates.includes(cell.char)
      : result.candidates[result.index] === cell.char)
    this.composer.reset()
    if (correct) {
      cell.status = 'done'
      cell.doneAt = this.state.stats.elapsedMs
      if (cell.kind === 'cjk') this.state.stats.done++
      this.state.stats.combo++
      this.state.stats.maxCombo = Math.max(this.state.stats.maxCombo, this.state.stats.combo)
      this.closeHint()
      events.push({ type: 'correct', cellIndex: cell.index, char: cell.char })
      this.state.cursor++
      this.advance(events)
      this.state.timeline.push({
        t: this.state.stats.elapsedMs, done: this.state.stats.done, errors: this.state.stats.errors,
      })
      this.refresh(now)
      if (this.state.cursor === this.state.cells.length) this.finish(now, events)
    } else {
      cell.errors++
      this.state.stats.errors++
      this.state.stats.combo = 0
      const best = this.opts.im.codesFor(cell.char, context)[0]?.code ?? ''
      const divergentKey = [...result.code].find((part, index) => part !== best[index])
      const errorKey = divergentKey ?? (result.commitKey === ' ' ? result.code.at(-1) : result.commitKey) ?? result.commitKey
      this.state.errorKeys[errorKey] = (this.state.errorKeys[errorKey] ?? 0) + 1
      events.push({
        type: 'error', cellIndex: cell.index, expected: cell.char, code: result.code,
        got: result.type === 'commit' ? result.candidates[Math.max(0, result.index)] ?? '' : '',
      })
      this.refresh(now)
      if (this.opts.hintsEnabled && cell.errors >= (this.opts.hintThreshold ?? 3)) this.openHint('errors', events)
    }
    return events
  }

  peekHint(now: number): SessionEvent[] {
    if (this.state.paused || this.state.finishedAt !== undefined || !this.opts.hintsEnabled) return []
    const events = this.tick(now)
    if (this.state.finishedAt === undefined) this.openHint('peek', events)
    return events
  }

  closeHint(): void {
    this.state.hint.open = false
    this.state.hint.cellIndex = -1
    this.state.hint.card = undefined
    this.state.hint.reason = undefined
  }

  pause(now: number): void {
    if (this.state.paused || this.state.finishedAt !== undefined) return
    this.refresh(now)
    this.clock.pausedAt = now
    this.state.paused = true
  }

  resume(now: number): void {
    if (!this.state.paused || this.state.finishedAt !== undefined) return
    if (this.state.startedAt !== undefined && this.clock.pausedAt !== undefined) {
      this.clock.pausedTotal += Math.max(0, now - this.clock.pausedAt)
    }
    this.clock.pausedAt = undefined
    this.state.paused = false
    this.refresh(now)
  }

  tick(now: number): SessionEvent[] {
    if (this.state.paused || this.state.finishedAt !== undefined) return []
    this.refresh(now)
    const events: SessionEvent[] = []
    if (this.state.startedAt !== undefined && this.opts.timeLimitMs !== undefined
      && this.state.stats.elapsedMs >= this.opts.timeLimitMs) {
      this.finish(now, events)
    }
    return events
  }

  result(): SessionResult {
    const { stats } = this.state
    const weakChars: Record<string, number> = {}
    for (const cell of this.state.cells) {
      if (cell.errors) weakChars[cell.char] = (weakChars[cell.char] ?? 0) + cell.errors
    }
    return {
      im: this.opts.im.id, durationMs: stats.elapsedMs, done: stats.done, total: stats.total,
      errors: stats.errors, hinted: stats.hinted, cpm: stats.cpm, accuracy: stats.accuracy,
      maxCombo: stats.maxCombo, weakChars, errorKeys: { ...this.state.errorKeys },
      timeline: this.state.timeline.map((sample) => ({ ...sample })),
    }
  }

  private context(): ReadingCtx {
    return { text: this.opts.text, index: this.state.cursor, expected: this.state.cells[this.state.cursor]?.expected }
  }

  private start(now: number, events: SessionEvent[]): void {
    if (this.state.startedAt !== undefined) return
    this.state.startedAt = now
    events.push({ type: 'start' })
  }

  private advance(events: SessionEvent[]): void {
    let cell = this.state.cells[this.state.cursor]
    while (cell && (cell.kind === 'space' || cell.kind === 'newline'
      || (this.opts.punctMode === 'skip' && (cell.kind === 'punct' || cell.kind === 'latin')))) {
      cell.status = 'skipped'
      events.push({ type: 'skip', cellIndex: cell.index })
      this.state.cursor++
      cell = this.state.cells[this.state.cursor]
    }
    if (cell) cell.status = 'current'
  }

  private openHint(reason: 'errors' | 'peek', events: SessionEvent[]): void {
    const cell = this.state.cells[this.state.cursor]
    if (!cell) return
    if (!cell.hinted) {
      cell.hinted = true
      this.state.stats.hinted++
    }
    this.state.hint.open = true
    this.state.hint.cellIndex = cell.index
    this.state.hint.card = this.opts.im.explain(cell.char, this.context())
    this.state.hint.reason = reason
    events.push({ type: 'hint', cellIndex: cell.index, reason })
  }

  private refresh(now: number): void {
    const { stats, startedAt } = this.state
    const end = this.state.finishedAt ?? (this.state.paused ? this.clock.pausedAt : now) ?? now
    const elapsed = startedAt === undefined ? 0 : Math.max(0, end - startedAt - this.clock.pausedTotal)
    stats.elapsedMs = this.opts.timeLimitMs === undefined ? elapsed : Math.min(elapsed, Math.max(0, this.opts.timeLimitMs))
    stats.cpm = stats.elapsedMs < 1000 ? 0 : stats.done * 60_000 / stats.elapsedMs
    stats.accuracy = stats.done + stats.errors ? stats.done / (stats.done + stats.errors) : 1
  }

  private finish(now: number, events: SessionEvent[]): void {
    if (this.state.finishedAt !== undefined) return
    const cell = this.state.cells[this.state.cursor]
    if (cell?.status === 'current') cell.status = 'pending'
    this.state.cursor = this.state.cells.length
    this.state.finishedAt = now
    this.composer.reset()
    this.closeHint()
    this.refresh(now)
    events.push({ type: 'finish' })
  }
}
