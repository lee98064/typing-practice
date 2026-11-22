import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { cinToTableFile } from './cin'
import { createInputMethod } from './im'
import { classifyChar, TypingSession } from './session'
import type { ImTableFile, KeyInput, PunctMode, RootsFile, SessionEvent, SessionOptions } from './types'

const table = cinToTableFile(readFileSync(new URL('../../data-raw/boshiamy/boshiamy.cin', import.meta.url), 'utf8'), {
  id: 'boshiamy', maxCodeLength: 5, selKeys: '0123456789',
})
function rootsFor(file: ImTableFile): RootsFile {
  return { im: file.meta.id, keys: Object.entries(file.keynames).map(([key, label]) => ({ key, label, roots: [label] })), rules: [] }
}
const im = createInputMethod({ table, roots: rootsFor(table) })
function session(text = '明的，我。', options: Partial<SessionOptions> = {}) {
  return new TypingSession({ im, text, punctMode: 'skip', hintThreshold: 2, hintsEnabled: true, ...options })
}
function input(key: string, overrides: Partial<KeyInput> = {}): KeyInput {
  const punctuation: Record<string, string> = { ' ': 'Space', ',': 'Comma', '.': 'Period', ';': 'Semicolon', '/': 'Slash', '-': 'Minus' }
  const code = punctuation[key] ?? (/^[a-z]$/.test(key) ? `Key${key.toUpperCase()}` : /^\d$/.test(key) ? `Digit${key}` : key)
  return { code, key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, ...overrides }
}
function feed(target: TypingSession, keys: string, start = 0, step = 100): SessionEvent[] {
  return [...keys].flatMap((key, index) => target.handle(input(key), start + index * step))
}

describe('character classification', () => {
  it('classifies all required Han blocks, punctuation, Latin and whitespace by code point', () => {
    for (const char of ['中', '〇', '\u3400', '\uf900', '\u{20000}', '\u{2a700}', '\u{2b740}', '\u{2b820}', '\u{2ceb0}', '\u{30000}', '\u{2f800}']) {
      expect(classifyChar(char), char).toBe('cjk')
    }
    for (const char of ['，', '。', '「', '」', '—', '…', '！', '!', '[', '\\', '`', '🙂']) expect(classifyChar(char)).toBe('punct')
    for (const char of ['A', 'z', '0', 'Ａ', 'ｚ', '９']) expect(classifyChar(char)).toBe('latin')
    for (const char of [' ', '\t', '　']) expect(classifyChar(char)).toBe('space')
    for (const char of ['\n', '\r', '\u2028']) expect(classifyChar(char)).toBe('newline')
  })
})

