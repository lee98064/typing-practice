import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { db, safe, type HistoryRecord } from '@/lib/db'
import type { ImId } from '@/core/types'

export const useHistory = defineStore('history', () => {
  const records = shallowRef<HistoryRecord[]>([])
  let loaded = false

  async function init() {
    if (loaded) return
    loaded = true
    const rows = await safe(async () => (await db()).getAllFromIndex('history', 'by-at'), [])
    records.value = rows.reverse()
  }

  async function add(rec: HistoryRecord) {
    const id = await safe(async () => (await db()).add('history', rec), undefined)
    const saved = { ...rec, id: typeof id === 'number' ? id : undefined }
    records.value = [saved, ...records.value]
    return saved
  }

  async function clear() {
    await safe(async () => (await db()).clear('history'), undefined)
    records.value = []
  }

  /** char → total wrong commits across sessions (optionally for one IM). */
  function weakChars(im?: ImId, limit = 60): { char: string; count: number }[] {
    const tally = new Map<string, number>()
    for (const r of records.value) {
      if (im && r.im !== im) continue
      for (const [ch, n] of Object.entries(r.weakChars)) tally.set(ch, (tally.get(ch) ?? 0) + n)
    }
    return [...tally.entries()]
      .map(([char, count]) => ({ char, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  function bestFor(articleId: string, im: ImId): HistoryRecord | undefined {
    let best: HistoryRecord | undefined
    for (const r of records.value) {
      if (r.articleId !== articleId || r.im !== im) continue
      if (!best || r.cpm > best.cpm) best = r
    }
    return best
  }

  const count = computed(() => records.value.length)

  return { records, count, init, add, clear, weakChars, bestFor }
})
