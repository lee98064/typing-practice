/** T6 reporting only; the builder's decomposition/validation gates stay unchanged. */
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import type { DecompFile, ImId, ImTableFile } from '../../src/core/types'

const ROOT = new URL('../../', import.meta.url)
const read = (path: string) => readFile(new URL(path, ROOT), 'utf8')
const json = async <T>(path: string) => JSON.parse(await read(path)) as T
interface FrequencyCoverage { verified: number; total: number; coveredWeight: number; totalWeight: number }
interface Baseline { frequencySha256: string; byIm: Record<ImId, { overall: number; frequency: Record<number, FrequencyCoverage> }> }
export interface ManualSummary { im: ImId; denominator: number; accepted: string[]; rejected: number }
const percent = (numerator: number, denominator: number) => `${(100 * numerator / denominator).toFixed(1)}%`

export async function manualDecompReport(summaries: ManualSummary[]): Promise<string> {
  const baseline = await json<Baseline>('data-raw/decomp/t6-baseline.json')
  const frequencyText = await read('data-raw/charlists/wikipedia-zh-tw-frequency.tsv')
  if (createHash('sha256').update(frequencyText).digest('hex') !== baseline.frequencySha256) throw Error('T6 frequency baseline no longer matches the input')
  const frequency = frequencyText.trim().split('\n').slice(1).map(line => {
    const [, char, weight] = line.split('\t')
    return { char: char!, weight: Number(weight) }
  })
  const lines = [
    '## T6 高頻字人工拆解', '',
    '本節 Before 為 T6 開始前的 T5 產物快照（不是上表 T4 基線），數值保存在 [t6-baseline.json](../data-raw/decomp/t6-baseline.json)。範圍依各輸入法字表先過濾頻率表，再取前 500 字；人工檔只補尚無驗證拆解的目標字。', '',
    '| 輸入法 | 整體字數 Before → After | 整體覆蓋率 Before → After | 人工接受／拒絕 |',
    '|---|---:|---:|---:|',
  ]
  const weighted = ['| 輸入法 | Top 100 | Top 500 | Top 1000 |', '|---|---:|---:|---:|']
  const counts = [...weighted]
  const samples: string[] = []
  for (const summary of [...summaries].sort((a, b) => ['boshiamy', 'cangjie', 'dayi', 'array'].indexOf(a.im) - ['boshiamy', 'cangjie', 'dayi', 'array'].indexOf(b.im))) {
    const { im, denominator, accepted, rejected } = summary
    const before = baseline.byIm[im]
    const out = await json<DecompFile>(`public/data/decomp/${im}.json`)
    const table = await json<ImTableFile>(`public/data/im/${im}.json`)
    const manual = await json<DecompFile>(`data-raw/decomp/manual-${im}.json`)
    const present = new Set(Object.values(table.table).flat())
    const ranked = frequency.filter(row => present.has(row.char))
    const afterCount = Object.keys(out).length
    lines.push(`| ${im} | ${before.overall}/${denominator} → ${afterCount}/${denominator} | ${percent(before.overall, denominator)} → ${percent(afterCount, denominator)} | ${accepted.length} / ${rejected} |`)
    const weights: string[] = [], numbers: string[] = []
    for (const n of [100, 500, 1000]) {
      const rows = ranked.slice(0, n), old = before.frequency[n]!
      const covered = rows.filter(row => out[row.char])
      const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0)
      if (old.total !== rows.length || Math.abs(old.totalWeight - totalWeight) > 1e-8) throw Error(`T6 baseline cohort changed: ${im}/${n}`)
      weights.push(`${percent(old.coveredWeight, old.totalWeight)} → ${percent(covered.reduce((sum, row) => sum + row.weight, 0), totalWeight)}`)
      numbers.push(`${old.verified}/${old.total} (${percent(old.verified, old.total)}) → ${covered.length}/${rows.length} (${percent(covered.length, rows.length)})`)
    }
    weighted.push(`| ${im} | ${weights.join(' | ')} |`)
    counts.push(`| ${im} | ${numbers.join(' | ')} |`)
    let seed = 0x54364d44
    const chars = [...accepted].sort()
    for (let i = chars.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      const j = seed % (i + 1)
      ;[chars[i], chars[j]] = [chars[j]!, chars[i]!]
    }
    samples.push(`### ${im} 人工隨機抽樣 15 字`, '', '| 字 | 碼 | 全部根形／鍵（括號為來源部件） | 取用索引（0 起算） | 角色 |', '|---|---|---|---|---|')
    for (const char of chars.slice(0, 15)) {
      const entry = out[char]![0]!
      if (!manual[char]?.some(e => e.code === entry.code)) throw Error(`Manual sample lost its authoring source: ${im}/${char}`)
      samples.push(`| ${char} | ${entry.code} | ${entry.parts.map(p => `${p.component}/${p.key}${p.group ? `(${p.group})` : ''}`).join(' ')} | ${entry.picked.join(',')} | ${entry.roles.join('、')} |`)
    }
    samples.push('')
  }
  lines.push('', '### 頻率加權覆蓋率 Before → After', '',
    '分母是該 Top N 所有字的頻率權重總和；分子只加總有驗證拆解的字。這與「有拆解字數 ÷ N」不同：例如嘸蝦米原 Top 100 的 45 字是字數覆蓋 45.0%，頻率加權則為 49.9%。', '', ...weighted,
    '', '### 字數覆蓋 Before → After', '', ...counts,
    '', '### 人工依據與剩餘弱點', '',
    '- 依據各法 [字根圖](../public/data/roots/)、[研究筆記](research/notes/)、[來源與取碼規則](research/im-sources.md)；倉頡完整部件序亦參照既有 aliases-cangjie.json 的明列標準拆法。人工保留未取用的中間根，並以 group 記錄字首／字身的來源部件。沒有新增別名或改動驗證規則。',
    '- 嘸蝦米採完整三、四碼；例如圖保留「囗口十囗口」再取前三尾。布的補 I、主及任的補 E 均經 CNS 末筆核對；沒有新增規定補碼。需要未證明末形的日、子、口、也等仍略過。',
    '- 倉頡以標準根名與既有完整部件序手列獨立成字拆法（如子 ND、言 YMMR），並保留斯、動等字首首尾與字身取碼。特殊字首、包含省略與無法表示的局部根仍是弱點；不以 X 代替未知形。',
    '- 大易用三碼首二尾，保留單、戰、洲、劃等未取根；行列用前三尾，保留學、屬、數、常、黨等完整根序。兩者根圖仍有無 Unicode 的局部形，因此上／卡等缺少該鍵精確根形證據的候選未收錄。',
    '- 拒絕數是本次最終完整重建的人工輸入拒絕數；早期退回的近（廴/W 不在根表）已撤下，僅通過完整重建的項目留在 manual 檔。根形／碼表／取碼一致性不能替代未收錄局部形的官方圖像證據。',
    '- 四份 manual 檔均在各法 Top 500，且在 T5 基線沒有驗證項；本次不擴大到低頻字，也不更動輸入法、字根或文章資產。抽樣使用固定種子的 Fisher–Yates，僅從本次被接受的人工項目抽取。',
    '- 重現：`node --import tsx scripts/build-decomp.ts` 同時更新 T6 統計與抽樣；`pnpm test`、`pnpm exec vue-tsc -b --noEmit` 驗證。',
    '', ...samples)
  return lines.join('\n')
}
