/**
 * 墨打 data pipeline: data-raw/** → public/data/**
 *
 *   pnpm tsx scripts/build-data.ts
 *
 * Produces IM tables, root charts, zhuyin phrase hints, articles, sources.json and a coverage
 * report (docs/data-report.md). Every output is derived from redistributable sources only;
 * see docs/research/im-sources.md for the licensing analysis.
 */
import { mkdir, readFile, readdir, writeFile, rm } from 'node:fs/promises'
import { cinToTableFile, parseCin } from '../src/core/cin'
import type { Article, ArticleCategory, ArticleMeta, ImId, ImMeta, ImTableFile, RootsFile } from '../src/core/types'

const ROOT = new URL('../', import.meta.url)
const path = (p: string) => new URL(p, ROOT)
const read = (p: string) => readFile(path(p), 'utf8')
const json = async <T>(p: string): Promise<T> => JSON.parse(await read(p)) as T
async function write(p: string, data: unknown) {
  await mkdir(new URL('.', path(p)), { recursive: true })
  await writeFile(path(p), typeof data === 'string' ? data : `${JSON.stringify(data)}\n`)
}

const HAN = /[\p{Unified_Ideograph}豈-﫿〇]/u
const report: string[] = ['# 資料建置報告', '', `產生時間：${new Date().toISOString()}`, '']

// ───────────────────────── character frequency ─────────────────────────
const freqRank = new Map<string, number>()
for (const line of (await read('data-raw/charlists/wikipedia-zh-tw-frequency.tsv')).split('\n').slice(1)) {
  const [rank, ch] = line.split('\t')
  if (ch && rank && !freqRank.has(ch)) freqRank.set(ch, Number(rank))
}
const rankOf = (ch: string) => freqRank.get(ch) ?? 99_999
const common4808 = new Set([...(await read('data-raw/charlists/moe-common-4808.txt'))].filter((c) => HAN.test(c)))

// ───────────────────────── IM tables ─────────────────────────
const RULES: Record<ImId, string> = {
  zhuyin: '依讀音拼出聲母、介音、韻母，再按聲調鍵（3 上聲、4 去聲、6 陽平、7 輕聲）送字；第一聲按空白鍵。',
  boshiamy: '字根依字母的形、音、義歸鍵；依書寫順序取根，超過四根取首、次、三、尾。只有一兩根時補末筆或規定碼。重碼按 0–9 選字，或加 V/R/S/F… 尾碼。',
  array: '依筆順取字根，最多四根；超過四根取前三根加最後一根。字根依「行（1–0）× 列（上中下）」的鍵盤位置記憶。一、二碼簡碼需按數字選字。',
  dayi: '依筆順取涵蓋最多筆畫的字根；超過三根取首根、次根和尾根。字根依意義歸鍵（言、牛、目…），0–9 數字鍵也是字根。重碼按 \' [ ] - \\ 選字。',
  cangjie: '先分字首與字身：字首取首尾兩碼，字身取首、次、尾三碼，總長最多五碼。不可分割的字取首、次、三、尾。X 為難字，Z 為符號。',
}

function uniqPush(map: Map<string, string[]>, code: string, ch: string) {
  const list = map.get(code)
  if (!list) map.set(code, [ch])
  else if (!list.includes(ch)) list.push(ch)
}

function toFile(meta: ImMeta, keynames: Record<string, string>, table: Map<string, string[]>, shortcodes?: Record<string, string[]>): ImTableFile {
  const keys = new Set(Object.keys(keynames))
  const out: Record<string, string[]> = {}
  let dropped = 0
  for (const [code, cands] of table) {
    if (![...code].every((k) => keys.has(k))) {
      dropped++
      continue // codes using non-composition keys (e.g. 行列 w1 symbol pages) are untypeable here
    }
    out[code] = cands
  }
  if (dropped) report.push(`- ${meta.name}：略過 ${dropped} 組含非字根鍵的碼（符號選單等）`)
  return { meta, keynames, table: out, ...(shortcodes ? { shortcodes } : {}) }
}

