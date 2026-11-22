import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { cinToTableFile } from './cin'
import { ShapeComposer } from './engines/shape'
import { createInputMethod } from './im'
import { toImKey } from './keyboard'
import { ImTable } from './table'
import type { Composer, ImTableFile, KeyInput, RootsFile } from './types'
import { readingLabel, ZhuyinReading } from './zhuyin-reading'

const boshiamy = cinToTableFile(readFileSync(new URL('../../data-raw/boshiamy/boshiamy.cin', import.meta.url), 'utf8'), {
  id: 'boshiamy', maxCodeLength: 5, selKeys: '0123456789', selLabels: '0123456789', rule: '依字形、字音、字義取碼。',
})
const zhuyin = cinToTableFile(readFileSync(new URL('../../data-raw/boshiamy/bopomofo.cin', import.meta.url), 'utf8'), {
  id: 'zhuyin', maxCodeLength: 4, commitKeys: ' 3467',
})
function rootsFor(file: ImTableFile): RootsFile {
  return { im: file.meta.id, rules: [], keys: Object.entries(file.keynames).map(([key, label]) => ({ key, label, roots: [label], mnemonic: `${label} 的記憶法` })) }
}
const im = createInputMethod({ table: boshiamy, roots: rootsFor(boshiamy), zhuyin: { table: zhuyin } })
const phonetic = createInputMethod({ table: zhuyin, roots: rootsFor(zhuyin) })
function input(key: string): KeyInput {
  const code = key === ' ' ? 'Space' : /^[a-z]$/.test(key) ? `Key${key.toUpperCase()}` : /^\d$/.test(key) ? `Digit${key}` : key
  return { code, key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false }
}
function press(composer: Composer, key: string) {
  const event = input(key)
  return composer.handle(toImKey(event), event)
}
function type(composer: Composer, code: string) {
  for (const key of code) press(composer, key)
}

describe('real Boshiamy table', () => {
  it('finds 明, shortest 的 and real candidate suffix shortcuts', () => {
    expect(im.codesFor('明')[0]?.code).toBe('due')
    expect(im.codesFor('的')[0]).toMatchObject({ code: 'd', isShortest: true, selection: 0, selectionKey: undefined, tags: ['簡碼'] })
    expect(im.codesFor('的').find((option) => option.code === 'pdna')?.tags).toContain('完整碼')
    const dragon = im.codesFor('龘')
    expect(dragon[0]).toMatchObject({ code: 'aaa', selection: 1, selectionKey: '1' })
    expect(dragon.find((option) => option.code === 'aaav')?.tags).toContain('後綴選字')
    expect(dragon.findIndex((option) => option.code === 'aaav')).toBeGreaterThan(dragon.findIndex((option) => option.code === 'lull'))
  })

  it('commits exact candidates and candidate 1 using configured selection keys', () => {
    const composer = im.createComposer()
    expect(press(composer, ' ')).toEqual({ type: 'ignored' })
    expect(press(composer, '1')).toEqual({ type: 'ignored' })
    type(composer, 'due')
    expect(composer.state).toMatchObject({ buffer: 'due', exact: true, candidates: ['明'] })
    expect(press(composer, ' ')).toMatchObject({ type: 'commit', code: 'due', index: 0, candidates: ['明'] })
    composer.reset()
    type(composer, 'aaa')
    const selected = press(composer, '1')
    expect(selected.type).toBe('commit')
    if (selected.type === 'commit') expect(selected.candidates[selected.index]).toBe('龘')
    composer.reset()
    type(composer, 'aaav')
    expect(press(composer, ' ')).toMatchObject({ type: 'commit', candidates: ['龘'], index: 0 })
  })

  it('handles invalid attempts, previews, backspace, escape, chords and the five-key cap', () => {
    const composer = im.createComposer()
    expect(press(composer, 'Backspace')).toEqual({ type: 'ignored' })
    expect(press(composer, 'Escape')).toEqual({ type: 'ignored' })
    type(composer, 'du')
    expect(composer.state.candidates.length).toBeLessThanOrEqual(10)
    expect(press(composer, 'Backspace')).toEqual({ type: 'update' })
    expect(composer.state.buffer).toBe('d')
    const ctrl = { ...input('a'), ctrlKey: true }
    expect(composer.handle(toImKey(ctrl), ctrl)).toEqual({ type: 'ignored' })
    expect(composer.state.buffer).toBe('d')
    expect(press(composer, 'Escape')).toEqual({ type: 'update' })
    expect(composer.state.buffer).toBe('')
    type(composer, 'zzzzz')
    expect(press(composer, 'a')).toEqual({ type: 'update' })
    expect(composer.state.buffer).toBe('zzzzz')
    expect(press(composer, '9')).toEqual({ type: 'update' })
    expect(press(composer, ' ')).toEqual({ type: 'invalid', code: 'zzzzz', commitKey: ' ' })
  })

  it.each(['array', 'dayi', 'cangjie'] as const)('drives %s only from the table metadata and keynames', (id) => {
    const file: ImTableFile = {
      meta: { ...boshiamy.meta, id, maxCodeLength: 2, selKeys: 'ab1', selLabels: 'AB1' },
      keynames: { a: '根一', b: '根二' }, table: { a: ['甲', '乙'], ab: ['日', '月', '明'], bb: ['丙'] },
    }
    const composer = new ShapeComposer(new ImTable(file))
    type(composer, 'ab') // b is also a selection key, but composes until max length.
    expect(composer.state.buffer).toBe('ab')
    expect(press(composer, 'b')).toMatchObject({ type: 'commit', index: 1, code: 'ab' })
    composer.reset()
    type(composer, 'a')
    expect(press(composer, '1')).toEqual({ type: 'update' }) // nonexistent candidate does not corrupt preedit
    expect(composer.state.buffer).toBe('a')
    const generic = createInputMethod({ table: file, roots: rootsFor(file) })
    expect(generic.preedit('ab').map((part) => part.label)).toEqual(['根一', '根二'])
  })
})

