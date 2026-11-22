/** IDS/root-chart alignment. Run: pnpm tsx scripts/build-decomp.ts */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { decompositionLines } from '../src/core/decomp-text'
import type { DecompEntry, DecompFile, ImId, ImTableFile, RootsFile } from '../src/core/types'
import { parse, rootIndex, resolve, SPLIT, takingPlans, validEntry } from './lib/decomp'
import type { Aliases, Atom, Cut, Node, Pick, RootIndex } from './lib/decomp'

const ROOT = new URL('../', import.meta.url)
const read = (p: string) => readFile(new URL(p, ROOT), 'utf8')
const json = async <T>(p: string) => JSON.parse(await read(p)) as T
const optional = async <T>(p: string): Promise<T | undefined> => {
  try { return await json<T>(p) } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return; throw e }
}
const idsOf = new Map<string, string>()
const trees = new Map<string, Node>()
for (const line of (await read('data-raw/ids/ids.txt')).split('\n')) {
  if (line.startsWith('#')) continue
  const [_, ch, ...alts] = line.split('\t')
  if (!ch || !alts.length) continue
  const seq = (alts.find(s => /\[[^\]]*T/.test(s)) ?? alts.find(s => !s.includes('[')) ?? alts[0]!).replace(/\[[^\]]*\]/g, '')
  idsOf.set(ch, seq)
  const tree = parse(seq)
  if (tree && tree !== ch) trees.set(ch, tree)
}
for (const [ch, seq] of Object.entries((await json<{ structures: Record<string, string> }>('data-raw/decomp/structures.json')).structures)) {
  if (!trees.has(ch)) { const tree = parse(seq); if (tree) trees.set(ch, tree) }
}

// CNS's PUA components may be matched only when a CNS character consists of that
// single component, establishing an exact identity. Unknown PUA shapes stay unknown.
const cnsChars = new Map<string, string>()
for (const file of ['BMP', '2', '3', '15']) {
  for (const line of (await read(`data-raw/charlists/CNS2UNICODE_Unicode ${file}.txt`)).trim().split('\n')) {
    const [cns, hex] = line.trim().split('\t')
    if (cns && hex) cnsChars.set(cns, String.fromCodePoint(parseInt(hex, 16)))
  }
}
const cnsRefs = new Map((await read('data-raw/ids/CNS_component_ref.txt')).trim().split('\n').map(l => {
  const fields = l.trim().split('\t')
  return [fields[0]!, fields[3]!] as const
}))
const cnsOf = new Map<string, string[]>()
const cnsEquivalent = new Map<string, string[]>()
for (const line of (await read('data-raw/ids/CNS_component.txt')).trim().split('\n')) {
  const [id, values] = line.trim().split('\t')
  const char = cnsChars.get(id!)
  const components = values?.split(',').map(i => cnsRefs.get(i) ?? '')
  if (!char || !components?.length || components.some(c => !c)) continue
  cnsOf.set(char, components)
  if (components.length === 1) {
    const c = components[0]!
    if (!cnsEquivalent.has(c)) cnsEquivalent.set(c, [])
    cnsEquivalent.get(c)!.push(char)
  }
}

const targets = new Set<string>()
for (const c of await read('data-raw/charlists/moe-common-4808.txt')) if (/\p{Unified_Ideograph}/u.test(c)) targets.add(c)
for (const a of await json<{ id: string }[]>('public/data/articles/index.json')) {
  for (const c of (await json<{ text: string }>(`public/data/articles/${a.id}.json`)).text) if (/\p{Unified_Ideograph}/u.test(c)) targets.add(c)
}
const BEFORE = { boshiamy: 2785, array: 1563, dayi: 1856, cangjie: 896 }
const LIMIT = 192
const fingerprint = (cut: Cut) => `${cut.split}/${cut.bodySplit}:` + cut.parts.map(p => `${p.component}/${p.key ?? ''}/${p.group ?? ''}`).join(',')
function unique(cuts: Cut[]): Cut[] {
  const seen = new Set<string>()
  return cuts.filter(c => { const id = fingerprint(c); if (seen.has(id)) return false; seen.add(id); return true }).sort((a, b) => a.parts.length - b.parts.length).slice(0, LIMIT)
}
function combinations(children: Cut[][], idc?: string): Cut[] {
  let out: Cut[] = [{ parts: [] }]
  for (let k = 0; k < children.length; k++) {
    const next: Cut[] = []
    for (const a of out) for (const b of children[k]!) {
      if (a.parts.length + b.parts.length > 40) continue
      next.push({ parts: [...a.parts, ...b.parts],
        ...(k === 0 ? {} : { split: a.split ?? a.parts.length }),
        ...(k === 1 && children.length === 2 && b.split !== undefined ? { bodySplit: b.split } : {}),
        ...(k === 2 && a.split !== undefined ? { bodySplit: a.parts.length - a.split } : {}),
      })
    }
    out = unique(next)
  }
  return out.map(c => idc && SPLIT.has(idc) ? c : { parts: c.parts })
}

