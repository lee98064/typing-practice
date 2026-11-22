/** IDS/root-chart alignment. Run: pnpm tsx scripts/build-decomp.ts */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { decompositionLines } from '../src/core/decomp-text'
import type { DecompEntry, DecompFile, ImId, ImTableFile, RootsFile } from '../src/core/types'
import { rootIndex, resolve, SPLIT, takingPlans, validEntry } from './lib/decomp'
import type { Aliases, Atom, Cut, Node, Pick, RootIndex } from './lib/decomp'
import { loadDecompSources } from './lib/decomp-sources'
import { compareLargeRoots, strokeMap, strokeSupplement, surroundOrder } from './lib/cns-strokes'
import { manualDecompReport } from './lib/manual-decomp-report'
import type { ManualSummary } from './lib/manual-decomp-report'

const ROOT = new URL('../', import.meta.url)
const read = (p: string) => readFile(new URL(p, ROOT), 'utf8')
const json = async <T>(p: string) => JSON.parse(await read(p)) as T
const optional = async <T>(p: string): Promise<T | undefined> => {
  try { return await json<T>(p) } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return; throw e }
}
const { idsOf, trees, cnsChars, cnsOf, cnsEquivalent, targets, relevant } = await loadDecompSources()
const { sequences: strokes, conflicts } = strokeMap(await read('data-raw/cns/CNS_strokes_sequence.txt'), cnsChars, relevant)
await writeFile(new URL('data-raw/decomp/strokes-cns.json', ROOT), JSON.stringify(strokes) + '\n')
const BEFORE = { boshiamy: 2138, array: 1926, dayi: 2304, cangjie: 2351 }
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
  const cuts = (node: Node, depth = 0, trail = new Set<string>(), parent?: string): Cut[] => {
    if (depth > 9) return []
    if (typeof node !== 'string') {
      const children = node.kids.map(k => cuts(k, depth + 1, trail))
      if (children.some(k => !k.length)) return []
      // Cangjie surrounds are read outside -> inside. Other IMs write 辶/廴 last.
      const delayed = (node.idc === '⿺' && typeof node.kids[0] === 'string' && '辶辵廴⻌⻍'.includes(node.kids[0]))
        || (node.idc === '⿶' && node.kids[0] === '凵')
      const original = im !== 'cangjie' && delayed ? [...children].reverse() : children
      const proven = im === 'cangjie' ? undefined : surroundOrder(node, parent, strokes)
      // Stroke order adds evidence, but Boshiamy eye order and Dayi's large-root
      // rules can cross strokes. Keep the established structural cut available.
      return proven ? unique([...combinations(proven.map(i => children[i]!), node.idc), ...combinations(original, node.idc)])
        : combinations(original, node.idc)
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
    if (sub) out.push(...cuts(sub, depth + 1, nextTrail, strokes[node]).map(c => ({ ...c, parts: c.parts.map(p => ({ ...p, group: node })) })))
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
    if (tree) out.push(...cuts(tree, 0, new Set([ch]), strokes[ch]))
    if (im !== 'cangjie') {
      const cns = cnsOf.get(ch)
      if (cns && !(cns.length === 1 && cns[0] === ch)) out.push(...combinations(cns.map(c => cuts(c, 1, new Set([ch])))))
    }
    return unique(out)
  }
}

