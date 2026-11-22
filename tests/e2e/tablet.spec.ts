import { devices, expect, test } from '@playwright/test'
import { article, boot, keysFor } from './helpers'
import type { ImId } from '../../src/core/types'

const ipad = devices['iPad Pro 11']
test.use({ viewport: ipad.viewport, userAgent: ipad.userAgent, deviceScaleFactor: 1, isMobile: true, hasTouch: true })

const TEXT = article('lou-shi-ming')

for (const im of ['boshiamy', 'zhuyin'] as ImId[]) {
  test(`tablet (${im}): tapping the on-screen keyboard finishes 陋室銘 at 100%`, async ({ page }) => {
    await boot(page, im, { 'modaa:last-article': 'lou-shi-ming' })
    await page.goto('/#/')
    const kb = page.getByRole('group', { name: '螢幕鍵盤' })
    await expect(kb).toBeVisible()
    for (const k of keysFor(im, TEXT)) await kb.locator(`[data-key="${k === '\\' ? '\\\\' : k}"]`).tap()
    const cert = page.getByRole('dialog', { name: /陋室銘/ })
    await expect(cert).toBeVisible()
    await expect(cert.locator('.figures')).toContainText('100.0%')
    // the hidden textarea must never take focus (that would pop up the OS keyboard)
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('TEXTAREA')
  })
}

test('tablet: backspace / clear keys and the 提示 button work, page fits one screen', async ({ page }) => {
  await boot(page, 'cangjie', { 'modaa:last-article': 'lou-shi-ming' })
  await page.goto('/#/')
  const kb = page.getByRole('group', { name: '螢幕鍵盤' })
  await kb.locator('[data-key="a"]').tap()
  await kb.locator('[data-key="b"]').tap()
  await expect(page.locator('.ime .root')).toHaveCount(2)
  await kb.locator('[data-key="Backspace"]').tap()
  await expect(page.locator('.ime .root')).toHaveCount(1)
  await kb.locator('[data-key="Escape"]').tap()
  await expect(page.locator('.ime')).toHaveCount(0)
  await page.getByRole('button', { name: '提示' }).tap()
  await expect(page.getByRole('article', { name: '字根卡' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
  expect(overflow).toBeLessThanOrEqual(1)
})