// 嘸蝦米 — user-provided liu57 table, verbatim codes.
const liuText = await read('data-raw/boshiamy/boshiamy.cin')
const liuLicense = liuText.split(/\r?\n/).filter((l) => /^#(copyright|格式轉換|授權方式)/i.test(l)).map((l) => l.slice(1)).join('；')
const boshiamy = cinToTableFile(liuText, {
  id: 'boshiamy', name: '嘸蝦米', shortName: '嘸', version: 'liu57', maxCodeLength: 5,
  selKeys: '0123456789', selLabels: '0123456789', commitKeys: ' ', rule: RULES.boshiamy,
  source: '嘸蝦米 liu57a_ersu 字表（蝦米族樂園 input.foruto.com；行易有限公司 liu.com.tw）',
  license: liuLicense,
})

// 注音 — McBopomofo BPMFBase (MIT + libtabe BSD). physical column = 大千 keys.
const zhuyinMap = new Map<string, string[]>()
const readingsOf = new Map<string, string[]>()
const symbolToCode = new Map<string, string>()
for (const line of (await read('data-raw/zhuyin/BPMFBase.txt')).split('\n')) {
  const [ch, bpmf, , physical] = line.trim().split(/\s+/)
  if (!ch || !bpmf || !physical || [...ch].length !== 1) continue
  if (physical.length > 4 || !/^[0-9a-z,./;-]+$/.test(physical)) continue // malformed source rows (e.g. 𰻞)
  uniqPush(zhuyinMap, physical, ch)
  const r = readingsOf.get(ch)
  if (!r) readingsOf.set(ch, [physical])
  else if (!r.includes(physical)) r.push(physical)
  symbolToCode.set(bpmf, physical)
}
for (const list of zhuyinMap.values()) list.sort((a, b) => rankOf(a) - rankOf(b))
const zhuyinRoots = await json<RootsFile>('data-raw/roots/zhuyin.json')
const zhuyinKeynames = Object.fromEntries(zhuyinRoots.keys.map((k) => [k.key, k.label]))
const zhuyin = toFile({
  id: 'zhuyin', name: '注音', shortName: '注', version: '大千', maxCodeLength: 4,
  selKeys: '123456789', selLabels: '123456789', commitKeys: ' 3467', rule: RULES.zhuyin,
  source: 'McBopomofo 字音表 BPMFBase（openvanilla/McBopomofo）',
  license: 'MIT License（McBopomofo）；含 libtabe BSD-style 聲明',
}, zhuyinKeynames, zhuyinMap)

// 行列30 — gontera array30 (main) + 特別碼 + 一二級簡碼.
const arrMain = parseCin(await read('data-raw/array/array30.cin'))
const arrKeynames = Object.fromEntries(Object.entries(arrMain.keynames).filter(([k]) => /^[a-z,./;]$/.test(k)))
const arrTable = new Map<string, string[]>()
const special = parseCin(await read('data-raw/array/array-special.cin'))
let collisions = 0
for (const { code, candidate } of special.entries) {
  if (arrMain.entries.some((e) => e.code === code)) collisions++
  uniqPush(arrTable, code, candidate) // 特別碼 first: Space commits it directly
}
for (const { code, candidate } of arrMain.entries) {
  if ((candidate.codePointAt(0) ?? 0) > 0xffff) continue // Ext B+ rare chars: keep the PWA light
  uniqPush(arrTable, code, candidate)
}
const arrShort: Record<string, string[]> = {}
for (const { code, candidate } of parseCin(await read('data-raw/array/array-shortcode.cin')).entries) {
  ;(arrShort[code] ??= []).push(candidate === '⎔' ? '' : candidate)
}
report.push(`- 行列：特別碼 ${special.entries.length} 筆（與主表同碼 ${collisions} 組，特別碼排第一）；簡碼 ${Object.keys(arrShort).length} 組`)
const array = toFile({
  id: 'array', name: '行列', shortName: '行', version: '行列30', maxCodeLength: 5,
  selKeys: '1234567890', selLabels: '1234567890', commitKeys: ' ', rule: RULES.array,
  source: '行列30 字表 v2026-1.11（github.com/gontera/array30），含特別碼與一二級簡碼',
  license: '行列科技廖明德先生授權各中文系統免費植入行列輸入法及對照表；保留來源與維護者',
}, arrKeynames, arrTable, arrShort)

// 大易三碼 — OpenVanilla historical dayi3.cin with 太易 permission (codes unchanged).
const dayiText = await read('data-raw/dayi/dayi3.cin')
const dayiParsed = parseCin(dayiText)
const dayiTable = new Map<string, string[]>()
for (const { code, candidate } of dayiParsed.entries) uniqPush(dayiTable, code, candidate)
const dayi = toFile({
  id: 'dayi', name: '大易', shortName: '易', version: '大易三碼', maxCodeLength: 4,
  selKeys: " '[]-\\", selLabels: "␣'[]-\\", commitKeys: ' ', rule: RULES.dayi,
  source: '大易三碼字表 dayi3.cin（OpenVanilla DataTables，太易資訊授權）',
  license: '本表格由太易資訊公司授權開放下載使用；不得任意更改每字編碼規則並重新散佈，允許改變格式',
}, dayiParsed.keynames, dayiTable)

// 倉頡三代 — ibus-table-chinese cangjie3.txt ("Freely redistributable without restriction").
const cjText = await read('data-raw/cangjie/cangjie3.txt')
const cjKeynames: Record<string, string> = {}
const prompts = /BEGIN_CHAR_PROMPTS_DEFINITION\n([\s\S]*?)END_CHAR_PROMPTS_DEFINITION/.exec(cjText)?.[1] ?? ''
for (const line of prompts.split('\n')) {
  const [k, v] = line.trim().split(/\s+/)
  if (k && v) cjKeynames[k.toLowerCase()] = v
}
const cjRows: { code: string; ch: string; f: number; i: number }[] = []
const body = /BEGIN_TABLE\n([\s\S]*?)END_TABLE/.exec(cjText)?.[1] ?? ''
body.split('\n').forEach((line, i) => {
  const [code, ch, f] = line.split('\t')
  if (code && ch && !line.startsWith('#')) cjRows.push({ code: code.toLowerCase(), ch, f: Number(f) || 0, i })
})
cjRows.sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : b.f - a.f || a.i - b.i))
const cjTable = new Map<string, string[]>()
for (const r of cjRows) uniqPush(cjTable, r.code, r.ch)
const cangjie = toFile({
  id: 'cangjie', name: '倉頡', shortName: '倉', version: '倉頡三代', maxCodeLength: 5,
  selKeys: '123456789', selLabels: '123456789', commitKeys: ' ', rule: RULES.cangjie,
  source: '倉頡第三代字表 cangjie3.txt（ibus-table-chinese，SERIAL 2004111801）',
  license: 'Freely redistributable without restriction（檔內聲明，保留原標頭）',
}, cjKeynames, cjTable)

