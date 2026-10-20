// design-shots.mjs で撮った2つのフォルダを くらべて、ちがう画面と ちがう点の数を出す（依存は足さず、ブラウザの canvas で数える）
// 使い方：node scripts/design-diff.mjs out/shots/before out/shots/after
// ちがう所を赤くぬった画像を out/shots/diff/ に置く。ちがう画面が1つでもあれば 終了コード 1
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from '@playwright/test'

const [a, b] = process.argv.slice(2)
if (!a || !b) throw new Error('くらべる2つのフォルダを 指定する')
const diffDir = join(b, '..', 'diff')
mkdirSync(diffDir, { recursive: true })
const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
const page = await browser.newPage()
const url = (p) => 'data:image/png;base64,' + readFileSync(p).toString('base64')
let changed = 0
const rows = []
for (const file of readdirSync(a).filter((f) => f.endsWith('.png')).sort()) {
  const other = join(b, file)
  if (!existsSync(other)) { rows.push([file, 'あとが ない']); changed++; continue }
  const r = await page.evaluate(async ([x, y]) => {
    const load = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = src })
    const [p, q] = await Promise.all([load(x), load(y)])
    const w = Math.max(p.width, q.width), h = Math.max(p.height, q.height)
    const grab = (img) => { const c = new OffscreenCanvas(w, h); const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, h) }
    const da = grab(p), db = grab(q)
    const out = new OffscreenCanvas(w, h), g = out.getContext('2d'), od = g.createImageData(w, h)
    let diff = 0
    for (let i = 0; i < da.data.length; i += 4) {
      const d = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2])
      if (d > 24) { diff++; od.data[i] = 255; od.data[i + 3] = 255 } else { od.data[i] = od.data[i + 1] = od.data[i + 2] = db.data[i] * 0.3 + 170; od.data[i + 3] = 255 }
    }
    g.putImageData(od, 0, 0)
    const blob = await out.convertToBlob()
    const buf = new Uint8Array(await blob.arrayBuffer())
    let s = ''; for (const ch of buf) s += String.fromCharCode(ch)
    return { diff, size: p.width === q.width && p.height === q.height ? '' : `${p.width}×${p.height} → ${q.width}×${q.height}`, png: btoa(s) }
  }, [url(join(a, file)), url(other)])
  if (r.diff || r.size) {
    changed++
    writeFileSync(join(diffDir, file), Buffer.from(r.png, 'base64'))
    rows.push([file, `${r.diff} 点 ${r.size}`])
  }
}
await browser.close()
for (const [f, m] of rows) console.log(`${f}\t${m}`)
console.log(changed ? `${changed} 画面が ちがう（赤い所 → ${diffDir}）` : 'ちがう画面は ない')
process.exit(changed ? 1 : 0)
