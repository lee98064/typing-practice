import type { Atom, Cut, Node } from './decomp'

export type StrokeMap = Record<string, string>

/** Conflicting CNS glyphs for one Unicode character are not stroke evidence. */
export function strokeMap(text: string, cnsChars: Map<string, string>, relevant: Set<string>) {
  const variants = new Map<string, Set<string>>()
  for (const line of text.trim().split('\n')) {
    const [cns, seq] = line.trim().split('\t')
    const ch = cnsChars.get(cns!)
    if (!ch || !relevant.has(ch) || !seq) continue
    if (!variants.has(ch)) variants.set(ch, new Set())
    variants.get(ch)!.add(seq)
  }
  const sequences: StrokeMap = {}
  const conflicts: string[] = []
  for (const [ch, seqs] of [...variants].sort(([a], [b]) => a.codePointAt(0)! - b.codePointAt(0)!)) {
    if (seqs.size !== 1) { conflicts.push(ch); continue }
    const seq = [...seqs][0]!
    // 0 (empty) and 6 (circle) are not ordinary strokes and cannot supply counts.
    if (/^[1-5]+$/.test(seq)) sequences[ch] = seq
  }
  return { sequences, conflicts }
}

const SUPPLEMENTS: Record<string, Atom> = {
  '1': { component: '一', key: 'e', group: '補' },
  '2': { component: '丨', key: 'i', group: '補' },
  '3': { component: '丿', key: 'p', group: '補' },
}

/** CNS 4 merges dot/press; CNS 5 merges several bends. Never choose via the code. */
export function strokeSupplement(sequence: string | undefined, shape?: string): Atom | undefined {
  const last = sequence?.at(-1)
  if (last && SUPPLEMENTS[last]) return { ...SUPPLEMENTS[last] }
  if (last === '4' && (shape === '㇏' || shape === '丶')) {
    return { component: shape, key: shape === '㇏' ? 'n' : 'a', group: '補' }
  }
}

/** Prefer larger proven roots at the first difference; unknown counts get no bonus. */
export function compareLargeRoots(a: Cut, b: Cut, strokes: StrokeMap): number {
  for (let i = 0; i < Math.max(a.parts.length, b.parts.length); i++) {
    const ac = strokes[a.parts[i]?.component ?? '']?.length ?? 0
    const bc = strokes[b.parts[i]?.component ?? '']?.length ?? 0
    if (ac !== bc) return bc - ac
  }
  return a.parts.length - b.parts.length
}

/** Counts delimit component spans; only an exact, unique concatenation orders them.
 * Interleaved enclosures (e.g. 囗 closes last) provide no such evidence. */
export function surroundOrder(node: Node, parent: string | undefined, strokes: StrokeMap): number[] | undefined {
  if (typeof node === 'string' || !'⿴⿵⿶⿷⿸⿹⿺'.includes(node.idc) || !parent) return
  const seq = (n: Node): string | undefined => {
    if (typeof n === 'string') return strokes[n]
    if (!'⿰⿱⿲⿳'.includes(n.idc)) return
    const kids = n.kids.map(seq)
    return kids.every(s => s !== undefined) ? kids.join('') : undefined
  }
  const [outer, inner] = node.kids.map(seq)
  if (!outer || !inner || outer.length + inner.length !== parent.length) return
  const forward = parent.slice(0, outer.length) === outer && parent.slice(outer.length) === inner
  const reverse = parent.slice(0, inner.length) === inner && parent.slice(inner.length) === outer
  if (forward === reverse) return
  return forward ? [0, 1] : [1, 0]
}