const TABLES: Record<ImId, ImTableFile> = { zhuyin, boshiamy, array, dayi, cangjie }
for (const [id, t] of Object.entries(TABLES)) {
  await write(`public/data/im/${id}.json`, t)
  report.push(`- ${t.meta.name}（${t.meta.version}）：${Object.keys(t.table).length.toLocaleString()} 組碼`)
}

// ───────────────────────── roots ─────────────────────────
interface RawRootKey { key: string; label: string; roots: string[]; category?: string; mnemonic?: string; note?: string; shortcutRoots?: string[] }
interface RawRoots { keys: RawRootKey[]; groups?: { name: string; keys: string[]; note?: string }[]; rules?: { title: string; body: string; examples?: { char: string; code: string; explain: string }[] }[] }

const codesOf = (t: ImTableFile) => {
  const m = new Map<string, string[]>()
  for (const [code, cands] of Object.entries(t.table)) for (const c of cands) uniqPush(m, c, code)
  for (const [code, slots] of Object.entries(t.shortcodes ?? {})) for (const c of slots) if (c) uniqPush(m, c, code)
  return m
}
const reverse: Record<ImId, Map<string, string[]>> = Object.fromEntries(
  Object.entries(TABLES).map(([id, t]) => [id, codesOf(t)]),
) as Record<ImId, Map<string, string[]>>

