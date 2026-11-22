import { createInputMethod } from './im'
import type { DecompFile, ImId, ImTableFile, InputMethod, RootsFile } from './types'
import type { ZhuyinPhraseFile } from './zhuyin-reading'

export interface LoadInputMethodOptions {
  base: string
  fetchJson: (url: string) => Promise<unknown>
  overrides?: Partial<Record<ImId, ImTableFile>>
}

type Overrides = LoadInputMethodOptions['overrides']
interface Cache {
  methods: Map<ImId, Promise<InputMethod>>
  tables: Map<ImId, Promise<ImTableFile>>
}

// Scope caches by source, base URL and overrides identity: different tests/sites cannot leak data.
const caches = new WeakMap<LoadInputMethodOptions['fetchJson'], Map<string, Map<Overrides, Cache>>>()

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item: unknown) => typeof item === 'string')
}

function stringRecord(value: unknown): value is Record<string, string> {
  return record(value) && Object.values(value).every((item) => typeof item === 'string')
}

function isTable(value: unknown, id: ImId): value is ImTableFile {
  if (!record(value) || !record(value.meta) || value.meta.id !== id) return false
  const { meta } = value
  return ['name', 'shortName', 'version', 'selKeys', 'selLabels', 'commitKeys', 'rule', 'source', 'license']
    .every((key) => typeof meta[key] === 'string')
    && typeof meta.maxCodeLength === 'number' && Number.isInteger(meta.maxCodeLength) && meta.maxCodeLength > 0
    && stringRecord(value.keynames) && record(value.table) && Object.values(value.table).every(strings)
}

function isRoots(value: unknown, id: ImId): value is RootsFile {
  return record(value) && value.im === id && Array.isArray(value.keys)
    && value.keys.every((key: unknown) => record(key) && typeof key.key === 'string'
      && typeof key.label === 'string' && strings(key.roots))
    && Array.isArray(value.rules) && value.rules.every((rule: unknown) => record(rule)
      && typeof rule.title === 'string' && typeof rule.body === 'string')
}

function isDecomp(value: unknown): value is DecompFile {
  return record(value) && Object.values(value).every((entries) => Array.isArray(entries)
    && entries.every((entry: unknown) => record(entry) && typeof entry.code === 'string'
      && (entry.ids === undefined || typeof entry.ids === 'string')
      && (entry.explanation === undefined || strings(entry.explanation)) && strings(entry.roles) && Array.isArray(entry.picked)
      && entry.picked.every((index: unknown) => typeof index === 'number' && Number.isInteger(index) && index >= 0)
      && Array.isArray(entry.parts) && entry.parts.every((part: unknown) => record(part)
        && typeof part.component === 'string' && (part.root === undefined || typeof part.root === 'string')
        && (part.group === undefined || typeof part.group === 'string') && typeof part.key === 'string')))
}

function isPhrases(value: unknown): value is ZhuyinPhraseFile {
  return record(value) && record(value.phrases) && Object.values(value.phrases).every(strings)
}

function cacheFor(options: LoadInputMethodOptions, base: string): Cache {
  let sources = caches.get(options.fetchJson)
  if (!sources) caches.set(options.fetchJson, sources = new Map())
  let variants = sources.get(base)
  if (!variants) sources.set(base, variants = new Map())
  let cache = variants.get(options.overrides)
  if (!cache) variants.set(options.overrides, cache = { methods: new Map(), tables: new Map() })
  return cache
}

/** Required files fail clearly; missing optional decomposition/phrase files are harmless. */
export function loadInputMethod(id: ImId, options: LoadInputMethodOptions): Promise<InputMethod> {
  const base = options.base && !options.base.endsWith('/') ? `${options.base}/` : options.base
  const cache = cacheFor(options, base)
  const cached = cache.methods.get(id)
  if (cached) return cached

  const fetchTable = (tableId: ImId): Promise<ImTableFile> => {
    const pending = cache.tables.get(tableId)
    if (pending) return pending
    const url = `${base}data/im/${tableId}.json`
    const table = Promise.resolve().then(async () => {
      const value: unknown = options.overrides?.[tableId] ?? await options.fetchJson(url)
      if (!isTable(value, tableId)) throw new Error(`Invalid IM table: ${url}`)
      return value
    }).catch((error: unknown) => {
      cache.tables.delete(tableId)
      throw error
    })
    cache.tables.set(tableId, table)
    return table
  }
  const optional = (url: string): Promise<unknown> => Promise.resolve().then(() => options.fetchJson(url)).catch(() => undefined)
  const pending = Promise.all([
    fetchTable(id),
    Promise.resolve().then(() => options.fetchJson(`${base}data/roots/${id}.json`)),
    optional(`${base}data/decomp/${id}.json`),
    fetchTable('zhuyin'),
    optional(`${base}data/zhuyin-phrases.json`),
  ]).then(([table, roots, decomp, zhuyin, phrases]) => {
    if (!isRoots(roots, id)) throw new Error(`Invalid roots file: ${base}data/roots/${id}.json`)
    return createInputMethod({
      table, roots, decomp: isDecomp(decomp) ? decomp : undefined,
      zhuyin: { table: zhuyin, phrases: isPhrases(phrases) ? phrases : undefined },
    })
  }).catch((error: unknown) => {
    cache.methods.delete(id)
    throw error
  })
  cache.methods.set(id, pending)
  return pending
}
