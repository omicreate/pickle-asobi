// SNS の紹介（scripts/promo/build.mjs）で使う、アプリの本物の画面を撮る。
//   開発サーバーを 5180 番で起動してから：node scripts/promo/shots.mjs   → out/promo/shots/{ja,en}/*.png・out/promo/icons/*.png
// スマホ（390×844）を3倍で撮る。集計は止め、音と読み上げも止める。
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const root = new URL('../../', import.meta.url)
const path = (rel) => new URL(rel, root).pathname.replace(/^\/([A-Z]:)/, '$1')
const BASE = 'http://localhost:5180/pickle-asobi/'
const OUT = path('out/promo/')

const PROGRESS = {
  stars: 12,
  owned: ['design:orange', 'design:blue', 'shape:std'],
  wear: {},
  plays: {},
  days: [],
  mission: { day: '2000-01-01', progress: [0, 0, 0], done: [false, false, false], bonus: false },
  cleared: 0,
  parties: 0,
  best: {},
  medals: {},
  recent: [],
}

const browser = await chromium.launch()

async function open(lang, levels = ['kids', 'otona']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: lang === 'ja' ? 'ja-JP' : 'en-US' })
  const page = await ctx.newPage()
  await page.addInitScript(
    ([lv, pr, lg]) => {
      localStorage.setItem('pickle-asobi:settings', JSON.stringify({ sound: false, speak: false, counter: false, levels: lv, soloLevel: 'kids', sagasuMode: 'wally' }))
      localStorage.setItem('pickle-asobi:progress', JSON.stringify(pr))
      localStorage.setItem('pickle-asobi:lang', lg)
    },
    [levels, PROGRESS, lang],
  )
  return { ctx, page }
}

const tap = (page, testId, x, y) =>
  page.getByTestId(testId).evaluate(
    (el, a) => {
      for (const type of ['pointerdown', 'pointerup']) el.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX: a.x, clientY: a.y, bubbles: true, pointerType: 'touch', isPrimary: true }))
    },
    { x, y },
  )

async function shot(lang, name, hash, { levels, wait = 900, before } = {}) {
  const { ctx, page } = await open(lang, levels)
  await page.goto(`${BASE}#${hash}`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(wait)
  if (before) await before(page)
  await page.screenshot({ path: `${OUT}shots/${lang}/${name}.png` })
  await ctx.close()
  console.log(`  ${lang}/${name}`)
}

for (const lang of ['ja', 'en']) {
  mkdirSync(`${OUT}shots/${lang}`, { recursive: true })
  await shot(lang, 'home', '/')
  await shot(lang, 'setup', '/setup/rally', { levels: ['chibi', 'otona'] })
  await shot(lang, 'tug', '/play/tug', {
    wait: 4300,
    before: async (page) => {
      for (let i = 0; i < 14; i++) {
        await page.mouse.click(195, 700)
        await page.waitForTimeout(40)
      }
      await page.waitForTimeout(250)
    },
  })
  await shot(lang, 'jump', '/play/jump', {
    wait: 600,
    before: async (page) => {
      await tap(page, 'jump-canvas', 195, 500)
      await page.waitForTimeout(1700)
      await tap(page, 'jump-canvas', 195, 500)
      await page.waitForTimeout(260)
    },
  })
  await shot(lang, 'sagasu', '/play/sagasu', { wait: 1400 })
  await shot(lang, 'quiz', '/play/quiz', { wait: 5200 })
  await shot(lang, 'line', '/play/hayatouch', { levels: ['otona', 'senshu'], wait: 4200 })
  await shot(lang, 'nise', '/', {
    wait: 600,
    before: async (page) => {
      await page.locator('[data-game=nise]').click()
      await page.getByTestId('nise-count-4').click()
      await page.getByTestId('nise-deck-e').click()
      await page.getByTestId('nise-start').click()
      await page.getByTestId('nise-go').click()
      await page.waitForTimeout(500)
    },
  })
}

// ゲームの絵（ことばに よらない）
{
  mkdirSync(`${OUT}icons`, { recursive: true })
  const { ctx, page } = await open('ja')
  await page.goto(`${BASE}#/`)
  await page.waitForTimeout(800)
  const ids = await page.locator('.game-card[data-game]').evaluateAll((els) => els.map((e) => e.getAttribute('data-game')).filter((id) => id !== 'party'))
  for (const id of ids) await page.locator(`.game-card[data-game="${id}"] .game-icon`).first().screenshot({ path: `${OUT}icons/${id}.png`, omitBackground: true })
  console.log(`  icons ${ids.length}`)
  await ctx.close()
}

await browser.close()
