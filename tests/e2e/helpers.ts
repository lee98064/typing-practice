import { readFileSync } from 'node:fs'
import type { Page } from '@playwright/test'
import { createInputMethod } from '../../src/core/im'
import type { ImId } from '../../src/core/types'

const data = (p: string) => JSON.parse(readFileSync(new URL(`../../public/data/${p}`, import.meta.url), 'utf8'))

/** Key strokes that type `text` correctly with the given IM (punctuation skipped). */
export function keysFor(im: ImId, text: string): string[] {
  const method = createInputMethod({
    table: data(`im/${im}.json`),
    roots: data(`roots/${im}.json`),
    zhuyin: { table: data('im/zhuyin.json'), phrases: data('zhuyin-phrases.json') },
  })
  const expected = method.annotate?.(text)
  const out: string[] = []
  ;[...text].forEach((ch, index) => {
    if (!/\p{Unified_Ideograph}/u.test(ch)) return
    const opt = method.codesFor(ch, { text, index, expected: expected?.[index] })[0]
    if (!opt) return
    out.push(...opt.code)
    if (opt.selectionKey) out.push(opt.selectionKey)
    else if (!(im === 'zhuyin' && /[3467]$/.test(opt.code))) out.push(' ')
  })
  return out
}

const KEY_CODE: Record<string, string> = { ' ': 'Space', ',': 'Comma', '.': 'Period', ';': 'Semicolon', '/': 'Slash', "'": 'Quote', '[': 'BracketLeft', ']': 'BracketRight', '-': 'Minus', '\\': 'Backslash' }
export async function press(page: Page, keys: string[]) {
  for (const k of keys) {
    const name = KEY_CODE[k] ?? (/[0-9]/.test(k) ? `Digit${k}` : `Key${k.toUpperCase()}`)
    await page.keyboard.press(name)
  }
}

export async function boot(page: Page, im: ImId, extra: Record<string, string> = {}) {
  await page.addInitScript(([im, extra]) => {
    localStorage.setItem('modaa:onboarded', 'true')
    localStorage.setItem('modaa:im', im)
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, v)
  }, [im, extra] as const)
}

export function article(id: string): string {
  return data(`articles/${id}.json`).text as string
}
