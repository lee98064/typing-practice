import { ShapeComposer } from './engines/shape'
import { ZhuyinComposer } from './engines/zhuyin'
import { explain } from './explain'
import { ImTable } from './table'
import type { CodeOption, DecompFile, ImTableFile, InputMethod, ReadingCtx, RootsFile } from './types'
import { readingLabel, ZhuyinReading, type ZhuyinPhraseFile } from './zhuyin-reading'

export interface InputMethodData {
  table: ImTableFile
  roots: RootsFile
  decomp?: DecompFile
  zhuyin?: { table: ImTableFile; phrases?: ZhuyinPhraseFile }
}

const SHORTCUT_SUFFIX: Readonly<Record<string, number>> = {
  v: 1, r: 2, s: 3, f: 4, w: 5, l: 6, c: 7, b: 8, k: 9,
}

/** Detect only suffixes whose base-code candidate really is this character. */
export function isBoshiamyShortcut(table: ImTable, code: string, char: string): boolean {
  const selection = SHORTCUT_SUFFIX[code.at(-1) ?? '']
  return selection !== undefined && table.lookup(code.slice(0, -1))[selection] === char
}

function weight(option: CodeOption): number {
  return option.code.length + (option.selectionKey ? 1 : 0)
}

export function createInputMethod(data: InputMethodData): InputMethod {
  const { meta } = data.table
  const table = new ImTable(data.table)
  const phoneticTable = meta.id === 'zhuyin' ? table : data.zhuyin ? new ImTable(data.zhuyin.table) : undefined
  const reader = phoneticTable ? new ZhuyinReading(phoneticTable, data.zhuyin?.phrases) : undefined

  function expectedReading(char: string, ctx?: ReadingCtx): string | undefined {
    if (!reader) return undefined
    const codes = reader.table.codesOf(char)
    if (ctx?.expected && codes.includes(ctx.expected)) return ctx.expected
    return (ctx ? reader.annotate(ctx.text)[ctx.index] : undefined) ?? reader.defaultCode(char)
  }

  function codesFor(char: string, ctx?: ReadingCtx): CodeOption[] {
    const codes = table.codesOf(char)
    const longest = codes.reduce((max, code) => Math.max(max, code.length), 0)
    const smart = meta.id === 'zhuyin' // 注音 uses smart selection: tone/space always commits
    const options: CodeOption[] = codes.map((code) => {
      const selection = smart ? 0 : table.lookup(code).indexOf(char)
      const tags: string[] = []
      if (!smart && code.length === longest) tags.push('完整碼')
      if (selection > 0) tags.push('需選字')
      if (meta.id === 'boshiamy' && isBoshiamyShortcut(table, code, char)) tags.push('後綴選字')
      if (meta.id === 'zhuyin' && codes.length > 1) tags.push(`破音:${readingLabel(code, data.table.keynames)}`)
      return { code, selection, selectionKey: selection > 0 ? meta.selKeys[selection] : undefined, isShortest: false, tags }
    })
    // 行列簡碼: picked with a digit even for the first slot.
    for (const { code, index } of table.shortcodesOf(char)) {
      options.push({ code, selection: index, selectionKey: meta.selKeys[index], isShortest: false, tags: ['簡碼'] })
    }
    options.sort((a, b) => weight(a) - weight(b)
      || Number(a.tags.includes('後綴選字')) - Number(b.tags.includes('後綴選字'))
      || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0))
    const bestWeight = options[0] ? weight(options[0]) : 0
    for (const option of options) {
      option.isShortest = weight(option) === bestWeight
      if (!smart && option.isShortest && option.code.length < longest && !option.tags.includes('簡碼')) option.tags.unshift('簡碼')
    }
    if (meta.id === 'zhuyin') {
      const expected = expectedReading(char, ctx)
      options.sort((a, b) => Number(b.code === expected) - Number(a.code === expected))
    }
    return options
  }

  const im: InputMethod = {
    id: meta.id,
    meta,
    keys: data.roots.keys,
    roots: data.roots,
    createComposer: () => meta.id === 'zhuyin' ? new ZhuyinComposer(table) : new ShapeComposer(table),
    preedit: (buffer) => [...buffer].map((key) => ({ key, label: data.table.keynames[key] ?? key })),
    candidates: (code) => table.lookup(code),
    codesFor,
    explain: (char, ctx) => explain(char, ctx, {
      meta, table, roots: data.roots, decomp: data.decomp, codesFor,
      readingFor: (target, context) => {
        const code = expectedReading(target, context)
        return code && phoneticTable ? readingLabel(code, phoneticTable.file.keynames) : undefined
      },
    }),
  }
  if (meta.id === 'zhuyin' && reader) im.annotate = (text) => reader.annotate(text)
  return im
}
