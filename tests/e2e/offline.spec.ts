import { expect, test } from '@playwright/test'
import { boot } from './helpers'

test('PWA works offline after the first visit', async ({ page, context }) => {
  await boot(page, 'cangjie', { 'modaa:last-article': 'lou-shi-ming' })
  await page.goto('/#/')
  await expect(page.locator('.ch.current')).toBeVisible()
  // Wait until the service worker controls the page, then give the cache warm-up a moment.
  await page.waitForFunction(() => {
    const sw = (navigator as unknown as { serviceWorker?: { controller: unknown } }).serviceWorker
    return !!sw?.controller
  }, undefined, { timeout: 15_000 })
  await page.waitForTimeout(1500)
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.art-title h2')).toHaveText('陋室銘')
  await expect(page.locator('.ch.current')).toBeVisible()
  await page.goto('/#/library')
  await expect(page.locator('.tile').nth(3)).toBeVisible()
})
