import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { decompositionLines } from '../src/core/decomp-text'
import { loadInputMethod } from '../src/core/load'
import type { DecompEntry, DecompFile, ImTableFile, RootsFile } from '../src/core/types'
import { parse, resolve, rootIndex, takingPlans, validEntry } from './lib/decomp'
import type { Aliases, Cut } from './lib/decomp'

const read = <T>(path: string) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')) as T
const ims = ['boshiamy', 'array', 'dayi', 'cangjie'] as const
const files = Object.fromEntries(ims.map(im => [im, read<DecompFile>(`public/data/decomp/${im}.json`)])) as Record<typeof ims[number], DecompFile>
const golden = (im: typeof ims[number], char: string, code: string): DecompEntry => {
  const e = files[im][char]?.find(e => e.code === code)
  expect(e, `${im} ${char}=${code}`).toBeDefined()
  return e!
}

describe('generated decomposition integrity', () => {
  for (const im of ims) it(`${im}: every picked sequence is an actual table code; all parts have root evidence`, () => {
    const table = read<ImTableFile>(`public/data/im/${im}.json`)
    const aliases = read<Aliases>(`data-raw/decomp/aliases-${im}.json`)
    const ix = rootIndex(read<RootsFile>(`public/data/roots/${im}.json`), aliases)
    for (const [char, entries] of Object.entries(files[im])) for (const e of entries) {
      const label = `${im} ${char}/${e.code}`
      expect(e.picked.map(i => e.parts[i]?.key).join(''), label).toBe(e.code)
      expect(table.table[e.code], label).toContain(char)
      expect(e.roles.length, label).toBe(e.picked.length)
      expect(new Set(e.picked).size, label).toBe(e.picked.length)
      for (const p of e.parts) expect(ix.keysOf.get(p.component)?.has(p.key), `${label}: ${p.component}/${p.key}`).toBe(true)
      expect(e.parts.every(p => !/[\uE000-\uF8FF\u{F0000}-\u{10FFFF}]/u.test(p.component)), label).toBe(true)
    }
    expect(readFileSync(new URL(`../public/data/decomp/${im}.json`, import.meta.url)).length).toBeLessThan(1_500_000)
  })

  it('keeps the cangjie head/body boundaries and difficult shape in 謝', () => {
    const ming = golden('cangjie', '明', 'ab')
    expect(ming.parts.map(p => p.component).join('')).toBe('日月')
    expect(ming.roles).toEqual(['字首', '字身'])
    const xie = golden('cangjie', '謝', 'yrhhi')
    expect(xie.parts.filter(p => p.group === '言').map(p => p.component).join('')).toBe('卜一一口')
    expect(xie.picked.map(i => xie.parts[i]!.key).join('')).toBe('yrhhi')
    expect(xie.parts.some(p => p.component === '身難形' && p.key === 'x')).toBe(true)
    expect(decompositionLines('cangjie', '謝', xie).join('')).toContain('作字首取首尾 Y、R')
    const zhe = golden('cangjie', '這', 'yymr')
    expect(zhe.roles).toEqual(['字首', '字身首', '字身次', '字身尾'])
    expect(zhe.picked.map(i => zhe.parts[i]!.component).join('')).toBe('辶卜一口')
  })

  it('handles boshiamy full roots and a supported supplement', () => {
    const beng = golden('boshiamy', '崩', 'euu')
    expect(beng.parts.map(p => p.component).join('')).toBe('山月月')
    const ming = golden('boshiamy', '明', 'due')
    expect(ming.roles).toEqual(['首', '次', '補'])
    expect(ming.parts[ming.picked[2]!]!.component).toBe('一')
    expect(decompositionLines('boshiamy', '明', ming).join('')).toContain('補碼 E')
  })

  it('expands 相 for 想 without taking a component supplement', () => {
    for (const [im, code] of [['array', 'vjn'], ['dayi', 'i3z']] as const) {
      const e = golden(im, '想', code)
      expect(e.parts.map(p => p.component).join('')).toBe('木目心')
      expect(e.picked).toEqual([0, 1, 2])
    }
  })

  it('loads compact enrichment and shows generated explanations in the actual hint-card path', async () => {
    const im = await loadInputMethod('cangjie', {
      base: '/',
      fetchJson: async path => {
        if (path === '/data/im/cangjie.json') return read<ImTableFile>('public/data/im/cangjie.json')
        if (path === '/data/im/zhuyin.json') return read<ImTableFile>('public/data/im/zhuyin.json')
        if (path === '/data/roots/cangjie.json') return read<RootsFile>('public/data/roots/cangjie.json')
        if (path === '/data/decomp/cangjie.json') return files.cangjie
        throw Error('Optional data absent')
      },
    })
    const card = im.explain('謝')
    expect(card.decomposition?.verified).toBe(true)
    expect(card.decomposition?.parts.every(p => !!p.root)).toBe(true)
    expect(card.decomposition?.explanation.join('')).toContain('字首')
    expect(card.decomposition?.explanation.join('')).toContain('字身')
  })
})

