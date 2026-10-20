// 見た目の点検用に、主な画面を撮る（デザインシステム「ピクルポップ」の置き換えで崩れていないかを比べる）
// 使い方：npm run build のあと node scripts/design-shots.mjs out/shots/before
//         見た目を直してビルドし直したら node scripts/design-shots.mjs out/shots/after
//         node scripts/design-diff.mjs out/shots/before out/shots/after で、ちがう画面を数える
// 動きを止めて（prefers-reduced-motion）、記録と設定を固定して撮る。音は出さない
import { mkdirSync } from 'node:fs'
import { preview } from 'vite'
import { chromium } from '@playwright/test'

const out = process.argv[2]
if (!out) throw new Error('撮った画像を置くフォルダを 指定する（例：out/shots/before）')
mkdirSync(out, { recursive: true })

// 画面（#/…）。ゲームは始まりの画面だけ（動きが止まらないので）
const SCREENS = [
  ['home', ''],
  ['setup-rally', '#/setup/rally'],
  ['setup-quiz', '#/setup/quiz'],
  ['setup-jump', '#/setup/jump'],
  ['collection', '#/collection'],
  ['records', '#/records'],
  ['parents', '#/parents'],
  ['party', '#/party'],
  ['install', '#/install'],
]
const SIZES = [
  ['phone', { width: 390, height: 844 }],
  ['tablet', { width: 1180, height: 820 }],
]
const LANGS = ['ja', 'en']

const server = await preview({ preview: { port: 0, host: '127.0.0.1', open: false }, logLevel: 'warn' })
const base = server.resolvedUrls.local[0]
// ローカルで Playwright の版とブラウザが合わないときは PW_CHROMIUM にブラウザの場所を入れる
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
let n = 0
for (const lang of LANGS) {
  for (const [size, viewport] of SIZES) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, locale: lang === 'ja' ? 'ja-JP' : 'en-US', serviceWorkers: 'block', reducedMotion: 'reduce' })
    await ctx.addInitScript(() => {
      localStorage.setItem('pickle-asobi:settings', JSON.stringify({ sound: false, speak: false, levels: ['kids', 'otona'], rallyRules: 'easy', rallyTarget: 5, soloLevel: 'kids' }))
      localStorage.setItem('pickle-asobi:progress', JSON.stringify({ stars: 12, owned: ['design:orange', 'design:blue', 'shape:std'], wear: {}, plays: {}, days: [], mission: { day: '2000-01-01', progress: [0, 0, 0], done: [false, false, false], bonus: false }, cleared: 0, parties: 0 }))
      // きょうの曜日やミッションが日によって変わらないように、時計を固定する
      const fixed = new Date('2026-10-20T10:00:00+09:00').getTime()
      const RealDate = Date
      // @ts-ignore
      globalThis.Date = class extends RealDate {
        constructor(...a) { super(...(a.length ? a : [fixed])) }
        static now() { return fixed }
      }
      Math.random = (() => { let s = 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647) })()
    })
    const page = await ctx.newPage()
    for (const [name, hash] of SCREENS) {
      await page.goto(base + (lang === 'en' ? '?lang=en' : '') + hash)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(600)
      await page.screenshot({ path: `${out}/${lang}-${size}-${name}.png`, fullPage: true, animations: 'disabled' })
      n++
    }
    await ctx.close()
  }
}
await browser.close()
await server.close()
console.log(`${n} 枚 撮った → ${out}`)
