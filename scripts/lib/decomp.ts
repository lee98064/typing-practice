import type { DecompEntry, ImId, RootsFile } from '../../src/core/types'

export type Node = string | { idc: string; kids: Node[] }
const IDCS = new Set('⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻')
export const SPLIT = new Set('⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺')
export function parse(seq: string): Node | null {
  const toks = seq.match(/&[^;]+;|./gu) ?? []
  let i = 0
  const go = (): Node | null => {
    const t = toks[i++]
    if (!t) return null
    if (!IDCS.has(t)) return t.startsWith('&') ? null : t
    const kids: Node[] = []
    for (let k = 0; k < ('⿲⿳'.includes(t) ? 3 : 2); k++) {
      const n = go()
      if (!n) return null
      kids.push(n)
    }
    return { idc: t, kids }
  }
  const n = go()
  return i === toks.length ? n : null
}

// Only actual positional variants. In particular 宀≠冖, 中≠屮, 己≠已≠巳,
// and ambiguous 阝 is resolved per IM instead of merging 邑 with 阜.
export const VARIANT_GROUPS = [
  ['人', '亻', '𠆢'], ['水', '氵', '氺', '⺢'], ['手', '扌', '龵'], ['心', '忄', '⺗', '㣺'],
  ['示', '礻'], ['衣', '衤'], ['金', '釒', '钅'], ['糸', '糹', '纟'], ['竹', '⺮'],
  ['艸', '艹', '卄'], ['辵', '辶', '⻌', '⻍'], ['刀', '刂'], ['犬', '犭'], ['食', '飠', '𩙿'],
  ['网', '罒', '⺲'], ['火', '灬'], ['爪', '爫'], ['玉', '王'], ['攴', '攵'], ['肉', '⺼'],
  ['言', '訁', '讠'], ['足', '⻊'], ['老', '耂'], ['羊', '⺶', '⺷'], ['牛', '牜', '⺧'],
  ['歹', '歺'], ['雨', '⻗'], ['小', '⺌', '⺍'], ['彐', '⺕', 'ヨ', '⺔'],
  ['卩', '㔾'], ['戶', '户', '戸'], ['日', '曰'], ['冂', '⺆'], ['厶', 'ム'], ['乂', '㐅'], ['月', '⺼', '⺝'],
  ['木', '朩'], ['臼', '𦥑'], ['𠂊', '⺈'],
]
export interface Aliases {
  source: string
  aliases: { component: string; root: string; keys?: string; note: string }[]
  /** Complete, untruncated sequences, checked against the selected table before use. */
  sequences?: Record<string, string>
  lastStrokes?: Record<string, string>
  prescribed?: Record<string, string>
  /** Chart representatives that mean only a partial shape, not a whole component. */
  partial?: Record<string, string>
}
export interface RootIndex {
  keysOf: Map<string, Set<string>>
  labels: Map<string, string>
}
export function rootIndex(roots: RootsFile, aliases: Aliases): RootIndex {
  const keysOf = new Map<string, Set<string>>()
  const labels = new Map(roots.keys.map(k => [k.key, k.label]))
  const add = (c: string, k: string) => {
    if (aliases.partial?.[k]?.includes(c)) return
    if (!keysOf.has(c)) keysOf.set(c, new Set())
    keysOf.get(c)!.add(k)
  }
  for (const k of roots.keys) {
    // Function-key labels (難、重) are not roots.
    for (const r of [...k.roots, ...(k.shortcutRoots ?? [])]) if ([...r].length === 1) add(r, k.key)
  }
  for (const group of VARIANT_GROUPS) {
    // The full form is the anchor; do not pool different positional keys.
    // E.g. boshiamy 人=B, 亻=P; missing 𠆢 inherits B, never P.
    const keys = keysOf.get(group[0]!) ?? new Set<string>()
    for (const c of group) if (!keysOf.has(c)) for (const k of keys) add(c, k)
  }
  for (const a of aliases.aliases) {
    const keys = a.keys ? [...a.keys] : [...(keysOf.get(a.root) ?? [])]
    for (const key of keys) {
      // X is permitted only for explicitly named difficult shapes.
      if (!keysOf.get(a.root)?.has(key) && !(key === 'x' && a.root === '難')) throw Error(`Invalid alias ${a.component}/${key}`)
      add(a.component, key)
    }
  }
  return { keysOf, labels }
}
export interface Atom { component: string; key?: string; group?: string }
export interface Cut { parts: Atom[]; split?: number; bodySplit?: number }
export interface Pick { picked: number[]; roles: string[] }
const indices = (n: number) => Array.from({ length: n }, (_, i) => i)
const firstLast = (n: number) => n <= 2 ? indices(n) : [0, n - 1]
const firstTwoLast = (n: number) => n <= 3 ? indices(n) : [0, 1, n - 1]
export function genericPick(n: number, max: number): Pick {
  const picked = n <= max ? indices(n) : [...indices(max - 1), n - 1]
  return { picked, roles: picked.map(i => i === n - 1 && n >= max ? '尾' : ['首', '次', '三', '四'][i]!) }
}
export function takingPlans(im: ImId, cut: Cut, codeLength: number): Pick[] {
  if (!cut.parts.length) return []
  if (im !== 'cangjie') return [genericPick(cut.parts.length, im === 'dayi' && codeLength <= 3 ? 3 : 4)]
  if (cut.split === undefined) return [genericPick(cut.parts.length, 4)]
  const h = cut.split
  const b = cut.parts.length - h
  const hp = firstLast(h)
  // A divisible 字身 takes its first component's 首尾 and the remainder's 尾.
  // E.g. 謝: 言(YMMR) / 身(HXH)寸(DI) -> YR / HH I.
  const bp = b <= 3 ? indices(b) : cut.bodySplit === undefined || cut.bodySplit === 1
    ? firstTwoLast(b)
    : [...firstLast(cut.bodySplit), b - 1]
  return [{
    picked: [...hp, ...bp.map(i => h + i)],
    roles: [...hp.map((_, i) => hp.length === 1 ? '字首' : i === 0 ? '字首首' : '字首尾'),
      ...bp.map((_, i) => bp.length === 1 ? '字身' : i === bp.length - 1 ? '字身尾' : i === 0 ? '字身首' : '字身次')],
  }]
}
export function resolve(cut: Cut, plan: Pick, code: string, ix: RootIndex): DecompEntry | null {
  if (plan.picked.length !== code.length) return null
  const parts: DecompEntry['parts'] = []
  for (let i = 0; i < cut.parts.length; i++) {
    const part = cut.parts[i]!
    const pos = plan.picked.indexOf(i)
    const key = pos >= 0 ? code[pos]! : part.key ?? [...(ix.keysOf.get(part.component) ?? [])][0]
    if (!key || (part.key && part.key !== key) || !ix.keysOf.get(part.component)?.has(key)) return null
    parts.push({ ...part, key })
  }
  return { code, parts, ...plan }
}
/** All build paths, including manual imports, pass this gate. */
export function validEntry(entry: DecompEntry, im: ImId, ch: string, table: Record<string, string[]>, ix: RootIndex, plans: Pick[]): boolean {
  return table[entry.code]?.includes(ch) === true
    && entry.picked.length === entry.roles.length
    && entry.picked.every(i => Number.isInteger(i) && i >= 0 && i < entry.parts.length)
    && new Set(entry.picked).size === entry.picked.length
    && entry.picked.map(i => entry.parts[i]!.key).join('') === entry.code
    && entry.parts.every(p => ix.keysOf.get(p.component)?.has(p.key)
      && (p.root === undefined || ix.keysOf.get(p.root)?.has(p.key)))
    && plans.some(p => JSON.stringify(p) === JSON.stringify({ picked: entry.picked, roles: entry.roles }))
    && (im !== 'boshiamy' || entry.roles.filter(r => r === '補').length <= 1)
}
