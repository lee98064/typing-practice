import { expect, test } from '@playwright/test'
import { article, boot, keysFor, press } from './helpers'
import type { ImId } from '../../src/core/types'

const IMS: ImId[] = ['zhuyin', 'boshiamy', 'array', 'dayi', 'cangjie']
const TEXT = article('lou-shi-ming')

for (const im of IMS) {
  test(`${im}: typing 陋室銘 with real codes finishes at 100%`, async ({ page }) => {
    await boot(page, im, { 'modaa:last-article': 'lou-shi-ming' })
    await page.goto('/#/')
    await expect(page.locator('.art-title h2')).toHaveText('陋室銘')
    await expect(page.locator('.ch.current')).toBeVisible()
    await press(page, keysFor(im, TEXT))
    const cert = page.getByRole('dialog', { name: /陋室銘/ })
    await expect(cert).toBeVisible()
    await expect(cert.locator('.figures')).toContainText('100.0%')
    await expect(cert.locator('.figures')).toContainText('81')
  })
}

test('the article renders its real text (guards v-memo / caching regressions)', async ({ page }) => {
  await boot(page, 'boshiamy', { 'modaa:last-article': 'chu-shi-biao' })
  await page.goto('/#/')
  await expect(page.locator('.ch.current')).toBeVisible()
  const rendered = (await page.locator('.flow').innerText()).replace(/[\s\u2002]/g, '')
  const expected = article('chu-shi-biao').replace(/\s/g, '')
  expect(rendered).toBe(expected)
  await press(page, keysFor('boshiamy', '臣亮言'))
  const after = (await page.locator('.flow').innerText()).replace(/[\s\u2002]/g, '')
  expect(after).toBe(expected)
})

test('three wrong commits open the 字根卡 with the right code', async ({ page }) => {
  await boot(page, 'cangjie', { 'modaa:last-article': 'lou-shi-ming' })
  await page.goto('/#/')
  await expect(page.locator('.ch.current')).toHaveText('山')
  for (let i = 0; i < 3; i++) await press(page, ['a', ' ']) // 日 ≠ 山
  const card = page.getByRole('article', { name: '字根卡' })
  await expect(card).toBeVisible()
  await expect(card.locator('.code')).toHaveText('U')
  await expect(card.locator('.chip-cinnabar')).toContainText('已錯 3 次')
  await expect(page.locator('.key.next')).toHaveCount(1)
})

test('OS IME composition shows the switch-to-English warning', async ({ page }) => {
  await boot(page, 'boshiamy', { 'modaa:last-article': 'lou-shi-ming' })
  await page.goto('/#/')
  await expect(page.locator('.ch.current')).toBeVisible()
  await page.locator('textarea.sink').dispatchEvent('compositionstart')
  await expect(page.getByRole('alertdialog')).toContainText('請把系統輸入法切成英文')
  await page.getByRole('button', { name: '我切好了，繼續' }).click()
  await expect(page.getByRole('alertdialog')).toHaveCount(0)
})

test('test mode (整篇) produces a result and a history record', async ({ page }) => {
  await boot(page, 'boshiamy', { 'modaa:last-article': 'lou-shi-ming', 'modaa:test-minutes': '0' })
  await page.goto('/#/test')
  await page.getByRole('button', { name: '開始測驗' }).click()
  await expect(page.locator('.count')).toHaveCount(0, { timeout: 5000 })
  await press(page, keysFor('boshiamy', TEXT))
  await expect(page.getByRole('dialog', { name: /陋室銘/ })).toContainText('測驗成績單')
  await page.goto('/#/history')
  await expect(page.locator('table')).toContainText('陋室銘')
  await expect(page.locator('table')).toContainText('測驗')
})

test('importing an article adds it to the library and opens it', async ({ page }) => {
  await boot(page, 'zhuyin')
  await page.goto('/#/library')
  await page.getByRole('button', { name: /匯入文章/ }).click()
  await page.getByPlaceholder('例如：我的日記').fill('測試短文')
  await page.locator('textarea.ta').fill('今天天氣很好，我們去公園散步。')
  await page.getByRole('button', { name: '加入文章庫' }).click()
  await expect(page.locator('.art-title h2')).toHaveText('測試短文')
  await page.goto('/#/library')
  await expect(page.locator('.tile', { hasText: '測試短文' })).toBeVisible()
})