function makeSearch(im: ImId, ix: RootIndex, expansions: Map<string, Cut[]>) {
  const memo = new Map<string, Cut[]>()
  const cuts = (node: Node, depth = 0, trail = new Set<string>()): Cut[] => {
    if (depth > 9) return []
    if (typeof node !== 'string') {
      const children = node.kids.map(k => cuts(k, depth + 1, trail))
      if (children.some(k => !k.length)) return []
      // Cangjie surrounds are read outside -> inside. Other IMs write 辶/廴 last.
      const delayed = (node.idc === '⿺' && typeof node.kids[0] === 'string' && '辶辵廴⻌⻍'.includes(node.kids[0]))
        || (node.idc === '⿶' && node.kids[0] === '凵')
      const order = im !== 'cangjie' && delayed ? [...children].reverse() : children
      return combinations(order, node.idc)
    }
    if (trail.has(node)) return []
    const memoKey = `${node}/${depth}/${[...trail].join('')}`
    if (memo.has(memoKey)) return memo.get(memoKey)!
    const nextTrail = new Set(trail).add(node)
    const isPua = /[\uE000-\uF8FF\u{F0000}-\u{10FFFF}]/u.test(node)
    const out: Cut[] = ix.keysOf.has(node) && !isPua ? [{ parts: [{ component: node }] }] : []
    if (isPua) for (const equivalent of cnsEquivalent.get(node) ?? []) out.push(...cuts(equivalent, depth + 1, nextTrail))
    for (const e of expansions.get(node) ?? []) out.push({ ...e, parts: e.parts.map(p => ({ ...p, group: node })) })
    const sub = trees.get(node)
    if (sub) out.push(...cuts(sub, depth + 1, nextTrail).map(c => ({ ...c, parts: c.parts.map(p => ({ ...p, group: node })) })))
    if (im !== 'cangjie') {
      const cns = cnsOf.get(node)
      if (cns && !(cns.length === 1 && cns[0] === node)) {
        out.push(...combinations(cns.map(c => cuts(c, depth + 1, nextTrail))).map(c => ({ parts: c.parts.map(p => ({ ...p, group: node })) })))
      }
    }
    const result = unique(out)
    memo.set(memoKey, result)
    return result
  }
  return (ch: string): Cut[] => {
    // Never use a character's own table sequence/previous result to explain itself.
    const out: Cut[] = ix.keysOf.has(ch) ? [{ parts: [{ component: ch }] }] : []
    const tree = trees.get(ch)
    if (tree) out.push(...cuts(tree, 0, new Set([ch])))
    if (im !== 'cangjie') {
      const cns = cnsOf.get(ch)
      if (cns && !(cns.length === 1 && cns[0] === ch)) out.push(...combinations(cns.map(c => cuts(c, 1, new Set([ch])))))
    }
    return unique(out)
  }
}

