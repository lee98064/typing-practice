import { readFile } from 'node:fs/promises'
import { parse } from './decomp'
import type { Node } from './decomp'

const ROOT = new URL('../../', import.meta.url)
const read = (p: string) => readFile(new URL(p, ROOT), 'utf8')
const json = async <T>(p: string) => JSON.parse(await read(p)) as T

export async function loadDecompSources() {
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

  const relevant = new Set<string>()
  const collect = (ch: string) => {
    if (relevant.has(ch)) return
    relevant.add(ch)
    const visit = (n: Node) => typeof n === 'string' ? collect(n) : n.kids.forEach(visit)
    const tree = trees.get(ch)
    if (tree) visit(tree)
    for (const c of cnsOf.get(ch) ?? []) collect(c)
    for (const c of cnsEquivalent.get(ch) ?? []) collect(c)
  }
  targets.forEach(collect)
  return { idsOf, trees, cnsChars, cnsOf, cnsEquivalent, targets, relevant }
}
