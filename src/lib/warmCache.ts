/**
 * The first visit downloads IM data before the service worker controls the page, so those
 * responses are not cached yet. When the SW takes control, fetch the active IM's data again
 * through it so practice keeps working offline right away.
 */
export function warmOfflineCache(base: string) {
  const sw = (navigator as Navigator & { serviceWorker?: ServiceWorkerContainer }).serviceWorker
  if (!sw) return
  sw.addEventListener('controllerchange', () => {
    let im = 'boshiamy'
    try {
      im = localStorage.getItem('modaa:im') ?? im
    } catch {
      /* storage blocked */
    }
    const files = [`data/im/${im}.json`, `data/roots/${im}.json`, `data/decomp/${im}.json`, 'data/im/zhuyin.json', 'data/zhuyin-phrases.json']
    for (const f of files) fetch(`${base}${f}`).catch(() => {})
  })
}
