import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { cinToTableFile } from '../src/core/cin'
import type { ImId, ImMeta, RootsFile } from '../src/core/types'

const root = new URL('../', import.meta.url)
const definitions: { id: ImId; filename: string; meta: Partial<ImMeta> }[] = [
  {
    id: 'boshiamy', filename: 'boshiamy.cin',
    meta: {
      name: '嘸蝦米', shortName: '嘸', version: 'liu57', maxCodeLength: 5,
      selKeys: '0123456789', selLabels: '0123456789', commitKeys: ' ',
      rule: '依字形、字音、字義取碼，最多五碼；同碼字可選字或使用字表所列後綴碼。',
      source: '使用者提供之嘸蝦米 liu57a_ersu 字表；http://input.foruto.com/boshiamy/；http://www.liu.com.tw/',
    },
  },
  {
    id: 'zhuyin', filename: 'bopomofo.cin',
    meta: {
      name: '注音', shortName: '注', version: '大千', maxCodeLength: 4,
      selKeys: '123456789', selLabels: '123456789', commitKeys: ' 3467',
      rule: '依聲母、介音、韻母組音；空白為第一聲，3、4、6、7 分別為三、四、二、輕聲。',
      source: '使用者提供之大千鍵位 bopomofo.cin（data-raw/boshiamy/bopomofo.cin）',
      license: '原始 bopomofo.cin 未附授權聲明。',
    },
  },
]

await mkdir(new URL('public/data/im/', root), { recursive: true })
await mkdir(new URL('public/data/roots/', root), { recursive: true })
for (const { id, filename, meta } of definitions) {
  const text = await readFile(new URL(`data-raw/boshiamy/${filename}`, root), 'utf8')
  const license = id === 'boshiamy'
    ? text.split(/\r?\n/).filter((line) => /^#(?:copyright|格式轉換|授權方式)/i.test(line)).join('\n')
    : meta.license
  const table = cinToTableFile(text, { ...meta, id, license })
  await writeFile(new URL(`public/data/im/${id}.json`, root), `${JSON.stringify(table, null, 2)}\n`)
  const roots: RootsFile & { placeholder: true } = {
    im: id, placeholder: true,
    keys: Object.entries(table.keynames).map(([key, label]) => ({ key, label, roots: [label] })),
    rules: [{ title: '取碼規則', body: table.meta.rule }],
  }
  const rootsPath = new URL(`public/data/roots/${id}.json`, root)
  // Re-running conversion must not overwrite enrichment subsequently supplied by the pipeline.
  let replaceRoots = true
  try {
    const existing: unknown = JSON.parse(await readFile(rootsPath, 'utf8'))
    replaceRoots = typeof existing === 'object' && existing !== null && 'placeholder' in existing && existing.placeholder === true
  } catch (error: unknown) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
  }
  if (replaceRoots) await writeFile(rootsPath, `${JSON.stringify(roots, null, 2)}\n`)
  console.log(`${id}: ${Object.keys(table.table).length} codes`)
}