// Only disambiguates type-4 點/捺; the CNS last type must independently agree.
function lastStrokeShape(ch: string, aliases: Aliases, seen = new Set<string>()): string | undefined {
  if (seen.has(ch)) return
  seen.add(ch)
  if (aliases.lastStrokes?.[ch]) return aliases.lastStrokes[ch]
  const cns = cnsOf.get(ch)
  if (cns?.length) {
    const last = cns.at(-1)!
    for (const equivalent of [last, ...(cnsEquivalent.get(last) ?? [])]) {
      const result = lastStrokeShape(equivalent, aliases, new Set(seen))
      if (result) return result
    }
  }
  const visit = (node: Node): string | undefined => typeof node === 'string' ? lastStrokeShape(node, aliases, new Set(seen))
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
        const prescribed = aliases.prescribed?.[ch]
        const extra = prescribed && STROKE_KEYS[prescribed]
          ? { component: prescribed, key: STROKE_KEYS[prescribed], group: '規定補' }
          : strokeSupplement(strokes[ch], lastStrokeShape(ch, aliases))
        // Never get the supplement from the table. It can only verify evidence.
        if (!extra || extra.key !== code.at(-1)) continue
        cut = { parts: [...original.parts, extra] }
        plan = { picked: [...originalPlan.picked, cut.parts.length - 1], roles: [...originalPlan.roles, '補'] }
      }
      const entry = resolve(cut, plan, code, ix)
      if (entry && validEntry(entry, im, ch, table, ix, [plan])) out.push({ entry, cut: original, plan })
    }
  }
  return out.sort((a, b) => b.entry.code.length - a.entry.code.length || compareLargeRoots(a.cut, b.cut, strokes))
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
const report: string[] = ['# 拆字對齊報告', '', '範圍：教育部常用 4808 字 ∪ 文章漢字；分母為該輸入法字表內的目標字。上表 Before 固定為 T4 實測產物；T6 人工拆解的 T5 → T6 比較另列下節，重跑不會移動。', '', '| 輸入法 | Before (T4) | After (T6) | 演算法／人工（字） | 大小 |', '|---|---:|---:|---:|---:|']
const samples: string[] = []
const manualSummaries: ManualSummary[] = []
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
      const paths = matches(im, ch, rev.get(ch)!, search(ch), ix, aliases, table.table)
      const found = paths[0]
      if (!found) continue
      aligned.set(ch, found)
      // Keep the entire root sequence, not just picked roots or a 補碼.
      // A display preference must not discard other independently verified cuts
      // needed by a larger character (e.g. 大易 覺 -> 攪).
      pending.set(ch, unique(paths.map(path => {
        const parts = path.entry.parts.filter((_, i) => !path.entry.picked.some((p, n) => p === i && path.entry.roles[n] === '補'))
        return { ...path.cut, parts: parts.map(p => ({ component: p.component, key: p.key })) }
      })))
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
  let manualRejected = 0
  const manualAccepted: string[] = []
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
        manualRejected++
        console.warn(`reject manual ${im} ${ch}/${entry.code}: scope, roots, code or taking rule`)
        continue
      }
      const ids = idsOf.get(ch)
      out[ch] = [{ ...path.entry, ...(ids && ids !== ch ? { ids } : {}) }]
      manual++
      manualAccepted.push(ch)
      break
    }
  }
  const text = JSON.stringify(out) + '\n'
  const denominator = [...targets].filter(c => rev.has(c)).length
  manualSummaries.push({ im, denominator, accepted: manualAccepted, rejected: manualRejected })
  const before = `${BEFORE[im]}/${denominator} (${(BEFORE[im] / denominator * 100).toFixed(1)}%)`
  const after = `${Object.keys(out).length}/${denominator} (${(Object.keys(out).length / denominator * 100).toFixed(1)}%)`
  const bytes = Buffer.byteLength(text)
  if (bytes >= 1_000_000) throw Error(`${im} decomposition exceeds 1 MB`)
  await writeFile(new URL(`public/data/decomp/${im}.json`, ROOT), text)
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
report.push('', await manualDecompReport(manualSummaries), '', '## CNS 證據與重現', '',
  `- 來源：[全字庫屬性資料集](https://data.gov.tw/dataset/5961)，選用 OGDL-1.0；下載 URL、日期、原 ZIP／原筆順檔／保留子集 SHA-256 及 Unicode 對照檔 SHA-256 見 [LICENSE-SOURCE.txt](../data-raw/cns/LICENSE-SOURCE.txt)。上游檔名實為 CNS_strokes_sequence.txt。原檔約 2.14 MB，僅保留目標及遞迴 IDS／CNS 部件的原始列，其餘不進 repo。`,
  `- 範圍 ${targets.size} 個目標字、${relevant.size} 個含部件的相關字形；精簡 [char → 筆順碼](../data-raw/decomp/strokes-cns.json) 有 ${Object.keys(strokes).length} 字，其中 ${[...targets].filter(c => strokes[c]).length} 個目標字。衝突 Unicode 序列 ${conflicts.length} 字；衝突或含 0／6 的資料不作筆畫證據，沒有對無資料字形補造筆畫數。`,
  '- 筆型 1→橫 E、2→豎 I、3→撇 P；4 合併點／捺，只有既有 aliases 的末筆形狀證據可分出點 A、捺 N，否則拒絕；5 為折筆族，不硬套鍵。補短先從 CNS 與形狀證據導出鍵，再核對字表最後一鍵，部件記 group／role「補」。既有俞的明示末形規定另標「規定補」，不冒稱 CNS 末筆。',
  '- 同樣通過碼表驗證的切法，保留完整碼長優先，再按第一個不同根的 CNS 筆畫數取大根；沒有筆畫數的根不加分。所有已驗證完整根序仍可展開到其他字，顯示偏好不刪除其他切法。此為精度排序，不是以筆畫數證明局部幾何覆蓋。',
  '- 非倉頡的包圍 IDS，以子件筆畫數切分母字筆順；只有兩件的完整筆序以唯一順序精確重現母字時才加入重排切法，例如凶＝乂＋凵、這＝言＋辶。嘸蝦米眼順與大易大根可跨筆順，仍保留既有結構切法並通過真表驗證；不以 CNS 順序強行覆寫（例如大易覺／攪）。四面包圍收口交錯、兩序皆可或筆畫數不合時不推斷；倉頡維持字首／字身規則。',
  '- 證據鏈：保留 CNS 原始列＋既有 CNS→Unicode 對照 → 排除衝突的字形筆序 → 末筆鍵／大根排序／唯一部件順序 → roots、takingPlans、resolve、validEntry → compact JSON 與本報告。原表只作最終驗證，不能作補碼來源。',
  '- 重現：`node --import tsx scripts/fetch-cns-strokes.ts` 更新來源；`node --import tsx scripts/build-decomp.ts` 離線重建精簡筆序、四種拆字及本報告；`pnpm test`、`pnpm exec vue-tsc -b --noEmit` 驗證。五組補短 golden、全檔根／索引／角色／碼表一致性、拒絕歧義筆型及包圍順序皆有測試；所有新增／重建檔案小於 1 MB。',
  '', '## 驗證與界線', '',
  '- 每個根（含未取根與補碼）均須出現在該鍵字根清單或有來源的別形；逐筆核對 picked 串接碼、真實字表及取碼索引／角色。人工檔亦通過相同驗證；T6 接受／拒絕數與人工抽樣另列上節。',
  '- IDS 依臺灣 T 標記優先；按複雜度處理目標與其遞迴部件，完整根序列（排除補碼）反覆展開至無新增。倉頡只額外採用 aliases-cangjie.json 明列的完整部件根序列，須先與原表及根表核對，從不直接把目標字自身的碼當拆解。',
  '- 倉頡：字首首尾；字身不超過三根全取；超過時，不可再分字身取首次尾，可分字身取其首部首尾＋餘部尾（首部僅一根則餘部取首尾）。⿸⿹⿺ 及四面包圍按外內分體；未實作須減筆的包含省略。X 僅允許明列的身／臼／齊難形。',
  '- 嘸蝦米：前三尾；一兩根補短須有末筆或圖表明示規定碼證據。行列：前三尾。大易：三碼首次尾，四碼原表採前三尾。',
  '- CNS 單部件字建立 PUA 與 Unicode 根的精確對應，未知 PUA 不猜。CNS 部件順序作其他三法的備選切法；不由無空間資訊的 CNS 清單猜倉頡分體。',
  '- 沿用 T4 的保守根義：宀≠冖、中≠屮；圖表註明僅取局部的形不當完整根。未解：跨 IDS 邊界的大根、包含省略、特殊字首、未編碼局部形，以及 CNS 未覆蓋或無法分辨點／捺／折筆的補短。行列／大易仍缺筆畫遮罩，沒有以近形或字表尾鍵倒造根。',
  '- CNS 序列不保證符合本字表的補短慣例：例如乃為 35、戶為 3351，與 T4 末撇 P 證據不一致；本版遇不一致拒絕該補短路徑，不反改來源或原字表。因此新增 CNS 證據也可能撤回舊解釋；覆蓋率不是正確率。',
  '- JSON 省略重複 root 與說明文字；component 即根形，字根卡與本報告共用 decomp-text.ts 即時產生說明。抽樣採固定種子的 Fisher–Yates 洗牌，可重現。', '', ...samples)
await writeFile(new URL('docs/decomp-report.md', ROOT), report.join('\n').trimEnd() + '\n')
