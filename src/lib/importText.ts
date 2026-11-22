/** Decode an uploaded text file: UTF-8 first (strict), then Big5 (common for old TW files). */
export async function decodeTextFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^﻿/, '')
  } catch {
    try {
      return new TextDecoder('big5').decode(buf)
    } catch {
      return new TextDecoder('utf-8').decode(buf)
    }
  }
}

/** Lazy-load OpenCC only when needed (simplified → Taiwan traditional). */
export async function toTraditional(text: string): Promise<string> {
  const { Converter } = await import('opencc-js/cn2t')
  return Converter({ from: 'cn', to: 'tw' })(text)
}

/** Normalize pasted text: CRLF, half-width CJK punctuation, runs of blank lines. */
export function normalizeArticle(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/(\p{Script=Han}),(?=\p{Script=Han}|\s|$)/gu, '$1，')
    .replace(/(\p{Script=Han})\.(?=\s|$)/gu, '$1。')
    .replace(/(\p{Script=Han})\?/gu, '$1？')
    .replace(/(\p{Script=Han})!/gu, '$1！')
    .replace(/(\p{Script=Han});/gu, '$1；')
    .replace(/(\p{Script=Han}):/gu, '$1：')
    .replace(/[ \t　]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Rough simplified-Chinese detector: share of chars that only exist in simplified form. */
export function looksSimplified(text: string): boolean {
  const SIMP = '们这说时国会对过还发么后为无进与东车长门问间听见边书们实现气给觉亲认让请应开关办买卖读'
  let s = 0
  for (const ch of text) if (SIMP.includes(ch)) s++
  return s >= 3
}
