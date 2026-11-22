import type { ImTable } from './table'
import type { CodeOption, DecompFile, HintCard, HintKey, ImMeta, ReadingCtx, RootsFile } from './types'
import { decompositionLines } from './decomp-text'

export interface ExplanationSource {
  meta: ImMeta
  table: ImTable
  roots: RootsFile
  decomp?: DecompFile
  codesFor(char: string, ctx?: ReadingCtx): CodeOption[]
  readingFor?(char: string, ctx?: ReadingCtx): string | undefined
}

function fallbackCard(char: string, source: ExplanationSource): HintCard {
  return {
    char, im: source.meta.id, options: [], rule: source.meta.rule, mnemonics: [], confusables: [],
    decomposition: { parts: [], verified: false, explanation: [`「${char}」不在此輸入法字表中。`] },
  }
}

const IM_NAMES: Record<string, string> = { zhuyin: '注音', boshiamy: '嘸蝦米', array: '行列', dayi: '大易', cangjie: '倉頡' }

/** Key-by-key reference when no verified decomposition exists (the card marks it 參考). */
function fallbackLines(char: string, code: string, keys: HintKey[], source: ExplanationSource): string[] {
  const name = IM_NAMES[source.meta.id] ?? source.meta.name
  if (source.meta.id === 'zhuyin') {
    return [`「${char}」讀作 ${keys.map((k) => k.label).join('')}，依序按 ${keys.map((k) => k.key.toUpperCase()).join(' ')}。`, '聲母、介音、韻母各占一鍵，最後按聲調鍵；第一聲按空白鍵。']
  }
  const lines = [`「${char}」的${name}碼是 ${code.toUpperCase()}，共 ${code.length} 碼：`]
  const seen = new Set<string>()
  for (const k of keys) {
    if (seen.has(k.key)) continue
    seen.add(k.key)
    const family = k.roots.filter((r) => r !== k.label).slice(0, 8).join('、')
    lines.push(`${k.key.toUpperCase()} 鍵「${k.label}」${family ? `，同鍵字根還有 ${family}` : ''}。`)
  }
  lines.push('對照字形，找出每一碼對應的字根部件；這個字的完整拆法尚未收錄，以上為按鍵參考。')
  return lines
}

/** Hints are optional teaching aids: absent or incomplete enrichment must never stop typing. */
export function explain(char: string, ctx: ReadingCtx | undefined, source: ExplanationSource): HintCard {
  try {
    const rootKeys = new Map(source.roots.keys.map((root) => [root.key, root]))
    // Same key → same color, so repeated keys (SLSL) read as one root family.
    const hintKeys = (code: string): HintKey[] => {
      const slot = new Map<string, number>()
      return [...code].map((key) => {
        if (!slot.has(key)) slot.set(key, slot.size % 6)
        return {
          key,
          label: rootKeys.get(key)?.label ?? source.table.file.keynames[key] ?? key,
          roots: rootKeys.get(key)?.roots ?? [],
          ...(rootKeys.get(key)?.shortcutRoots?.length ? { shortcutRoots: rootKeys.get(key)!.shortcutRoots } : {}),
          color: slot.get(key)!,
        }
      })
    }
    const options = source.codesFor(char, ctx).map((option) => ({ ...option, keys: hintKeys(option.code) }))
    const card = fallbackCard(char, source)
    card.reading = source.readingFor?.(char, ctx)
    card.options = options
    const primary = options[0]
    if (!primary) return card
    const entries = source.decomp?.[char]
    const entry = entries?.find((item) => item.code === primary.code) ?? entries?.[0]
    if (entry) {
      const colorKeys = hintKeys(entry.code)
      card.decomposition = {
        code: entry.code,
        ids: entry.ids,
        verified: true,
        parts: entry.parts.map((part, index) => {
          const pickedIndex = entry.picked.indexOf(index)
          const mappedKey = colorKeys[pickedIndex]?.key === part.key
            ? colorKeys[pickedIndex]
            : colorKeys.find((key) => key.key === part.key)
          return {
            ...part,
            root: part.root ?? part.component,
            picked: pickedIndex >= 0,
            role: pickedIndex >= 0 ? entry.roles[pickedIndex] : undefined,
            color: mappedKey?.color ?? 0,
          }
        }),
        explanation: entry.explanation?.length ? [...entry.explanation] : decompositionLines(source.meta.id, char, entry),
      }
    } else {
      card.decomposition = {
        verified: false,
        parts: primary.keys.map((key, index) => ({
          component: '', root: key.label, key: key.key, picked: true,
          role: `第${index + 1}碼`, color: key.color,
        })),
        explanation: fallbackLines(char, primary.code, primary.keys, source),
      }
    }
    const seen = new Set<string>()
    for (const key of primary.keys) {
      if (seen.has(key.key)) continue
      seen.add(key.key)
      const mnemonic = rootKeys.get(key.key)?.mnemonic
      if (mnemonic) card.mnemonics.push({ key: key.key, label: key.label, text: mnemonic })
    }
    card.confusables = source.table.lookup(primary.code).filter((candidate) => candidate !== char).slice(0, 8)
    return card
  } catch {
    return fallbackCard(char, source)
  }
}
