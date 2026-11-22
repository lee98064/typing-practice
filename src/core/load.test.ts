import { describe, expect, it } from 'vitest'
import { cinToTableFile } from './cin'
import { loadInputMethod } from './load'
import type { ImId, ImTableFile } from './types'

function table(id: ImId): ImTableFile {
  return cinToTableFile('%keyname begin\na 日\n%keyname end\n%chardef begin\na 明\n%chardef end', { id, maxCodeLength: 5 })
}

describe('loadInputMethod', () => {
  it('fetches required data, tolerates missing enrichment and caches concurrent loads', async () => {
    const urls: string[] = []
    const fetchJson = async (url: string): Promise<unknown> => {
      urls.push(url)
      if (url.endsWith('/im/boshiamy.json')) return table('boshiamy')
      if (url.endsWith('/im/zhuyin.json')) return table('zhuyin')
      if (url.endsWith('/roots/boshiamy.json')) return { im: 'boshiamy', keys: [{ key: 'a', label: '日', roots: ['日'] }], rules: [] }
      throw new Error('404')
    }
    const options = { base: '/墨打', fetchJson }
    const first = loadInputMethod('boshiamy', options)
    expect(loadInputMethod('boshiamy', options)).toBe(first)
    const im = await first
    expect(im.codesFor('明')[0]?.code).toBe('a')
    expect(await loadInputMethod('boshiamy', options)).toBe(im)
    expect(urls).toHaveLength(5)
    expect(urls).toEqual(expect.arrayContaining(['/墨打/data/im/boshiamy.json', '/墨打/data/roots/boshiamy.json', '/墨打/data/im/zhuyin.json', '/墨打/data/decomp/boshiamy.json', '/墨打/data/zhuyin-phrases.json']))
  })

  it('uses table overrides and fetches the Zhuyin table only once when it is the main IM', async () => {
    const urls: string[] = []
    const fetchJson = async (url: string): Promise<unknown> => {
      urls.push(url)
      if (url.includes('/roots/')) return { im: 'zhuyin', keys: [], rules: [] }
      return undefined
    }
    const im = await loadInputMethod('zhuyin', { base: '', fetchJson, overrides: { zhuyin: table('zhuyin') } })
    expect(im.id).toBe('zhuyin')
    expect(im.annotate?.('明')).toEqual(['a'])
    expect(urls.some((url) => url.includes('/im/'))).toBe(false)
  })

  it('loads phrase and decomposition enrichment and shares phonetic fetches across methods', async () => {
    const urls: string[] = []
    const fetchJson = async (url: string): Promise<unknown> => {
      urls.push(url)
      if (url.endsWith('/im/zhuyin.json')) return table('zhuyin')
      if (url.includes('/im/')) return table('array')
      if (url.includes('/roots/')) return { im: url.includes('zhuyin') ? 'zhuyin' : 'array', keys: [], rules: [] }
      if (url.includes('/decomp/')) return { 明: [{ code: 'a', parts: [{ key: 'a', root: '日', component: '日' }], picked: [0], roles: ['首'], explanation: ['已核實'] }] }
      return { phrases: { 明: ['a'] } }
    }
    const [array, zhuyin] = await Promise.all(['array', 'zhuyin'].map((id) => loadInputMethod(id as ImId, { base: '/', fetchJson })))
    expect(array?.explain('明').decomposition?.verified).toBe(true)
    expect(zhuyin?.annotate?.('明')).toEqual(['a'])
    expect(urls.filter((url) => url === '/data/im/zhuyin.json')).toHaveLength(1)
  })

  it('rejects malformed required data and permits a failed load to be retried', async () => {
    let valid = false
    const fetchJson = async (url: string): Promise<unknown> => {
      if (url.includes('/im/')) return valid ? table(url.includes('zhuyin') ? 'zhuyin' : 'dayi') : { meta: {} }
      if (url.includes('/roots/')) return { im: 'dayi', keys: [], rules: [] }
      return undefined
    }
    const options = { base: '/', fetchJson }
    await expect(loadInputMethod('dayi', options)).rejects.toThrow('Invalid IM table')
    valid = true
    expect((await loadInputMethod('dayi', options)).id).toBe('dayi')
  })

  it('keeps caches isolated when base URLs or overrides change', async () => {
    const fetchJson = async (url: string): Promise<unknown> => {
      if (url.includes('/roots/')) return { im: 'cangjie', keys: [], rules: [] }
      return undefined
    }
    const override = { cangjie: table('cangjie'), zhuyin: table('zhuyin') }
    const first = await loadInputMethod('cangjie', { base: '/one/', fetchJson, overrides: override })
    const second = await loadInputMethod('cangjie', { base: '/two/', fetchJson, overrides: override })
    expect(second).not.toBe(first)
  })
})
