import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { Article, ArticleMeta } from '@/core/types'
import { db, safe } from '@/lib/db'
import { useSettings } from './settings'

const BASE = import.meta.env.BASE_URL

const HAN = /[\p{Script=Han}〇]/u

export function countCjk(text: string): number {
  let n = 0
  for (const ch of text) if (HAN.test(ch)) n++
  return n
}

export function makePreview(text: string, n = 42): string {
  return text.replace(/\s+/g, '').slice(0, n)
}

export const useLibrary = defineStore('library', () => {
  const settings = useSettings()
  const builtin = shallowRef<ArticleMeta[]>([])
  const imported = shallowRef<ArticleMeta[]>([])
  const ready = ref(false)
  const loadError = ref<string | null>(null)
  const current = shallowRef<Article | null>(null)
  const textCache = new Map<string, Article>()

  const all = computed(() => [...imported.value, ...builtin.value])

  async function init() {
    if (ready.value) return
    try {
      const res = await fetch(`${BASE}data/articles/index.json`)
      if (!res.ok) throw new Error(String(res.status))
      builtin.value = (await res.json()) as ArticleMeta[]
    } catch (err) {
      console.warn('[modaa] article index missing', err)
      loadError.value = '內建文章尚未建置'
      builtin.value = []
    }
    const rows = await safe(async () => (await db()).getAll('articles'), [])
    rows.sort((a, b) => b.importedAt - a.importedAt)
    for (const r of rows) textCache.set(r.id, r)
    imported.value = rows.map(({ text: _t, importedAt: _i, ...meta }) => meta)
    ready.value = true
  }

  async function load(id: string): Promise<Article | null> {
    const cached = textCache.get(id)
    if (cached) return cached
    try {
      const res = await fetch(`${BASE}data/articles/${id}.json`)
      if (!res.ok) throw new Error(String(res.status))
      const art = (await res.json()) as Article
      textCache.set(id, art)
      return art
    } catch {
      return null
    }
  }

  async function open(id: string) {
    await init()
    const art = await load(id)
    if (art) {
      current.value = art
      settings.lastArticle = id
    }
    return art
  }

  /** Open the last article, or the first built-in one. */
  async function openDefault() {
    await init()
    const id = settings.lastArticle && all.value.some((a) => a.id === settings.lastArticle)
      ? settings.lastArticle
      : all.value[0]?.id
    if (id) await open(id)
  }

  /** Practice text built on the fly (弱字特訓 etc.). Not persisted. */
  function openVirtual(title: string, text: string, author = '墨打') {
    current.value = {
      id: `virtual-${Date.now()}`,
      title,
      author,
      category: '原創',
      excerpt: false,
      source: '',
      license: '',
      length: countCjk(text),
      difficulty: 3,
      preview: makePreview(text),
      text,
    }
  }

  async function importArticle(input: { title: string; author?: string; text: string }) {
    const text = input.text.replace(/\r\n?/g, '\n').trim()
    const art: Article & { importedAt: number } = {
      id: `import-${Date.now().toString(36)}`,
      title: input.title.trim() || makePreview(text, 12),
      author: input.author?.trim() || '自訂',
      category: '匯入',
      excerpt: false,
      source: '使用者匯入',
      license: '個人使用',
      length: countCjk(text),
      difficulty: 3,
      preview: makePreview(text),
      text,
      importedAt: Date.now(),
    }
    await safe(async () => (await db()).put('articles', art), undefined)
    textCache.set(art.id, art)
    const { text: _t, importedAt: _i, ...meta } = art
    imported.value = [meta, ...imported.value]
    return art
  }

  async function removeImported(id: string) {
    await safe(async () => (await db()).delete('articles', id), undefined)
    textCache.delete(id)
    imported.value = imported.value.filter((a) => a.id !== id)
  }

  return { builtin, imported, all, ready, loadError, current, init, load, open, openDefault, openVirtual, importArticle, removeImported }
})
