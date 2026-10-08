// 英語版の表の もれを さがす：src の t('…') / tr('…') の日本語の文を集めて、英語の表（src/i18n/en）に無いものを出す。
//   node scripts/i18n-keys.mjs              … 無い文の数と、はじめの いくつか
//   node scripts/i18n-keys.mjs --out a.json … 無い文を配列で書き出す（訳して src/i18n/en/ui.ts に足す）
import { readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createServer } from 'vite'
import { keysIn } from '../src/i18n/keys.ts'

const root = new URL('../', import.meta.url)
const path = (rel) => new URL(rel, root).pathname.replace(/^\/([A-Z]:)/, '$1')
const outAt = process.argv.indexOf('--out')

const files = execSync('git ls-files -co --exclude-standard "src/*.ts" "src/*.tsx"', { cwd: path('') })
  .toString()
  .trim()
  .split('\n')
  .filter((f) => !/\.test\.|\/i18n\//.test(f))
const used = []
for (const f of files) for (const k of keysIn(readFileSync(path(f), 'utf8'))) if (!used.includes(k)) used.push(k)

const server = await createServer({
  root: path(''),
  cacheDir: 'node_modules/.vite-voice',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})
const { EN } = await server.ssrLoadModule('/src/i18n/en/index.ts')
await server.close()

const missing = used.filter((k) => !(k in EN))
const unused = Object.keys(EN).filter((k) => !used.includes(k))
console.log(`つかっている文 ${used.length}・英語の表 ${Object.keys(EN).length}・表に無い ${missing.length}・表にあるが つかっていない ${unused.length}`)
if (outAt > 0) writeFileSync(process.argv[outAt + 1], JSON.stringify(missing, null, 1))
else missing.slice(0, 30).forEach((k) => console.log(' ', k))
