import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// 英語版：?lang=en で開くと、画面の文が英語になる（日本語が のこらない）。切りかえは覚えておく

const JA = /[぀-ヿ一-鿿]/

/** はじめて開いたときの記録（プレゼントの知らせは出さない）と、音なしの設定 */
async function seed(page: Page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return
    sessionStorage.setItem('seeded', '1')
    localStorage.setItem('pickle-asobi:settings', JSON.stringify({ sound: false, speak: false, levels: ['kids', 'otona'], rallyRules: 'easy', rallyTarget: 5, soloLevel: 'kids' }))
    localStorage.setItem(
      'pickle-asobi:progress',
      JSON.stringify({
        stars: 3,
        owned: ['design:orange', 'design:blue', 'shape:std'],
        wear: {},
        plays: {},
        days: [],
        mission: { day: '2000-01-01', progress: [0, 0, 0], done: [false, false, false], bonus: false },
        cleared: 0,
        parties: 0,
      }),
    )
  })
}

/** 画面に出ている文のうち、日本語の行（切りかえボタンの「にほんご」は のぞく） */
async function japaneseLines(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText()
  return text.split('\n').filter((l) => JA.test(l) && !l.includes('にほんご'))
}

test('?lang=en で ホームが英語になり、日本語が のこらない', async ({ page }) => {
  await seed(page)
  await page.goto('?lang=en#/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('.home-title')).toContainText('Play with')
  await expect(page.locator('[data-game="rally"]')).toContainText('Rally Battle')
  await expect(page).toHaveTitle(/Play with Pikuru/)
  expect(await japaneseLines(page)).toEqual([])
  // アドレスから ?lang は消える
  expect(page.url()).not.toContain('lang=')
})

test('どのゲームも、準備と はじめの画面に 日本語が のこらない', async ({ page }) => {
  test.setTimeout(120_000)
  await seed(page)
  await page.goto('?lang=en#/')
  const ids = [...new Set(await page.locator('a[data-game]').evaluateAll((as) => as.map((a) => (a as HTMLElement).dataset.game!)))].filter((id) => id !== 'party')
  expect(ids.length).toBeGreaterThan(20)
  const found: Record<string, string[]> = {}
  for (const id of ids) {
    for (const hash of [`#/setup/${id}`, `#/play/${id}`]) {
      await page.evaluate((h) => (location.hash = h), hash)
      await page.waitForTimeout(700)
      const lines = await japaneseLines(page)
      if (lines.length) found[hash] = lines
    }
  }
  await page.evaluate(() => (location.hash = '#/party'))
  await page.waitForTimeout(500)
  const party = await japaneseLines(page)
  if (party.length) found['#/party'] = party
  expect(found).toEqual({})
})

test('ホームの ボタンで 日本語と英語を切りかえ、ひらきなおしても覚えている', async ({ page }) => {
  await seed(page)
  await page.goto('?lang=en#/')
  await expect(page.locator('.home-title')).toContainText('Play with')
  await page.getByTestId('lang-toggle').click()
  await expect(page.locator('.home-title')).toContainText('ピクルくんと')
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  await page.reload()
  await expect(page.locator('.home-title')).toContainText('ピクルくんと')
  await page.getByTestId('lang-toggle').click()
  await expect(page.locator('.home-title')).toContainText('Play with')
  await page.reload()
  await expect(page.locator('.home-title')).toContainText('Play with')
})

test('英語の端末なら、はじめから英語', async ({ browser }) => {
  const ctx = await browser.newContext({ locale: 'en-US' })
  const page = await ctx.newPage()
  await seed(page)
  await page.goto('#/')
  await expect(page.locator('.home-title')).toContainText('Play with')
  await ctx.close()
})

test('おうちの方へ（英語）：確認のあと、ことばを選べる', async ({ page }) => {
  await seed(page)
  await page.goto('?lang=en#/parents')
  await expect(page.getByText('For grown-ups').first()).toBeVisible()
  expect(await japaneseLines(page)).toEqual([])
})
