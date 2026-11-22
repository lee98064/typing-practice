import type { ImId, ImMeta, ImTableFile } from './types'

/** Entries remain in source order, including duplicates; conversion deduplicates them. */
export interface ParsedCin {
  ename: string
  cname: string
  selKeys: string
  endKeys: string
  keynames: Record<string, string>
  entries: { code: string; candidate: string }[]
}

/** Parse the portable subset of CIN used by all five tables. Unknown directives are harmless. */
export function parseCin(text: string): ParsedCin {
  const result: ParsedCin = {
    ename: '', cname: '', selKeys: '', endKeys: '', keynames: {}, entries: [],
  }
  let section: 'keyname' | 'chardef' | undefined
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r\n?|\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const fields = /^(\S+)[\t ]+(.+)$/.exec(line)
    if (!fields) continue
    const key = fields[1]!.toLowerCase()
    // Strip trailing comments after a value, preserving a literal '#' candidate.
    const value = fields[2]!.replace(/[\t ]+#.*$/, '').trim()
    if (key.startsWith('%')) {
      const directive = key.slice(1)
      if (directive === 'keyname' || directive === 'chardef') {
        section = value.toLowerCase() === 'begin' ? directive : undefined
      } else if (directive === 'ename') result.ename = value
      else if (directive === 'cname') result.cname = value
      else if (directive === 'selkey') result.selKeys = value.toLowerCase()
      else if (directive === 'endkey') result.endKeys = value.toLowerCase()
    } else if (value && section === 'keyname') {
      Object.defineProperty(result.keynames, key, { value, enumerable: true, configurable: true, writable: true })
    } else if (value && section === 'chardef') {
      result.entries.push({ code: key, candidate: value })
    }
  }
  return result
}

export function cinToTableFile(cinText: string, meta: Partial<ImMeta> & { id: ImId }): ImTableFile {
  const parsed = parseCin(cinText)
  const candidates = new Map<string, Set<string>>()
  let maxLength = 0
  for (const { code, candidate } of parsed.entries) {
    let values = candidates.get(code)
    if (!values) candidates.set(code, values = new Set())
    values.add(candidate)
    maxLength = Math.max(maxLength, code.length)
  }
  const name = meta.name ?? (parsed.cname || parsed.ename || meta.id)
  return {
    meta: {
      id: meta.id,
      name,
      shortName: meta.shortName ?? [...name][0] ?? meta.id,
      version: meta.version ?? '',
      maxCodeLength: meta.maxCodeLength ?? Math.max(1, maxLength),
      selKeys: meta.selKeys ?? parsed.selKeys,
      selLabels: meta.selLabels ?? meta.selKeys ?? parsed.selKeys,
      commitKeys: meta.commitKeys ?? ` ${parsed.endKeys}`,
      rule: meta.rule ?? '',
      source: meta.source ?? '',
      license: meta.license ?? '',
    },
    keynames: parsed.keynames,
    table: Object.fromEntries([...candidates].map(([code, values]) => [code, [...values]])),
  }
}