describe('TypingSession', () => {
  it.each(['skip', 'any-key', 'ime'] as PunctMode[])('types 明的，我。 using punctuation mode %s', (punctMode) => {
    const target = session('明的，我。', { punctMode })
    const events: SessionEvent[] = []
    let now = 0
    const press = (key: string) => {
      events.push(...target.handle(input(key), now))
      now += 1000
    }
    while (target.state.finishedAt === undefined) {
      const cell = target.state.cells[target.state.cursor]!
      if (cell.kind === 'punct' && punctMode === 'any-key') press('ArrowRight')
      else {
        const option = im.codesFor(cell.char)[0]!
        for (const key of option.code) press(key)
        press(option.selectionKey ?? ' ')
      }
    }
    expect(target.state.stats).toMatchObject({ done: 3, total: 3, errors: 0, hinted: 0, accuracy: 1, elapsedMs: now - 1000 })
    expect(target.state.cells.filter((cell) => cell.kind === 'punct').map((cell) => cell.status))
      .toEqual(punctMode === 'ime' ? ['done', 'done'] : ['skipped', 'skipped'])
    expect(events.filter((event) => event.type === 'start')).toHaveLength(1)
    expect(events.at(-1)).toEqual({ type: 'finish' })
    expect(events.filter((event) => event.type === 'finish')).toHaveLength(1)
    const result = target.result()
    expect(result).toMatchObject({ im: 'boshiamy', done: 3, total: 3, errors: 0, hinted: 0, accuracy: 1, weakChars: {}, errorKeys: {} })
    expect(result.cpm).toBeCloseTo(3 * 60_000 / result.durationMs)
    expect(result.timeline).toHaveLength(punctMode === 'ime' ? 5 : 3)
    expect(target.handle(input('a'), now)).toEqual([])
  })

  it('opens a threshold hint with the primary code and records divergent keys only once per mistake', () => {
    const target = session('明')
    expect(feed(target, 'dx ')).toMatchObject([{ type: 'start' }, { type: 'error', expected: '明', code: 'dx' }])
    expect(target.state.hint.open).toBe(false)
    expect(feed(target, 'dx ', 1000).at(-1)).toEqual({ type: 'hint', cellIndex: 0, reason: 'errors' })
    expect(target.state.hint.card?.options[0]?.code).toBe('due')
    expect(target.state.stats).toMatchObject({ errors: 2, hinted: 1, combo: 0, accuracy: 0 })
    expect(target.state.errorKeys).toEqual({ x: 2 })
    target.closeHint()
    expect(target.state.hint.open).toBe(false)
    expect(target.peekHint(1400)).toEqual([{ type: 'hint', cellIndex: 0, reason: 'peek' }])
    expect(target.state.stats.hinted).toBe(1)
    feed(target, 'due ', 2000)
    expect(target.state.hint.open).toBe(false)
    expect(target.state.cells[0]).toMatchObject({ hinted: true, errors: 2, status: 'done', doneAt: 2300 })
    const result = target.result()
    expect(result).toMatchObject({ durationMs: 2300, done: 1, total: 1, errors: 2, hinted: 1, maxCombo: 1, weakChars: { 明: 2 } })
    expect(result.accuracy).toBeCloseTo(1 / 3)
    expect(result.cpm).toBeCloseTo(60_000 / 2300)
    result.errorKeys.x = 99
    result.timeline[0]!.done = 99
    expect(target.state.errorKeys.x).toBe(2)
    expect(target.state.timeline[0]?.done).toBe(1)
  })

  it('supports peek before typing, disabled hints and empty sessions', () => {
    const target = session('的')
    expect(target.peekHint(100)).toEqual([{ type: 'hint', cellIndex: 0, reason: 'peek' }])
    expect(target.state.startedAt).toBeUndefined()
    expect(target.state.hint.reason).toBe('peek')
    expect(target.state.hint.card?.options[0]?.code).toBe('d')
    expect(target.peekHint(200)).toHaveLength(1)
    expect(target.state.stats.hinted).toBe(1)
    const disabled = session('明', { hintsEnabled: false, hintThreshold: 1 })
    expect(disabled.peekHint(0)).toEqual([])
    feed(disabled, 'd ')
    expect(disabled.state.stats.hinted).toBe(0)
    expect(disabled.state.hint.open).toBe(false)
    const empty = session(' \nA，')
    expect(empty.state.cells.every((cell) => cell.status === 'skipped')).toBe(true)
    expect(empty.state.finishedAt).toBe(0)
    expect(empty.handle(input('a'), 100)).toEqual([])
    expect(empty.result()).toMatchObject({ done: 0, total: 0, durationMs: 0, cpm: 0, accuracy: 1 })
  })

  it('excludes paused time even when the first handled key has timestamp zero', () => {
    const target = session('明')
    feed(target, 'du', 0)
    target.pause(300)
    expect(target.state.stats.elapsedMs).toBe(300)
    expect(target.handle(input('e'), 1000)).toEqual([])
    expect(target.tick(2000)).toEqual([])
    expect(target.peekHint(2000)).toEqual([])
    target.resume(5300)
    feed(target, 'e ', 5400)
    expect(target.state.startedAt).toBe(0)
    expect(target.state.stats.elapsedMs).toBe(500)
    expect(target.state.cells[0]?.doneAt).toBe(500)
    expect(target.state.stats.cpm).toBe(0)
  })

  it('finishes at the active time limit and ignores subsequent keys and timer ticks', () => {
    const target = session('明的', { timeLimitMs: 1000 })
    expect(target.tick(9999)).toEqual([]) // no handled key yet
    expect(target.handle(input('d'), 100)).toEqual([{ type: 'start' }])
    target.pause(300)
    target.resume(2300)
    expect(target.tick(3099)).toEqual([])
    expect(target.tick(3200)).toEqual([{ type: 'finish' }])
    expect(target.state.finishedAt).toBe(3200)
    expect(target.state.cursor).toBe(2)
    expect(target.result()).toMatchObject({ durationMs: 1000, done: 0, total: 2, errors: 0 })
    expect(target.state.composer.buffer).toBe('')
    expect(target.tick(5000)).toEqual([])
    expect(target.handle(input('e'), 5000)).toEqual([])
  })

  it('ignores chords and modifier keys; punctuation without an IM code and Latin use any-key', () => {
    const target = session(' \n🙂Ａ明', { punctMode: 'ime' })
    expect(target.state.cursor).toBe(2)
    for (const event of [input('a', { ctrlKey: true }), input('a', { metaKey: true }), input('a', { altKey: true }), input('Shift', { code: 'ShiftLeft' })]) {
      expect(target.handle(event, 0)).toEqual([])
    }
    expect(target.state.startedAt).toBeUndefined()
    expect(target.handle(input('ArrowRight'), 100)).toEqual([{ type: 'start' }, { type: 'skip', cellIndex: 2 }])
    expect(target.handle(input('Backspace'), 200)).toEqual([{ type: 'skip', cellIndex: 3 }])
    expect(target.state.cursor).toBe(4)
    expect(target.state.composer.buffer).toBe('')
    expect(target.handle(input('ArrowRight'), 300)).toEqual([])
    expect(target.state.stats.done).toBe(0)
  })

  it('judges a selected candidate, resets combos and records a wrong selection key', () => {
    const target = session('的龘')
    feed(target, 'd ')
    expect(target.state.stats.combo).toBe(1)
    feed(target, 'aaa0', 1000)
    expect(target.state.stats).toMatchObject({ combo: 0, maxCombo: 1, done: 1, errors: 1 })
    expect(target.state.errorKeys).toEqual({ '0': 1 })
    feed(target, 'aaa1', 2000)
    expect(target.result()).toMatchObject({ done: 2, errors: 1, maxCombo: 1, weakChars: { 龘: 1 } })
  })

  it('stores per-code-point expected readings and accepts smart Zhuyin commits', () => {
    const zhuyin = cinToTableFile(readFileSync(new URL('../../data-raw/boshiamy/bopomofo.cin', import.meta.url), 'utf8'), { id: 'zhuyin' })
    const phonetic = createInputMethod({ table: zhuyin, roots: rootsFor(zhuyin), zhuyin: { table: zhuyin, phrases: { phrases: { 銀行: ['up6', 'c;6'] } } } })
    const target = session('銀行', { im: phonetic })
    expect(target.state.cells.map((cell) => cell.expected)).toEqual(['up6', 'c;6'])
    feed(target, 'up6c;6')
    expect(target.result()).toMatchObject({ done: 2, total: 2, errors: 0 })
    expect(target.state.finishedAt).toBe(500)
  })

  it('mutates composer, cells, hints, statistics and clock through the supplied wrapper', () => {
    const writes = new Set<PropertyKey>()
    const proxies = new WeakMap<object, object>()
    const wrap = <T extends object>(value: T): T => {
      if (value instanceof Map || value instanceof Set) return value
      const known = proxies.get(value)
      if (known) return known as T
      const proxy = new Proxy(value, {
        get(target, key, receiver): unknown {
          const child: unknown = Reflect.get(target, key, receiver)
          return child !== null && typeof child === 'object' ? wrap(child) : child
        },
        set(target, key, next: unknown, receiver): boolean {
          writes.add(key)
          return Reflect.set(target, key, next, receiver)
        },
      })
      proxies.set(value, proxy)
      proxies.set(proxy, proxy)
      return proxy
    }
    const target = session('明', { wrap })
    target.handle(input('d'), 0)
    target.pause(100)
    target.resume(200)
    target.peekHint(300)
    feed(target, 'ue ', 400)
    for (const key of ['buffer', 'preedit', 'candidates', 'status', 'elapsedMs', 'pausedAt', 'pausedTotal', 'open', 'done']) expect(writes.has(key), key).toBe(true)
    expect(target.state.composer.buffer).toBe('')
    expect(target.state.stats.done).toBe(1)
  })
})