describe('real Dachen Zhuyin table and readings', () => {
  it('finds 我 = ji3 and commits smart selection on a tone', () => {
    expect(phonetic.codesFor('我').some((option) => option.code === 'ji3')).toBe(true)
    const composer = phonetic.createComposer()
    type(composer, 'ji')
    expect(composer.state.exact).toBe(false)
    expect(composer.state.preedit.map((part) => part.label).join('')).toBe('ㄨㄛ')
    expect(press(composer, '3')).toMatchObject({ type: 'commit', code: 'ji3', index: -1, commitKey: '3' })
    expect(composer.state.candidates).toContain('我')
    expect(composer.state.exact).toBe(true)
    expect(press(composer, 'Backspace')).toEqual({ type: 'update' })
    expect(composer.state.buffer).toBe('ji')
    expect(composer.state.exact).toBe(false)
  })

  it('replaces each category and keeps canonical order regardless of typing order', () => {
    const composer = phonetic.createComposer()
    type(composer, '1q')
    expect(composer.state.buffer).toBe('q')
    composer.reset()
    type(composer, 'iju1q')
    expect(composer.state.buffer).toBe('qui')
    expect(composer.state.preedit.map((part) => part.label)).toEqual(['ㄆ', 'ㄧ', 'ㄛ'])
    type(composer, 'kl')
    expect(composer.state.buffer).toBe('qul')
    expect(press(composer, 'Escape')).toEqual({ type: 'update' })
    expect(press(composer, 'Backspace')).toEqual({ type: 'ignored' })
    expect(press(composer, '3')).toEqual({ type: 'ignored' })
  })

  it('commits first tone without a tone suffix and exposes invalid combinations', () => {
    const composer = phonetic.createComposer()
    type(composer, '5')
    const result = press(composer, ' ')
    expect(result).toMatchObject({ type: 'commit', code: '5', index: -1 })
    expect(result.type === 'commit' && result.candidates).toEqual(zhuyin.table['5'])
    expect(press(composer, 'Backspace')).toEqual({ type: 'update' })
    expect(composer.state.buffer).toBe('5')
    composer.reset()
    type(composer, '1m')
    expect(press(composer, '3')).toMatchObject({ type: 'invalid', code: '1m3' })
  })

  it('resolves heteronyms by longest phrase, falling back to the first table reading', () => {
    const reader = new ZhuyinReading(zhuyin)
    expect(phonetic.codesFor('行').length).toBeGreaterThan(1)
    const phrases = { phrases: { 銀行: ['up6', 'c;6'], 行走: ['vu/6', 'y.3'], 銀行家: ['up6', 'c;6', 'ru8'] } }
    expect(reader.annotate('銀行行走', phrases)).toEqual(['up6', 'c;6', 'vu/6', 'y.3'])
    expect(reader.annotate('銀行家', phrases)).toEqual(['up6', 'c;6', 'ru8'])
    expect(reader.annotate('行🙂')).toEqual([new ImTable(zhuyin).codesOf('行')[0], undefined])
    const contextual = createInputMethod({ table: zhuyin, roots: rootsFor(zhuyin), zhuyin: { table: zhuyin, phrases } })
    expect(contextual.codesFor('行', { text: '銀行', index: 1 })[0]?.code).toBe('c;6')
    expect(contextual.codesFor('行', { text: '行走', index: 0 })[0]?.code).toBe('vu/6')
    expect(contextual.codesFor('行', { text: '銀行', index: 1, expected: 'vu/6' })[0]?.code).toBe('vu/6')
    expect(contextual.codesFor('行')[0]?.tags.some((tag) => tag.startsWith('破音:'))).toBe(true)
    expect(readingLabel('1/', zhuyin.keynames)).toBe('ㄅㄥ')
    expect(readingLabel('ji3', zhuyin.keynames)).toBe('ㄨㄛˇ')
  })
})