function lastStroke(ch: string, aliases: Aliases, seen = new Set<string>()): string | undefined {
  if (seen.has(ch)) return
  seen.add(ch)
  if (aliases.lastStrokes?.[ch]) return aliases.lastStrokes[ch]
  const cns = cnsOf.get(ch)
  if (cns?.length) {
    const last = cns.at(-1)!
    for (const equivalent of [last, ...(cnsEquivalent.get(last) ?? [])]) {
      const result = lastStroke(equivalent, aliases, new Set(seen))
      if (result) return result
    }
  }
  const visit = (node: Node): string | undefined => typeof node === 'string' ? lastStroke(node, aliases, new Set(seen))
    : visit(node.idc === '⿺' ? node.kids[0]! : node.kids.at(-1)!)
  const tree = trees.get(ch)
  // Enclosures and overlaps need stroke-level evidence, not an IDS-order guess.
  return tree && (typeof tree === 'string' || '⿰⿱⿲⿳⿺'.includes(tree.idc)) ? visit(tree) : undefined
}
interface Match { entry: DecompEntry; cut: Cut; plan: Pick }
// The chart's M/一, for example, denotes a partial shape, not the E horizontal stroke.
const STROKE_KEYS: Record<string, string> = { '一': 'e', '丨': 'i', '丿': 'p', '㇏': 'n', '丶': 'a' }
function matches(im: ImId, ch: string, codes: string[], candidates: Cut[], ix: RootIndex, aliases: Aliases, table: Record<string, string[]>): Match[] {
  const out: Match[] = []
  for (const code of codes) for (const original of candidates) {
    const plans = takingPlans(im, original, code.length)
    for (const originalPlan of plans) {
      let cut = original
      let plan = originalPlan
      if (im === 'boshiamy' && original.parts.length <= 2 && code.length === original.parts.length + 1) {
        const stroke = aliases.prescribed?.[ch] ?? lastStroke(ch, aliases)
        if (!stroke || !STROKE_KEYS[stroke]) continue
        cut = { parts: [...original.parts, { component: stroke, key: STROKE_KEYS[stroke] }] }
        plan = { picked: [...originalPlan.picked, cut.parts.length - 1], roles: [...originalPlan.roles, '補'] }
      }
      const entry = resolve(cut, plan, code, ix)
      if (entry && validEntry(entry, im, ch, table, ix, [plan])) out.push({ entry, cut: original, plan })
    }
    if (out.length > 12) return out
  }
  return out
}
/** Manual roots may cover an unencoded IDS leaf, but cannot invent a taking rule. */
function manualCut(im: ImId, ch: string, entry: DecompEntry): Cut | null {
  const supplemental = entry.roles.at(-1) === '補'
  const parts = entry.parts.filter((_, i) => !supplemental || i !== entry.picked.at(-1))
  if (im !== 'cangjie') return { parts }
  const count = entry.roles.filter(r => r.startsWith('字首')).length
  if (!count) return { parts }
  const tree = trees.get(ch)
  if (count > 2 || typeof tree !== 'object' || !SPLIT.has(tree.idc)) return null
  const h = count === 1 ? 1 : entry.picked[count - 1]! + 1
  if (h < 1 || h >= parts.length) return null
  const first = tree.kids[0]!
  if (typeof first !== 'string' || !parts.slice(0, h).every(p => p.group === first || p.component === first)) return null
  const body = tree.kids.length === 2 ? tree.kids[1]! : { idc: tree.idc, kids: tree.kids.slice(1) }
  const bodyTree = typeof body === 'string' ? trees.get(body) : body
  let bodySplit: number | undefined
  if (typeof bodyTree === 'object' && SPLIT.has(bodyTree.idc)) {
    const initial = bodyTree.kids[0]!
    if (typeof initial === 'string') {
      let end = h
      while (end < parts.length && (parts[end]!.group === initial || parts[end]!.component === initial)) end++
      if (end > h && end < parts.length) bodySplit = end - h
    }
  }
  return { parts, split: h, ...(bodySplit ? { bodySplit } : {}) }
}
const report: string[] = ['# 拆字對齊報告', '', '範圍：教育部常用 4808 字 ∪ 文章漢字；分母為該輸入法字表內的目標字。Before 為 T4 原始版本固定基準，重跑不會移動。', '', '| 輸入法 | Before | After | 演算法／人工（字） | 大小 |', '|---|---:|---:|---:|---:|']
const samples: string[] = []
await mkdir(new URL('public/data/decomp/', ROOT), { recursive: true })
for (const im of ['boshiamy', 'array', 'dayi', 'cangjie'] as const) {
  const table = await json<ImTableFile>(`public/data/im/${im}.json`)
  const aliases = await json<Aliases>(`data-raw/decomp/aliases-${im}.json`)
  const ix = rootIndex(await json<RootsFile>(`public/data/roots/${im}.json`), aliases)
  for (const [component, equivalents] of cnsEquivalent) {
    const keys = new Set(equivalents.flatMap(c => [...(ix.keysOf.get(c) ?? [])]))
    if (keys.size) ix.keysOf.set(component, keys)
  }
  const rev = new Map<string, string[]>()
  for (const [code, chars] of Object.entries(table.table)) for (const c of chars) {
    if ([...c].length !== 1 || !/\p{Unified_Ideograph}/u.test(c)) continue
    if (!rev.has(c)) rev.set(c, [])
    rev.get(c)!.push(code)
  }
  for (const codes of rev.values()) codes.sort((a, b) => b.length - a.length || a.localeCompare(b))
  const expansions = new Map<string, Cut[]>()
  // Only explicitly documented complete component sequences, never arbitrary table codes.
  for (const [char, code] of Object.entries(aliases.sequences ?? {})) {
    if (!table.table[code]?.includes(char)) throw Error(`Sequence absent from table: ${char}/${code}`)
    const parts: Atom[] = [...code].map(key => ({ component: key === 'x' ? `${char}難形` : ix.labels.get(key)!, key }))
    if (parts.some(p => !ix.keysOf.get(p.component)?.has(p.key!))) throw Error(`Sequence has unsupported root: ${char}`)
    expansions.set(char, [{ parts }])
  }
  const complexity = (ch: string, seen = new Set<string>()): number => {
    if (seen.has(ch)) return 1
    const tree = trees.get(ch)
    if (!tree) return 1
    const next = new Set(seen).add(ch)
    const weight = (n: Node): number => typeof n === 'string' ? complexity(n, next) : n.kids.reduce((s, k) => s + weight(k), 0)
    return weight(tree)
  }
  const relevant = new Set<string>()
  const collect = (ch: string) => {
    if (relevant.has(ch)) return
    relevant.add(ch)
    const visit = (n: Node) => typeof n === 'string' ? collect(n) : n.kids.forEach(visit)
    const tree = trees.get(ch)
    if (tree) visit(tree)
    if (im !== 'cangjie') for (const c of cnsOf.get(ch) ?? []) collect(c)
  }
  targets.forEach(collect)
  const ordered = [...relevant].filter(c => rev.has(c)).map(ch => ({ ch, weight: complexity(ch) })).sort((a, b) => a.weight - b.weight || a.ch.codePointAt(0)! - b.ch.codePointAt(0)!)
  const aligned = new Map<string, Match>()
  let rounds = 0
  for (;;) {
    rounds++
    let added = 0
    // New expansions are consumed in the next pass (memo stays valid for the pass).
    const search = makeSearch(im, ix, expansions)
    const pending = new Map<string, Cut[]>()
    for (const { ch } of ordered) {
      if (aligned.has(ch)) continue
      const found = matches(im, ch, rev.get(ch)!, search(ch), ix, aliases, table.table)[0]
      if (!found) continue
      aligned.set(ch, found)
      const parts = found.entry.parts.filter((_, i) => !found.entry.picked.some((p, n) => p === i && found.entry.roles[n] === '補'))
      // Keep the entire root sequence, not just picked roots or a 補碼.
      const expansion = { ...found.cut, parts: parts.map(p => ({ component: p.component, key: p.key })) }
      pending.set(ch, [expansion])
      added++
    }
    for (const [ch, cuts] of pending) {
      // Explicit complete seeds remain available alongside independently aligned cuts.
      expansions.set(ch, unique([...(expansions.get(ch) ?? []), ...cuts]))
    }
    if (!added) break
  }
  const out: DecompFile = {}
  let algorithm = 0
  let manual = 0
  for (const ch of targets) {
    const match = aligned.get(ch)
    if (!match) continue
    const ids = idsOf.get(ch)
    out[ch] = [{ ...match.entry, ...(ids && ids !== ch ? { ids } : {}) }]
    algorithm++
  }
  const manualFile = await optional<DecompFile>(`data-raw/decomp/manual-${im}.json`)
  const search = makeSearch(im, ix, expansions)
  const top600 = new Set((await read('data-raw/charlists/wikipedia-zh-tw-frequency.tsv')).trim().split('\n').slice(1, 601).map(l => l.split('\t')[1]))
  for (const [ch, entries] of Object.entries(manualFile ?? {})) {
    for (const entry of entries) {
      const cut = manualCut(im, ch, entry)
      const paths = matches(im, ch, [entry.code], [...search(ch), ...(cut ? [cut] : [])], ix, aliases, table.table)
      const path = paths.find(p => JSON.stringify(p.entry.parts.map(x => [x.component, x.key])) === JSON.stringify(entry.parts.map(x => [x.component, x.key])))
      if (out[ch] || !targets.has(ch) || !top600.has(ch) || !path || !validEntry(entry, im, ch, table.table, ix, [path.plan])) {
        console.warn(`reject manual ${im} ${ch}/${entry.code}: scope, roots, code or taking rule`)
        continue
      }
      const ids = idsOf.get(ch)
      out[ch] = [{ ...path.entry, ...(ids && ids !== ch ? { ids } : {}) }]
      manual++
      break
    }
  }
  const text = JSON.stringify(out) + '\n'
  await writeFile(new URL(`public/data/decomp/${im}.json`, ROOT), text)
  const denominator = [...targets].filter(c => rev.has(c)).length
  const before = `${BEFORE[im]}/${denominator} (${(BEFORE[im] / denominator * 100).toFixed(1)}%)`
  const after = `${Object.keys(out).length}/${denominator} (${(Object.keys(out).length / denominator * 100).toFixed(1)}%)`
  const bytes = Buffer.byteLength(text)
  const line = `${im}: ${before} -> ${after}; algorithm=${algorithm}, manual=${manual}; ${rounds} passes; ${(bytes / 1e6).toFixed(2)} MB`
  console.log(line)
  report.push(`| ${im} | ${before} | ${after} | ${algorithm} / ${manual} | ${(bytes / 1e6).toFixed(2)} MB |`)
  // Seeded Fisher-Yates: random sample independent of insertion order, reproducible for review.
  let seed = 0x4d4f4441
  const keys = Object.keys(out).sort()
  for (let i = keys.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); [keys[i], keys[j]] = [keys[j]!, keys[i]!] }
  samples.push(`## ${im} 隨機抽樣 15 字`, '', '| 字 | 碼 | 所有部件（根／鍵，括號為來源部件） | 取用索引（0 起算） | 角色 |', '|---|---|---|---|---|')
  for (const ch of keys.slice(0, 15)) {
    const e = out[ch]![0]!
    samples.push(`| ${ch} | ${e.code} | ${e.parts.map(p => `${p.component}/${p.key}${p.group ? `(${p.group})` : ''}`).join(' ')} | ${e.picked.join(',')} | ${e.roles.join('、')} |`)
  }
  samples.push('', ...[...`明崩謝這想`].filter(c => out[c]).map(ch => `- ${ch}：${decompositionLines(im, ch, out[ch]![0]!).join('')}`), '')
}
report.push('', '## 驗證與界線', '',
  '- 每個根（含未取根與補碼）均須出現在該鍵字根清單或有來源的別形；逐筆核對 picked 串接碼、真實字表及取碼索引／角色。人工檔亦通過相同驗證；本次未加入人工逐字拆解。',
  '- IDS 依臺灣 T 標記優先；按複雜度處理目標與其遞迴部件，完整根序列（排除補碼）反覆展開至無新增。倉頡只額外採用 aliases-cangjie.json 明列的完整部件根序列，須先與原表及根表核對，從不直接把目標字自身的碼當拆解。',
  '- 倉頡：字首首尾；字身不超過三根全取；超過時，不可再分字身取首次尾，可分字身取其首部首尾＋餘部尾（首部僅一根則餘部取首尾）。⿸⿹⿺ 及四面包圍按外內分體；未實作須減筆的包含省略。X 僅允許明列的身／臼／齊難形。',
  '- 嘸蝦米：前三尾；一兩根補短須有末筆或圖表明示規定碼證據。行列：前三尾。大易：三碼首次尾，四碼原表採前三尾。',
  '- CNS 單部件字建立 PUA 與 Unicode 根的精確對應，未知 PUA 不猜。CNS 部件順序作其他三法的備選切法；不由無空間資訊的 CNS 清單猜倉頡分體。',
  '- 已移除舊版 宀＝冖、中＝屮 等過寬等同；圖表註明僅取局部的形須保守排除。未解：跨 IDS 邊界的大根、包含省略、特殊字首、未編碼局部形，以及缺末筆證據的嘸蝦米補短。',
  '- 嘸蝦米覆蓋下降是驗證收緊：舊版僅確認前一兩根，就把字表下一鍵當「末筆或規定碼」；本版須另有末筆證據，且橫 E、豎 I、撇 P、捺 N、點 A 不混用近形根。未證實的舊補碼不保留。',
  '- JSON 省略重複 root 與說明文字；component 即根形，字根卡與本報告共用 decomp-text.ts 即時產生說明。抽樣採固定種子的 Fisher–Yates 洗牌，可重現。', '', ...samples)
await writeFile(new URL('docs/decomp-report.md', ROOT), report.join('\n').trimEnd() + '\n')
