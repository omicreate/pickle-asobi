// SNS の紹介：リール動画（縦 1080×1920）と画像（1080×1350・3枚）を、日本語版と英語版で作る。
//   1) 開発サーバーを 5180 番で起動して node scripts/promo/shots.mjs（アプリの本物の画面を撮る）
//   2) node scripts/promo/build.mjs [ja|en …] [--out 置き場所]   … 既定は両方・out/promo/dist/
// 台本は scripts/promo/scenes.mjs。ナレーションは ElevenLabs（日本語＝ELEVENLABS_VOICE_ID、英語＝ELEVENLABS_VOICE_ID_EN。鍵は表示しない）。
// out/promo/voice/ にためて二度課金しない。ffmpeg は となりの pb-studio のものを使う（build-guide-video.mjs と同じ）。
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'
import { GAME_COUNT, PROMO } from './scenes.mjs'
import { voiceKey } from '../../src/core/voiceKey.ts'

const root = new URL('../../', import.meta.url)
const path = (rel) => new URL(rel, root).pathname.replace(/^\/([A-Z]:)/, '$1')
const args = process.argv.slice(2)
const outAt = args.indexOf('--out')
const OUT = outAt >= 0 ? args[outAt + 1].replace(/[\\/]?$/, '/') : path('out/promo/dist/')
const langs = args.filter((a, i) => (a === 'ja' || a === 'en') && (outAt < 0 || i !== outAt + 1))
const LANGS = langs.length ? langs : ['ja', 'en']
const DIR = path('out/promo/')
const FPS = 15
const LEAD = 0.25
const TAIL = 0.45
// 読む速さ（ElevenLabs の speed。1＝ふつう）。リールは短く
const SPEED = 1.1
const FFMPEG = process.env.FFMPEG || path('../pb-studio/node_modules/ffmpeg-static/ffmpeg.exe')
const FFPROBE = process.env.FFPROBE || path('../pb-studio/node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe')
if (!existsSync(FFMPEG) || !existsSync(FFPROBE)) {
  console.error('ffmpeg / ffprobe が見つかりません（環境変数 FFMPEG・FFPROBE で場所を教えてください）')
  process.exit(1)
}
if (!existsSync(`${DIR}shots/ja/home.png`)) {
  console.error('先に node scripts/promo/shots.mjs で画面を撮ってください')
  process.exit(1)
}

