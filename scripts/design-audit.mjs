// デザインシステム「ピクルポップ」に そろっていない値を数える（いまは報告だけ。0 に近づけていく）
// 使い方：node scripts/design-audit.mjs   （--list で 場所も出す）
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('../src/', import.meta.url).pathname
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })
const files = walk(root)
const css = files.filter((f) => f.endsWith('.css') && !f.endsWith('design/tokens.css'))
const ts = files.filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))
const list = process.argv.includes('--list')

function count(label, paths, re, norm = (s) => s, skip = () => false) {
  const seen = new Map()
  for (const p of paths) {
    const text = readFileSync(p, 'utf8')
    for (const m of text.matchAll(re)) {
      const v = norm(m[1] ?? m[0])
      if (skip(v)) continue
      const at = `${relative(root, p)}:${text.slice(0, m.index).split('\n').length}`
      seen.set(v, [...(seen.get(v) ?? []), at])
    }
  }
  const uses = [...seen.values()].reduce((s, a) => s + a.length, 0)
  console.log(`${label}: ${seen.size} 種類・${uses} か所`)
  if (list) for (const [v, at] of [...seen].sort((x, y) => y[1].length - x[1].length)) console.log(`  ${v}\t${at.length}\t${at.slice(0, 4).join(' ')}`)
}

count('CSS の生の色（tokens.css 以外）', css, /(#[0-9a-fA-F]{3,8})\b/g, (s) => s.toLowerCase())
count('TS の生の色', ts, /['"`](#[0-9a-fA-F]{3,8})['"`]/g, (s) => s.toLowerCase())
count('文字の大きさ（変数でない）', css, /font-size:\s*([^;]+);/g, (s) => s.trim(), (v) => /^var\(--fs-/.test(v))
count('影（変数でない）', css, /box-shadow:\s*([^;]+);/g, (s) => s.trim(), (v) => /^var\(--shadow/.test(v) || v === 'none')
count('角の丸み（変数でない）', css, /border-radius:\s*([^;]+);/g, (s) => s.trim(), (v) => /^var\(--(r|radius)-[a-z]+\)$/.test(v) || v === '50%')
count('文字の太さ', css, /font-weight:\s*([^;]+);/g)