describe('taking and validation gates (also used for manual entries)', () => {
  const parts = (n: number) => Array.from({ length: n }, () => ({ component: '一' }))
  it('uses 前三後一, 大易首次尾, and connected cangjie 首次三尾', () => {
    const cut = { parts: parts(6) }
    expect(takingPlans('array', cut, 4)[0]!.picked).toEqual([0, 1, 2, 5])
    expect(takingPlans('dayi', cut, 3)[0]!.picked).toEqual([0, 1, 5])
    expect(takingPlans('dayi', cut, 4)[0]!.picked).toEqual([0, 1, 2, 5])
    expect(takingPlans('cangjie', cut, 4)[0]!.picked).toEqual([0, 1, 2, 5])
  })
  it('truncates a divisible body separately (謝), retaining omitted roots', () => {
    const cut: Cut = { parts: parts(9), split: 4, bodySplit: 3 }
    expect(takingPlans('cangjie', cut, 5)[0]!.picked).toEqual([0, 3, 4, 6, 8])
    expect(takingPlans('cangjie', { parts: parts(9), split: 4 }, 5)[0]!.picked).toEqual([0, 3, 4, 5, 8])
    // A short body is never abbreviated, even if its IDS can be split again (國).
    expect(takingPlans('cangjie', { parts: parts(4), split: 1, bodySplit: 1 }, 4)[0]!.picked).toEqual([0, 1, 2, 3])
    // A one-root first body component leaves two slots for the remaining body.
    expect(takingPlans('cangjie', { parts: parts(5), split: 1, bodySplit: 1 }, 4)[0]!.picked).toEqual([0, 1, 2, 4])
  })
  it('rejects roots, key strings, indexes and roles that lack the same evidence', () => {
    const roots = read<RootsFile>('public/data/roots/cangjie.json')
    const ix = rootIndex(roots, read<Aliases>('data-raw/decomp/aliases-cangjie.json'))
    const cut: Cut = { parts: [{ component: '日' }, { component: '月' }], split: 1 }
    const plans = takingPlans('cangjie', cut, 2)
    const entry = resolve(cut, plans[0]!, 'ab', ix)!
    const table = { ab: ['明'] }
    expect(validEntry(entry, 'cangjie', '明', table, ix, plans)).toBe(true)
    for (const bad of [
      { ...entry, code: 'aa' },
      { ...entry, picked: [0, 0] },
      { ...entry, roles: ['首', '次'] },
      { ...entry, parts: [{ component: '未知', key: 'a' }, entry.parts[1]!] },
    ]) expect(validEntry(bad, 'cangjie', '明', table, ix, plans)).toBe(false)
    expect(validEntry(entry, 'cangjie', '朋', table, ix, plans)).toBe(false)
    expect(ix.keysOf.get('未知難形')).toBeUndefined()
  })
  it('does not merge different positional boshiamy keys or unrelated shapes', () => {
    const ix = rootIndex(read<RootsFile>('public/data/roots/boshiamy.json'), read<Aliases>('data-raw/decomp/aliases-boshiamy.json'))
    expect([...ix.keysOf.get('亻')!]).toEqual(['p'])
    expect([...ix.keysOf.get('𠆢')!]).toEqual(['b'])
    expect(parse('⿰日月')).toEqual({ idc: '⿰', kids: ['日', '月'] })
    expect(parse('⿰日&unknown;')).toBeNull()
  })
})
