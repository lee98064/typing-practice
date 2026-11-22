import type { DecompEntry, ImId } from './types'

/** Shared by the build report and the hint card; omitted from compact data files. */
export function decompositionLines(im: ImId, char: string, entry: DecompEntry): string[] {
  const { parts, picked, roles } = entry
  const lines: string[] = []
  const groups: { name: string; start: number; end: number }[] = []
  for (let i = 0; i < parts.length; i++) {
    const name = parts[i]!.group
    if (!name || name === '補' || name === '規定補') continue
    const previous = groups.at(-1)
    if (previous?.name === name && previous.end === i) previous.end++
    else groups.push({ name, start: i, end: i + 1 })
  }
  for (const group of groups) {
    const positions = picked.flatMap((part, n) => part >= group.start && part < group.end ? [n] : [])
    const side = positions.every(n => roles[n]?.startsWith('字首')) ? '字首'
      : positions.every(n => roles[n]?.startsWith('字身')) ? '字身' : ''
    const keys = positions.map(n => entry.code[n]!.toUpperCase()).join('、')
    const selected = positions.map(n => picked[n]! - group.start)
    const shape = parts.slice(group.start, group.end).map(p => p.root ?? (p.component.endsWith('難形') ? '難' : p.component)).join('')
    const rule = selected.length === 2 && group.end - group.start > 2 && selected[1] === group.end - group.start - 1 ? '首尾' : ''
    lines.push(`「${group.name}」＝${shape}${keys ? `，${side ? `作${side}` : ''}取${rule} ${keys}` : ''}。`)
  }
  if (im === 'cangjie' && roles.some(r => r.startsWith('字首'))) {
    const h = picked.filter((_, n) => roles[n]?.startsWith('字首')).map(i => parts[i]!.component).join('')
    const b = picked.filter((_, n) => roles[n]?.startsWith('字身')).map(i => parts[i]!.component).join('')
    lines.push(`「${char}」字首取${h}，字身取${b}，合為 ${entry.code.toUpperCase()}。`)
  } else {
    const taken = picked.filter((_, n) => roles[n] !== '補').map(i => parts[i]!.component).join('')
    const extra = roles.indexOf('補')
    const skipped = parts.length - picked.length
    const rule = skipped > 0 ? (im === 'dayi' && entry.code.length <= 3 ? '，取首、次、尾' : '，取首、次、三、尾') : ''
    const supplement = extra >= 0 ? parts[picked[extra]!] : undefined
    lines.push(`「${char}」取${taken}${rule}${supplement ? `，${supplement.group === '規定補' ? '規定末形' : '末筆'}「${supplement.component}」補碼 ${entry.code[extra]!.toUpperCase()}` : ''}，合為 ${entry.code.toUpperCase()}。`)
  }
  return lines
}