describe('hint cards', () => {
  it('uses root labels, stable colors, contextual readings and heuristic explanations', () => {
    const card = im.explain('明')
    expect(card.options[0]?.keys.map((key) => key.color)).toEqual([0, 1, 2])
    expect(card.options[0]?.keys[0]).toMatchObject({ key: 'd', label: 'Ｄ', roots: ['Ｄ'] })
    expect(card.decomposition).toMatchObject({ verified: false, parts: [{ component: '', root: 'Ｄ', key: 'd' }, { key: 'u' }, { key: 'e' }] })
    expect(card.rule).toBe(boshiamy.meta.rule)
    expect(card.reading).toBe('ㄇㄧㄥˊ')
    expect(card.mnemonics.map((mnemonic) => mnemonic.key)).toEqual(['d', 'u', 'e'])
    expect(im.explain('鑫').mnemonics).toHaveLength(1)
    expect(im.explain('龘').confusables).toContain('鑫')
  })

  it('maps verified decompositions, roles and picked parts', () => {
    const rootData = rootsFor(boshiamy)
    rootData.keys.find((key) => key.key === 'd')!.label = '日'
    const verified = createInputMethod({ table: boshiamy, roots: rootData, decomp: { 明: [{
      code: 'due', ids: '⿰日月', parts: [{ component: '日', root: '日', key: 'd' }, { component: '月', root: '月', key: 'u' }, { component: '', root: '一', key: 'e' }],
      picked: [0, 2], roles: ['首', '尾'], explanation: ['由日與月組成。'],
    }] } })
    const card = verified.explain('明')
    expect(card.options[0]?.keys[0]?.label).toBe('日')
    expect(card.decomposition).toMatchObject({ verified: true, ids: '⿰日月', parts: [
      { picked: true, role: '首', color: 0 }, { picked: false, color: 1 }, { picked: true, role: '尾', color: 2 },
    ] })
  })

  it('returns an empty helpful card for characters absent from the table', () => {
    const card = im.explain('🙂')
    expect(card.options).toEqual([])
    expect(card.decomposition?.explanation.join('')).toContain('不在此輸入法字表')
    expect(card.confusables).toEqual([])
  })

  it('gives repeated keys one color so a root family reads as one', () => {
    const verified = createInputMethod({ table: boshiamy, roots: rootsFor(boshiamy), decomp: { 鑫: [{
      code: 'aaa', parts: [0, 1, 2].map(() => ({ component: '金', root: '金', key: 'a' })),
      picked: [0, 1, 2], roles: ['首', '次', '尾'], explanation: ['三金為鑫。'],
    }] } })
    expect(verified.explain('鑫').decomposition?.parts.map((part) => part.color)).toEqual([0, 0, 0])
  })
})
