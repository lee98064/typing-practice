import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Article, ImId, ImTableFile, SessionResult } from '@/core/types'

export interface HistoryRecord extends SessionResult {
  id?: number
  mode: 'practice' | 'test'
  articleTitle: string
  at: number // epoch ms
}

interface ModaaDB extends DBSchema {
  articles: { key: string; value: Article & { importedAt: number } }
  history: { key: number; value: HistoryRecord; indexes: { 'by-at': number; 'by-im': ImId } }
  tables: { key: ImId; value: { id: ImId; file: ImTableFile; name: string; importedAt: number } }
}

let dbPromise: Promise<IDBPDatabase<ModaaDB>> | null = null

/** IndexedDB can be unavailable (private mode, blocked storage): callers must tolerate rejection. */
export function db(): Promise<IDBPDatabase<ModaaDB>> {
  dbPromise ??= openDB<ModaaDB>('modaa', 1, {
    upgrade(d) {
      d.createObjectStore('articles', { keyPath: 'id' })
      const h = d.createObjectStore('history', { keyPath: 'id', autoIncrement: true })
      h.createIndex('by-at', 'at')
      h.createIndex('by-im', 'im')
      d.createObjectStore('tables', { keyPath: 'id' })
    },
  })
  return dbPromise
}

export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.warn('[modaa] storage unavailable:', err)
    return fallback
  }
}