report.push('', '## 字根表範例驗證', '')
for (const id of Object.keys(TABLES) as ImId[]) {
  const raw = await json<RawRoots>(`data-raw/roots/${id}.json`)
  let bad = 0
  const rules = (raw.rules ?? []).map((r) => ({
    title: r.title,
    body: r.body,
    examples: (r.examples ?? []).filter((ex) => {
      const code = ex.code.toLowerCase().replace(/[^0-9a-z,./;'\[\]\\-]/g, '')
      const ok = id === 'zhuyin' || (reverse[id].get(ex.char) ?? []).includes(code)
      if (!ok) bad++
      return ok
    }).map((ex) => ({ ...ex, code: ex.code.toLowerCase() })),
  }))
  const keys = raw.keys.map((k) => ({
    key: k.key.toLowerCase(),
    label: id === 'array' ? (arrKeynames[k.key.toLowerCase()] ?? k.label) : k.label,
    roots: k.roots,
    ...(k.category ? { category: k.category } : {}),
    ...(k.mnemonic ? { mnemonic: k.mnemonic } : {}),
    ...(k.note ? { note: k.note } : {}),
    ...(k.shortcutRoots?.length ? { shortcutRoots: k.shortcutRoots } : {}),
  }))
  const out: RootsFile = {
    im: id,
    keys,
    groups: (raw.groups ?? []).map((g) => ({ name: g.name, keys: g.keys.map((k) => k.toLowerCase()), ...(g.note ? { note: g.note } : {}) })),
    rules,
  }
  await write(`public/data/roots/${id}.json`, out)
  report.push(`- ${id}：${keys.length} 鍵；範例 ${rules.reduce((s, r) => s + (r.examples?.length ?? 0), 0)} 個通過、${bad} 個與字表不符已移除`)
}

// ───────────────────────── zhuyin phrases (heteronyms) ─────────────────────────
const heteronyms = new Set([...readingsOf].filter(([, r]) => r.length > 1).map(([c]) => c))
const phraseRows: { phrase: string[]; codes: string[] }[] = []
const readingCount = new Map<string, Map<string, number>>()
for (const line of (await read('data-raw/zhuyin/BPMFMappings.txt')).split('\n')) {
  const parts = line.trim().split(/\s+/)
  const phrase = [...(parts[0] ?? '')]
  const syll = parts.slice(1)
  if (phrase.length < 2 || phrase.length !== syll.length) continue
  const codes = syll.map((s) => symbolToCode.get(s))
  if (codes.some((c) => !c)) continue
  phraseRows.push({ phrase, codes: codes as string[] })
  phrase.forEach((ch, i) => {
    if (!heteronyms.has(ch)) return
    let m = readingCount.get(ch)
    if (!m) readingCount.set(ch, (m = new Map()))
    m.set(codes[i]!, (m.get(codes[i]!) ?? 0) + 1)
  })
}
const defaults: Record<string, string> = {}
for (const [ch, m] of readingCount) {
  const best = [...m].sort((a, b) => b[1] - a[1])[0]
  if (best) defaults[ch] = best[0]
}
const phrases: Record<string, string[]> = {}
for (const { phrase, codes } of phraseRows) {
  if (phrase.length > 4) continue
  const needed = phrase.some((ch, i) => heteronyms.has(ch) && codes[i] !== (defaults[ch] ?? readingsOf.get(ch)?.[0]))
  if (needed) phrases[phrase.join('')] = codes
}
await write('public/data/zhuyin-phrases.json', { defaults, phrases })
report.push('', `- 注音破音：${heteronyms.size} 個多音字、預設讀音 ${Object.keys(defaults).length} 個、保留 ${Object.keys(phrases).length} 個需要詞境的詞`)

// ───────────────────────── articles ─────────────────────────
interface RawArticle { id: string; title: string; author: string; era?: string; category: ArticleCategory; excerpt?: boolean; source: string; license: string }
const manifest = await json<RawArticle[]>('data-raw/articles/manifest.json')
const FIXES: [RegExp, string][] = [[/二＋畝/g, '二十畝'], [/顦顇/g, '憔悴']]
/** Japanese / historical variant forms from transcriptions → Taiwan standard forms (教育部標準字體). */
const VARIANTS: Record<string, string> = {
  説: '說', 罇: '樽', 懐: '懷', 扵: '於', 廻: '迴', 慤: '愨', 綉: '繡', 髙: '高', 歩: '步', 鈎: '鉤',
  緑: '綠', 毎: '每', 髪: '髮', 巵: '卮', 㗖: '啖', 牗: '牖', 顔: '顏', 緜: '綿', 蟇: '蟆', 澘: '潸',
  畱: '留', 煑: '煮', 儍: '傻', 罎: '罈', 偸: '偷', 汚: '污', 窓: '窗', 擧: '舉', 骵: '體', 畄: '留',
  廽: '迴', 㕔: '廳', 厛: '廳', 囬: '回', 亗: '歲', 霛: '靈', 緖: '緒', 揑: '捏', 敍: '敘', 繋: '繫',
}
const CAT_ORDER: ArticleCategory[] = ['古文', '詩詞', '近代散文', '法規公文', '原創']

function normalizeText(t: string): string {
  let s = t.replace(/\r\n?/g, '\n').replace(/^﻿/, '')
  for (const [re, to] of FIXES) s = s.replace(re, to)
  s = [...s].map((c) => VARIANTS[c] ?? c).join('')
  return s
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n')
}

function licenseText(a: RawArticle): string {
  const year = /卒於(約?前?\d+)年/.exec(a.license)?.[1]
  if (a.category === '法規公文') return a.license
  if (a.category === '近代散文' || (year && /^\d{4}$/.test(year) && Number(year) > 1800)) {
    return `Public Domain（作者卒於 ${year} 年，著作財產權已屆滿）`
  }
  return 'Public Domain（古代原文）'
}

await rm(path('public/data/articles'), { recursive: true, force: true })
const metas: ArticleMeta[] = []
const missing: Record<ImId, Map<string, string[]>> = Object.fromEntries(Object.keys(TABLES).map((id) => [id, new Map()])) as Record<ImId, Map<string, string[]>>
const dayiFourOnly = new Map<string, number>()
for (const a of manifest) {
  const text = normalizeText(await read(`data-raw/articles/${a.id}.txt`))
  const cjk = [...text].filter((c) => HAN.test(c))
  const rare = cjk.filter((c) => rankOf(c) > 1500).length / Math.max(1, cjk.length)
  const difficulty = (rare < 0.08 ? 1 : rare < 0.14 ? 2 : rare < 0.2 ? 3 : rare < 0.26 ? 4 : 5) as ArticleMeta['difficulty']
  for (const ch of new Set(cjk)) {
    for (const id of Object.keys(TABLES) as ImId[]) {
      if (!reverse[id].has(ch)) {
        const list = missing[id].get(ch) ?? []
        list.push(a.id)
        missing[id].set(ch, list)
      }
    }
    const dc = reverse.dayi.get(ch)
    if (dc && dc.every((c) => c.length > 3)) dayiFourOnly.set(ch, (dayiFourOnly.get(ch) ?? 0) + 1)
  }
  const meta: ArticleMeta = {
    id: a.id,
    title: a.title.replace(/（節選）$/, ''),
    author: a.author,
    ...(a.era ? { era: a.era } : {}),
    category: a.category,
    excerpt: !!a.excerpt || /節選/.test(a.title),
    source: a.source,
    license: licenseText(a),
    length: cjk.length,
    difficulty,
    preview: text.replace(/\s+/g, '').slice(0, 42),
  }
  metas.push(meta)
  const article: Article = { ...meta, text }
  await write(`public/data/articles/${a.id}.json`, article)
}
metas.sort((x, y) => CAT_ORDER.indexOf(x.category) - CAT_ORDER.indexOf(y.category))
await write('public/data/articles/index.json', metas)

report.push('', '## 文章', '', `- 共 ${metas.length} 篇：${CAT_ORDER.map((c) => `${c} ${metas.filter((m) => m.category === c).length}`).join('、')}`)
report.push(`- 難度分布：${[1, 2, 3, 4, 5].map((d) => `${d}★ ${metas.filter((m) => m.difficulty === d).length}`).join('、')}`)
report.push('', '## 文章用字覆蓋率', '')
for (const id of Object.keys(TABLES) as ImId[]) {
  const m = missing[id]
  report.push(`- ${TABLES[id].meta.name}：缺 ${m.size} 字${m.size ? '：' + [...m.keys()].slice(0, 60).join('') : ''}`)
}
report.push(`- 大易：另有 ${dayiFourOnly.size} 字在原表只有四碼（不改碼，照原表四碼練習）：${[...dayiFourOnly.keys()].slice(0, 80).join('')}`)

// ───────────────────────── sources.json ─────────────────────────
await write('public/data/sources.json', [
  { name: '嘸蝦米字表 liu57a_ersu', usage: '嘸蝦米編碼', license: 'Free for non-commercial use', url: 'http://input.foruto.com/boshiamy/', notice: liuLicense },
  { name: 'McBopomofo 字音與詞音資料', usage: '注音編碼、破音字詞境', license: 'MIT（含 libtabe BSD-style 聲明）', url: 'https://github.com/openvanilla/McBopomofo' },
  { name: '行列30 字表（gontera/array30 v2026-1.11）', usage: '行列編碼、特別碼、簡碼', license: '行列科技授權免費植入', url: 'https://github.com/gontera/array30', notice: '行列輸入法發明人廖明德先生授權各中文系統免費植入行列輸入法及對照表。' },
  { name: '大易三碼字表 dayi3.cin', usage: '大易編碼', license: '太易資訊授權開放下載使用', url: 'https://github.com/openvanilla/openvanilla', notice: '本表格由太易資訊公司（dayi.com）授權，開放給使用者下載使用。使用者不得任意更改此表格中每個字的編碼規則並重新散佈。' },
  { name: '倉頡第三代字表 cangjie3.txt', usage: '倉頡編碼', license: 'Freely redistributable without restriction', url: 'https://github.com/definite/ibus-table-chinese' },
  { name: '中文字頻（Wikipedia zh-TW 衍生，hanzi-frequency）', usage: '候選排序、文章難度', license: 'MIT', url: 'https://github.com/' },
  { name: '教育部常用國字標準字體表 4808 字', usage: '常用字範圍', license: '政府資料開放授權 / CC BY-SA 轉錄', url: 'https://www.cns11643.gov.tw/' },
  { name: 'CNS11643 中文標準交換碼全字庫 部件資料', usage: '拆字部件', license: '政府資料開放授權條款第 1 版（OGDL-1.0）', url: 'https://data.gov.tw/dataset/5961' },
  { name: 'cjkvi-ids（CHISE IDS Database 衍生）', usage: '字形結構，用於產生拆字資料 public/data/decomp', license: 'GPL-2.0（衍生的拆字資料依同授權提供）', url: 'https://github.com/cjkvi/cjkvi-ids' },
  { name: '內建文章（維基文庫等）', usage: '練習文章', license: '公有領域 / 著作權法第 9 條', url: 'https://zh.wikisource.org/' },
])

await write('docs/data-report.md', `${report.join('\n')}\n`)
console.log(report.join('\n'))
