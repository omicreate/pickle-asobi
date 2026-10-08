// OGP 画像（dist/ogp.png・1200×630）を作る。npm run build の中で、vite build のあとに動く
// ビルドした dist/ を vite preview で開き、アプリの画面に重ねて描いて、同梱の書体で撮る
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
const server = await preview({ preview: { port: 0, host: '127.0.0.1', open: false }, logLevel: 'warn' })
const URL_ = server.resolvedUrls.local[0]
const OUT = new URL('../dist/', import.meta.url)
const browser = await chromium.launch()
// 日本語の端末として開く（CI は英語の端末）。まだ sw.js に一覧を埋めこむ前なので、サービスワーカーは止めておく
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, locale: 'ja-JP', serviceWorkers: 'block' })
const page = await ctx.newPage()
await page.addInitScript(() => {
  localStorage.setItem('pickle-asobi:settings', JSON.stringify({ sound: false, speak: false }))
  localStorage.setItem('pickle-asobi:progress', JSON.stringify({ stars: 3, owned: [], wear: {}, plays: {}, days: [], mission: { day: 'x', progress: [0,0,0], done: [false,false,false], bonus: false }, cleared: 0, parties: 0, best: {}, medals: {}, recent: [] }))
})
await page.goto(URL_)
await page.waitForSelector('.game-card[data-game]')
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(500)
// 本数は ホームに並ぶ ゲームのカードから数える（じゅんばんモードは のぞく）。games.ts に足しても ずれない
const count = await page.evaluate(() => new Set([...document.querySelectorAll('.game-card[data-game]')].map((a) => a.dataset.game).filter((id) => id !== 'party')).size)
if (!count) throw new Error('ゲームのカードが 見つからない')
await page.evaluate((count) => {
  const pick = ['rally', 'tug', 'quiz', 'jump', 'curling', 'serveread']
  const icons = pick.map((id) => {
    const svg = document.querySelector(`.game-card[data-game=${id}] .game-icon`).cloneNode(true)
    svg.setAttribute('width', '92'); svg.setAttribute('height', '92')
    return svg.outerHTML
  }).join('')
  const box = document.createElement('div')
  box.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#ffe7b8;display:flex;align-items:center;gap:24px;padding:0 48px;font-family:"Zen Maru Gothic",sans-serif;color:#12302b'
  box.innerHTML = `
    <div style="position:absolute;inset:0;background:radial-gradient(circle at 18% 50%, #fff6e3 0, #ffe7b8 60%)"></div>
    <img src="/pickle-asobi/pikuru/cut-full.png" style="position:relative;height:470px;flex:none">
    <div style="position:relative;display:flex;flex-direction:column;gap:18px">
      <div style="font-size:30px;font-weight:900;color:#c4570f">親子・なかまで 1台を かこんで</div>
      <div style="font-size:76px;font-weight:900;line-height:1.05;color:#2e5a1c;white-space:nowrap">ピクルくんとあそぼ</div>
      <div style="font-size:30px;font-weight:900">ピックルボールの ミニゲーム ${count}本</div>
      <div style="display:flex;gap:14px;margin-top:6px">${icons}</div>
      <div style="font-size:22px;font-weight:700;color:#4f6a5f">むりょう・インストール いらず・ひとりでも みんなでも</div>
    </div>`
  document.body.appendChild(box)
}, count)
await page.evaluate(() => Promise.all([...document.images].map((img) => img.decode())).then(() => document.fonts.ready))
await page.waitForTimeout(300)
await page.screenshot({ path: fileURLToPath(new URL('ogp.png', OUT)) })
await browser.close()
await server.close()
console.log(`ogp.png: ミニゲーム ${count}本`)
