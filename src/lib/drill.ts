/**
 * 弱字特訓 text: each weak char appears several times, mixed with its original context
 * (2-char neighbours in the article) so muscle memory forms in real words, not isolation.
 */
export function buildDrillText(chars: string[], source = '', reps = 3): string {
  const unique = [...new Set(chars)].slice(0, 30)
  const words: string[] = []
  const src = [...source]
  for (const ch of unique) {
    const ctx: string[] = []
    for (let i = 0; i < src.length && ctx.length < 2; i++) {
      if (src[i] !== ch) continue
      const prev = src[i - 1]
      const next = src[i + 1]
      if (next && /\p{Script=Han}/u.test(next)) ctx.push(ch + next)
      else if (prev && /\p{Script=Han}/u.test(prev)) ctx.push(prev + ch)
    }
    for (let r = 0; r < reps; r++) words.push(ctx[r % Math.max(1, ctx.length)] ?? ch)
  }
  // Deterministic shuffle so retries are comparable
  let seed = 7
  for (let i = words.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280
    const j = Math.floor((seed / 233280) * (i + 1))
    ;[words[i], words[j]] = [words[j]!, words[i]!]
  }
  const out: string[] = []
  for (let i = 0; i < words.length; i++) {
    out.push(words[i]!)
    out.push((i + 1) % 4 === 0 ? (i + 1 === words.length ? '。' : '，\n') : '，')
  }
  if (out.length) out[out.length - 1] = '。'
  return out.join('')
}