// .env を読む（値は表示しない）
const env = { ...process.env }
for (const file of ['.env', '../pb-studio/.env']) {
  if (!existsSync(path(file))) continue
  for (const line of readFileSync(path(file), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m || env[m[1]]) continue
    if (file !== '.env' && m[1] !== 'ELEVENLABS_API_KEY') continue
    env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

async function narrate(lang, text) {
  const dir = `${DIR}voice/${lang}/`
  mkdirSync(dir, { recursive: true })
  const file = `${dir}${voiceKey(`${SPEED}:${text}`)}.mp3`
  if (existsSync(file)) return file
  const voice = lang === 'en' ? env.ELEVENLABS_VOICE_ID_EN : env.ELEVENLABS_VOICE_ID
  if (!env.ELEVENLABS_API_KEY || !voice) {
    console.error('.env に ELEVENLABS_API_KEY と声の ID を書いてください')
    process.exit(1)
  }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: env.ELEVENLABS_MODEL || 'eleven_v4', voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: SPEED } }),
  })
  if (!res.ok) {
    console.error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`)
    process.exit(1)
  }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  console.log(`  声（${lang}）：${text}`)
  return file
}
const probe = (f) => Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f]).toString().trim())

// ---------- 舞台（1枚の HTML。時刻を渡すと その瞬間の絵になる） ----------
const icons = readdirSync(`${DIR}icons`).filter((f) => f.endsWith('.png'))
const CSS = `
:root{--green:#2e5a1c;--body:#6bb33f;--lime:#d4f03c;--ink:#12302b;--orange:#ff8a3d;--cream:#ffe7b8;--navy:#24497a;--mute:#4f6a5f}
*{box-sizing:border-box}
html,body{margin:0;background:#ffe7b8}
.stage{position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(circle at 50% 28%,#fff8e8 0,#ffe7b8 68%);font-family:'Zen Maru Gothic',sans-serif;color:var(--ink);word-break:keep-all;overflow-wrap:anywhere}
.stage.still{height:1350px}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(107,179,63,.13) 9px,transparent 10px);background-size:120px 120px;background-position:30px 40px}
.top{position:absolute;left:50px;right:50px;top:110px;display:flex;flex-direction:column;align-items:center;gap:22px;text-align:center}
.title{margin:0;font-size:80px;font-weight:900;line-height:1.18;white-space:pre-line;color:var(--green);letter-spacing:.01em}
.en .title{font-size:78px;line-height:1.1}
.foot span,.foot b{white-space:nowrap}
.sub{margin:0;font-size:40px;font-weight:700;line-height:1.45;white-space:pre-line;color:var(--mute)}
.pill{display:inline-block;background:var(--green);color:#fff;font-size:44px;font-weight:900;border-radius:999px;padding:10px 40px}
.phone{position:absolute;width:var(--w);height:calc(var(--w)*844/390);border-radius:calc(var(--w)*.12);background:#1c2420;padding:calc(var(--w)*.03);box-shadow:0 34px 70px rgba(46,90,28,.30),0 0 0 6px rgba(255,255,255,.65)}
.phone img{display:block;width:100%;height:100%;border-radius:calc(var(--w)*.095);object-fit:cover}
.pk{position:absolute;filter:drop-shadow(0 18px 24px rgba(46,90,28,.25))}
.foot{position:absolute;left:0;right:0;bottom:0;height:120px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 54px;font-size:40px;font-weight:900}
.foot b{color:var(--lime)}
.still .foot{height:104px;font-size:36px}
.chips{display:flex;flex-wrap:wrap;justify-content:center;gap:18px}
.chip{background:var(--lime);border:5px solid var(--green);border-radius:999px;padding:8px 30px;font-size:42px;font-weight:900;white-space:nowrap}
.grid{position:absolute;display:grid;gap:22px}
.grid img{width:100%;display:block;border-radius:22%;box-shadow:0 8px 16px rgba(46,90,28,.18)}
.ripple{position:absolute;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;border:10px solid #fff;background:rgba(212,240,60,.45)}
.tag{position:absolute;background:var(--orange);color:#fff;font-size:38px;font-weight:900;border-radius:999px;padding:6px 26px;white-space:nowrap;box-shadow:0 8px 18px rgba(0,0,0,.15)}
.tag.blue{background:#3a86d6}
.col{position:absolute;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
.col .head{background:var(--green);color:#fff;font-size:40px;font-weight:900;border-radius:999px;padding:6px 30px}
.col .body{font-size:30px;font-weight:700;line-height:1.4;white-space:pre-line;color:var(--ink)}
.note{position:absolute;left:40px;right:40px;text-align:center;font-size:32px;font-weight:700;color:var(--mute);white-space:pre-line}
`

function stageHtml(lang) {
  const P = PROMO[lang]
  const data = { lang, P, icons, GAME_COUNT }
  const font = (w) => pathToFileURL(path(`node_modules/@fontsource/zen-maru-gothic/${w}.css`)).href
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<link rel="stylesheet" href="${font(700)}"><link rel="stylesheet" href="${font(900)}">
<style>${CSS}</style></head><body><div id="s" class="stage ${lang}"></div>
<script>
const D = ${JSON.stringify(data)}
const PK = (n) => '../../public/pikuru/cut-' + n + '.png'
const SHOT = (n) => 'shots/' + D.lang + '/' + n + '.png'
const clamp = (x) => Math.max(0, Math.min(1, x))
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3)
const pop = (x) => { x = clamp(x); return x < 1 ? 1 - Math.pow(1 - x, 3) * Math.cos(x * 5) : 1 }
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
const phone = (shot, x, y, w, extra = '') => '<div class="phone" data-anim="phone" style="--w:' + w + 'px;left:' + x + 'px;top:' + y + 'px;' + extra + '"><img src="' + SHOT(shot) + '"></div>'
const foot = (left) => '<div class="foot"><span>' + esc(left) + '</span><b>' + esc(D.P.handle) + '</b></div>'
const pk = (n, x, y, h) => '<img class="pk" data-anim="pk" src="' + PK(n) + '" style="left:' + x + 'px;top:' + y + 'px;height:' + h + 'px">'

function scene(sc) {
  const top = '<div class="top" data-anim="top"><h1 class="title">' + esc(sc.title) + '</h1>' + (sc.sub && sc.layout !== 'end' && sc.layout !== 'hook' ? '<p class="sub">' + esc(sc.sub) + '</p>' : '') + '</div>'
  let body = ''
  if (sc.id === 'hook') {
    body = '<div class="top" data-anim="top"><h1 class="title">' + esc(sc.title) + '</h1><span class="pill">' + esc(sc.sub) + '</span></div>'
      + phone(sc.phones[0], 500, 640, 500, 'rotate:5deg') + pk('full', 10, 860, 860)
    return body + foot(D.P.brand)
  }
  if (sc.layout === 'one') body = phone(sc.phones[0], 270, 560, 540) + pk('ok', -20, 1430, 330)
  if (sc.layout === 'face') {
    body = phone(sc.phones[0], 270, 470, 540)
      + '<div class="tag blue" data-anim="tag" style="left:540px;top:520px;transform:translate(-50%,0) rotate(180deg)">' + esc(D.P.near) + '</div>'
      + '<div class="tag" data-anim="tag" style="left:540px;top:1560px;transform:translate(-50%,0)">' + esc(D.P.far) + '</div>'
      + '<div class="ripple" data-ripple="0" style="left:430px;top:820px"></div><div class="ripple" data-ripple="1" style="left:660px;top:1380px"></div>'
      + pk('eh', -30, 1380, 330)
  }
  if (sc.layout === 'two') {
    const sub = sc.sub ? 1 : 0
    body = phone(sc.phones[0], 70, 600 + sub * 20, 450, 'rotate:-4deg') + phone(sc.phones[1], 560, 640 + sub * 20, 450, 'rotate:4deg')
  }
  if (sc.layout === 'grid') {
    const cells = D.icons.slice(0, D.GAME_COUNT).map((f) => '<img data-anim="cell" src="icons/' + f + '">').join('')
    body = '<div class="chips" style="position:absolute;left:60px;right:60px;top:300px">' + sc.chips.map((c) => '<span class="chip" data-anim="chip">' + esc(c) + '</span>').join('') + '</div>'
      + '<div class="grid" style="left:90px;top:' + (D.lang === 'en' ? 640 : 640) + 'px;width:900px;grid-template-columns:repeat(6,1fr)">' + cells + '</div>'
      + pk('ok', 700, 1360, 330)
  }
  if (sc.layout === 'end') {
    body = '<div class="top" data-anim="top" style="top:200px"><h1 class="title" style="font-size:96px">' + esc(sc.title) + '</h1></div>'
      + pk('full', 190, 470, 900)
      + '<div class="note" data-anim="top" style="top:1430px;font-size:56px;color:var(--green);font-weight:900">' + esc(sc.sub) + '</div>'
      + '<div class="note" data-anim="top" style="top:1530px;font-size:46px">' + esc(D.P.handle) + '</div>'
    return body + foot(D.P.brand)
  }
  return top + body + foot(D.P.brand)
}

let cur = -1
window.__reel = (i, t, d) => new Promise((res) => {
  const s = document.getElementById('s')
  if (cur !== i) { s.className = 'stage ' + D.lang; s.innerHTML = '<div class="dots"></div>' + scene(D.P.scenes[i]); cur = i }
  s.style.opacity = String(Math.min(1, t / 0.25))
  s.querySelectorAll('[data-anim=top]').forEach((e) => { e.style.translate = '0 ' + ((1 - ease(t / 0.45)) * -40) + 'px' })
  s.querySelectorAll('[data-anim=phone]').forEach((e, k) => { const p = ease((t - 0.12 - k * 0.18) / 0.55); e.style.translate = '0 ' + ((1 - p) * 160) + 'px'; e.style.opacity = String(p); e.style.scale = String(1 + 0.025 * clamp(t / d)) })
  s.querySelectorAll('[data-anim=pk]').forEach((e) => { e.style.translate = '0 ' + (Math.sin(t * 4.2) * 9) + 'px' })
  s.querySelectorAll('[data-anim=chip],[data-anim=tag]').forEach((e, k) => { const p = pop((t - 0.3 - k * 0.12) / 0.4); e.style.scale = String(p); e.style.opacity = String(clamp(p * 3)) })
  s.querySelectorAll('[data-anim=cell]').forEach((e, k) => { const p = pop((t - 0.6 - k * 0.045) / 0.35); e.style.scale = String(p) })
  s.querySelectorAll('[data-ripple]').forEach((e) => { const ph = ((t + Number(e.dataset.ripple) * 0.31) % 0.62) / 0.62; e.style.scale = String(0.4 + ph); e.style.opacity = String(t < 0.5 ? 0 : 1 - ph) })
  requestAnimationFrame(() => requestAnimationFrame(() => res(true)))
})

// ---------- 画像（1080×1350） ----------
function still(name) {
  const S = D.P.stills[name]
  const s = document.getElementById('s')
  s.className = 'stage still ' + D.lang
  s.style.opacity = '1'
  cur = -1
  let h = '<div class="dots"></div>'
  if (name === 'hero') {
    h += '<div style="position:absolute;left:60px;top:70px;right:300px">'
      + '<div style="font-size:38px;font-weight:900;color:#c4570f">' + esc(S.kicker) + '</div>'
      + '<h1 class="title" style="text-align:left;font-size:' + (D.lang === 'en' ? 68 : 76) + 'px;margin-top:14px">' + esc(S.title) + '</h1></div>'
      + '<img class="pk" src="' + PK('full') + '" style="right:30px;top:40px;height:390px">'
      + phone('tug', 70, 740, 330, 'rotate:-7deg') + phone('quiz', 690, 740, 330, 'rotate:7deg') + phone('home', 375, 700, 340)
      + '<div class="chips" style="position:absolute;left:50px;right:50px;top:440px">' + S.chips.map((c) => '<span class="chip" style="font-size:36px">' + esc(c) + '</span>').join('') + '</div>'
      + '<div style="position:absolute;left:0;right:0;top:612px;text-align:center"><span class="tag" style="position:static;display:inline-block;font-size:36px">' + esc(S.foot) + '</span></div>'
      + '<div class="foot"><span>' + esc(D.P.brand) + '</span><b>' + esc(D.P.handle) + '</b></div>'
  }
  if (name === 'ways') {
    h += '<div class="top" style="top:60px"><h1 class="title">' + esc(S.title) + '</h1></div>'
    S.items.forEach((it, k) => {
      const x = 40 + k * 340
      h += phone(it.shot, x + 20, 230, 300) + '<div class="col" style="left:' + x + 'px;top:905px;width:340px"><span class="head">' + esc(it.head) + '</span><span class="body">' + esc(it.body) + '</span></div>'
    })
    h += '<div class="note" style="top:1150px">' + esc(S.foot) + '</div>'
      + '<div class="foot"><span>' + esc(D.P.brand) + '</span><b>' + esc(D.P.handle) + '</b></div>'
  }
  if (name === 'levels') {
    const cells = D.icons.slice(0, D.GAME_COUNT).map((f) => '<img src="icons/' + f + '">').join('')
    h += '<div class="top" style="top:50px;gap:14px"><h1 class="title" style="font-size:' + (D.lang === 'en' ? 72 : 84) + 'px">' + esc(S.title) + '</h1><p class="sub" style="font-size:34px">' + esc(S.sub) + '</p></div>'
      + phone('setup', 60, D.lang === 'en' ? 430 : 380, 330)
      + '<div style="position:absolute;left:450px;top:' + (D.lang === 'en' ? 440 : 390) + 'px;width:570px;text-align:center"><span class="pill" style="font-size:42px">' + esc(S.grid) + '</span></div>'
      + '<div class="grid" style="left:460px;top:' + (D.lang === 'en' ? 540 : 490) + 'px;width:560px;gap:14px;grid-template-columns:repeat(5,1fr)">' + cells + '</div>'
      + '<div class="note" style="top:1150px;font-size:30px">' + esc(S.rule) + '\\n' + esc(S.foot) + '</div>'
      + '<div class="foot"><span>' + esc(D.P.brand) + '</span><b>' + esc(D.P.handle) + '</b></div>'
  }
  s.innerHTML = h
  return new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => res(true))))
}
window.__still = still
</script></body></html>`
}

// ---------- 作る ----------
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
for (const lang of LANGS) {
  const P = PROMO[lang]
  const html = `${DIR}stage-${lang}.html`
  writeFileSync(html, stageHtml(lang))

  // ナレーションと長さ
  let start = 0
  const plan = []
  for (const [i, sc] of P.scenes.entries()) {
    const file = await narrate(lang, sc.say)
    const d = Math.max(sc.min, LEAD + probe(file) + TAIL)
    plan.push({ i, id: sc.id, file, start, d })
    start += d
  }
  const total = start
  console.log(`${lang}：場面 ${plan.length}・${total.toFixed(1)} 秒`)

  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.goto(pathToFileURL(html).href)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)

  // 画像（3枚）と、リールの表紙
  await page.setViewportSize({ width: 1080, height: 1350 })
  for (const [k, name] of ['hero', 'ways', 'levels'].entries()) {
    await page.evaluate((n) => window.__still(n), name)
    await page.evaluate(() => Promise.all([...document.images].map((im) => im.decode().catch(() => {}))))
    await page.screenshot({ path: `${OUT}${lang}_${k + 1}_${name}.png` })
  }
  await page.setViewportSize({ width: 1080, height: 1920 })
  await page.evaluate(([i, t, d]) => window.__reel(i, t, d), [0, plan[0].d, plan[0].d])
  await page.evaluate(() => Promise.all([...document.images].map((im) => im.decode().catch(() => {}))))
  await page.screenshot({ path: `${OUT}${lang}_reel_cover.jpg`, type: 'jpeg', quality: 92 })

  // リールの1コマずつ
  const FRAMES = `${DIR}frames-${lang}/`
  if (existsSync(FRAMES)) rmSync(FRAMES, { recursive: true })
  mkdirSync(FRAMES, { recursive: true })
  let n = 0
  for (const p of plan) {
    const frames = Math.round(p.d * FPS)
    for (let f = 0; f < frames; f++) {
      await page.evaluate(([i, t, d]) => window.__reel(i, t, d), [p.i, f / FPS, p.d])
      if (f === 0) await page.evaluate(() => Promise.all([...document.images].map((im) => im.decode().catch(() => {}))))
      await page.screenshot({ path: `${FRAMES}${String(n++).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 })
    }
  }
  await ctx.close()

  const inputs = plan.flatMap((p) => ['-i', p.file])
  const delays = plan.map((p, k) => `[${k + 1}:a]adelay=${Math.round((p.start + LEAD) * 1000)}:all=1[a${k}]`).join(';')
  const mix = `${delays};${plan.map((_, k) => `[a${k}]`).join('')}amix=inputs=${plan.length}:duration=longest:normalize=0,apad[aout]`
  const mp4 = `${OUT}${lang}_reel.mp4`
  execFileSync(
    FFMPEG,
    ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${FRAMES}%05d.jpg`, ...inputs, '-filter_complex', mix, '-map', '0:v', '-map', '[aout]', '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-t', total.toFixed(2), '-movflags', '+faststart', mp4],
    { stdio: 'inherit' },
  )
  console.log(`できた：${mp4}（${total.toFixed(1)} 秒）`)
}
await browser.close()
