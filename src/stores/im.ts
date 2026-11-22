import { defineStore } from 'pinia'
import { ref, shallowRef, watch } from 'vue'
import type { ImId, ImTableFile, InputMethod } from '@/core/types'
import { loadInputMethod } from '@/core/load'
import { db, safe } from '@/lib/db'
import { useSettings } from './settings'

const BASE = import.meta.env.BASE_URL

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

/** Loads input methods lazily (tables are big) and exposes the active one. */
export const useImStore = defineStore('im', () => {
  const settings = useSettings()
  const current = shallowRef<InputMethod | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const cache = new Map<ImId, Promise<InputMethod>>()
  let overrides: Partial<Record<ImId, ImTableFile>> | null = null

  async function loadOverrides() {
    if (overrides) return overrides
    const rows = await safe(async () => (await db()).getAll('tables'), [])
    overrides = Object.fromEntries(rows.map((r) => [r.id, r.file]))
    return overrides
  }

  async function get(id: ImId): Promise<InputMethod> {
    let p = cache.get(id)
    if (!p) {
      p = loadOverrides().then((ov) => loadInputMethod(id, { base: BASE, fetchJson, overrides: ov }))
      cache.set(id, p)
      p.catch(() => cache.delete(id))
    }
    return p
  }

  async function activate(id: ImId) {
    loading.value = true
    error.value = null
    try {
      const im = await get(id)
      if (settings.im === id) current.value = im
    } catch (err) {
      console.error(err)
      error.value = `${id} 字表載入失敗`
      if (settings.im === id) current.value = null
    } finally {
      loading.value = false
    }
  }

  /** Replace an IM's table with a user-imported .cin (stored in IndexedDB). */
  async function setOverride(id: ImId, file: ImTableFile | null, name = '') {
    await safe(async () => {
      const d = await db()
      if (file) await d.put('tables', { id, file, name, importedAt: Date.now() })
      else await d.delete('tables', id)
    }, undefined)
    overrides = null
    cache.delete(id)
    if (settings.im === id) await activate(id)
  }

  watch(() => settings.im, activate, { immediate: true })

  return { current, loading, error, get, activate, setOverride }
})
