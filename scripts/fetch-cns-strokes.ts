/** Refresh the scoped CNS source: node --import tsx scripts/fetch-cns-strokes.ts */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadDecompSources } from './lib/decomp-sources'

const ROOT = new URL('../', import.meta.url)
const URL_SOURCE = 'https://data.cns11643.gov.tw/opendata/Properties.zip'
const FILE = 'CNS_strokes_sequence.txt'
const sha = (data: string | Buffer) => createHash('sha256').update(data).digest('hex')
const { cnsChars, relevant } = await loadDecompSources()
const temp = await mkdtemp(join(tmpdir(), 'modaa-cns-'))
try {
  const archive = join(temp, 'Properties.zip')
  execFileSync('curl', ['-fsSL', '--retry', '2', '--max-time', '120', URL_SOURCE, '-o', archive])
  const zip = await readFile(archive)
  const original = execFileSync('unzip', ['-p', archive, FILE], { maxBuffer: 10_000_000 })
  const lines = original.toString('utf8').trimEnd().split('\n').filter(line => {
    const ch = cnsChars.get(line.split('\t')[0]!)
    return ch !== undefined && relevant.has(ch)
  })
  const subset = lines.join('\n') + '\n'
  if (Buffer.byteLength(subset) >= 1_000_000) throw Error('Scoped CNS source exceeds 1 MB')
  await mkdir(new URL('data-raw/cns/', ROOT), { recursive: true })
  await writeFile(new URL(`data-raw/cns/${FILE}`, ROOT), subset)
  const maps: string[] = []
  for (const version of ['BMP', '2', '3', '15']) {
    const path = `data-raw/charlists/CNS2UNICODE_Unicode ${version}.txt`
    maps.push(`${path}: ${sha(await readFile(new URL(path, ROOT)))}`)
  }
  const note = `CNS11643 全字庫 — 筆順屬性資料\n提供機關：數位發展部\nSource: ${URL_SOURCE}\nDataset: https://data.gov.tw/dataset/5961\nDownloaded (UTC): ${new Date().toISOString()}\nLicense selected: 政府資料開放授權條款第1版 (OGDL-1.0)\nLicense: https://data.gov.tw/license\nThe dataset offers OGDL-1.0 or OFL-1.1; this copy selects OGDL-1.0.\n\nSHA-256 Properties.zip: ${sha(zip)}\nSHA-256 original ${FILE}: ${sha(original)}\nOriginal bytes: ${original.length}\nSHA-256 retained ${FILE}: ${sha(subset)}\nRetained bytes / rows: ${Buffer.byteLength(subset)} / ${lines.length}\n\nThe upstream member is named CNS_strokes_sequence.txt (plural strokes).\nTo keep every added file under 1 MB, retain verbatim rows whose CNS codes map\nto MOE 4808 / article characters or their recursive IDS/CNS components and\nexact CNS single-component equivalents. Row order and values are unchanged.\nThe original archive/member (>1 MB) and all other members are not retained.\nThis scoped selection and the derived Unicode map are modifications.\nNo endorsement by the provider is implied.\n\nCNS codes: 1 horizontal, 2 vertical, 3 left-falling, 4 dot/right-falling,\n5 turning. Type 4 does not distinguish 點 from 捺; type 5 is not a unique shape.\n0/6 and conflicting Unicode sequences are excluded from derived evidence.\nReference: https://www.cns11643.gov.tw/search.jsp?ID=8&la=1\n\nExisting Unicode maps (SHA-256):\n${maps.join('\n')}\n\nRefresh: node --import tsx scripts/fetch-cns-strokes.ts\nDerive compact map / decompositions: node --import tsx scripts/build-decomp.ts\n`
  await writeFile(new URL('data-raw/cns/LICENSE-SOURCE.txt', ROOT), note)
  console.log(`CNS scoped source: ${lines.length} rows, ${Buffer.byteLength(subset)} bytes; archive and original SHA-256 recorded`)
} finally {
  await rm(temp, { recursive: true, force: true })
}
