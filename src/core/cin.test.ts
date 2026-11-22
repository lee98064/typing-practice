import { describe, expect, it } from 'vitest'
import { cinToTableFile, parseCin } from './cin'
import { ImTable, prefixCandidates } from './table'

describe('CIN parser', () => {
  it('accepts BOM, CRLF, whitespace, comments and repeated sections while preserving order', () => {
    const text = [
      '\uFEFF# header', '%gen_inp', '%ename Example # English name', '%cname 測試',
      '%selkey 0123', '%endkey 3467', '%keyname\tbegin', ' A\t日', 'b   月 # root',
      '%keyname end', 'ignored outside', '%chardef begin', 'AB\t明', 'ab 明',
      'a   日', 'ab 盟 # candidate', 'c #', 'phrase 一 個詞', 'broken',
      '# comment', '%chardef end', '%chardef begin', 'ab 萌', '%chardef end',
    ].join('\r\n')
    const parsed = parseCin(text)
    expect(parsed).toMatchObject({ ename: 'Example', cname: '測試', selKeys: '0123', endKeys: '3467', keynames: { a: '日', b: '月' } })
    expect(parsed.entries.map((entry) => entry.candidate)).toEqual(['明', '明', '日', '盟', '#', '一 個詞', '萌'])
    const file = cinToTableFile(text, { id: 'cangjie' })
    expect(Object.keys(file.table)).toEqual(['ab', 'a', 'c', 'phrase'])
    expect(file.table.ab).toEqual(['明', '盟', '萌'])
    expect(file.meta).toMatchObject({ name: '測試', shortName: '測', selKeys: '0123', commitKeys: ' 3467', maxCodeLength: 6 })
  })

  it('honors metadata overrides and safely handles arbitrary record keys', () => {
    const file = cinToTableFile('%keyname begin\n__proto__ 根\n%keyname end\n%chardef begin\n__proto__ 字\n%chardef end', {
      id: 'boshiamy', selKeys: '0123456789', selLabels: '〇一二三四五六七八九', maxCodeLength: 5, commitKeys: ' ',
    })
    expect(file.meta.selKeys).toBe('0123456789')
    expect(file.meta.maxCodeLength).toBe(5)
    expect(file.keynames.__proto__).toBe('根')
    expect(file.table.__proto__).toEqual(['字'])
    expect(cinToTableFile('', { id: 'array' }).table).toEqual({})
  })
})

describe('ImTable indexes', () => {
  const file = cinToTableFile('%chardef begin\nb 月\naa 日\nab 明\nab 盟\na 一\nz 字\n%chardef end', { id: 'array' })
  const table = new ImTable(file)

  it('uses exact lookup, file-order reverse lookup and lexically sorted prefix lookup', () => {
    expect(table.lookup('AB')).toEqual(['明', '盟'])
    expect(table.lookup('missing')).toEqual([])
    expect(table.codesOf('明')).toEqual(['ab'])
    expect(table.codesOf('無')).toEqual([])
    expect(table.prefix('a', 2)).toEqual(['a', 'aa'])
    expect(table.prefix('A', 10)).toEqual(['a', 'aa', 'ab'])
    expect(table.prefix('zz', 1)).toEqual([])
    expect(table.prefix('', 0)).toEqual([])
    expect(table.hasPrefix('a')).toBe(true)
    expect(table.hasPrefix('az')).toBe(false)
    expect(prefixCandidates(table, 'a', 3)).toEqual(['一', '日', '明'])
  })

  it('builds 60k-code indexes within the construction budget', () => {
    const large = { ...file, table: Object.fromEntries(Array.from({ length: 60_000 }, (_, i) => [`a${i.toString(36).padStart(4, '0')}`, ['明', '的']])) }
    const start = performance.now()
    const indexed = new ImTable(large)
    const elapsed = performance.now() - start
    expect(indexed.codesOf('明')).toHaveLength(60_000)
    expect(indexed.prefix('a00', 3)).toHaveLength(3)
    expect(elapsed).toBeLessThan(200)
  })
})
