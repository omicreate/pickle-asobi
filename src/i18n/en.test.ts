import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EN } from './en'
import { holes, keysIn } from './keys'
import { hasEn, t } from '.'

const SRC = join(__dirname, '..')
const JA = /[぀-ヿ一-鿿]/

/** 画面の文を持つファイル（テスト・ことばの表・開発用のページは のぞく） */
function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name)
    if (d.isDirectory()) return d.name === 'i18n' ? [] : sources(p)
    return /\.tsx?$/.test(d.name) && !/\.test\.|guideScenes|DevGuide|DevWear/.test(d.name) ? [p] : []
  })
}

const used = [...new Set(sources(SRC).flatMap((f) => keysIn(readFileSync(f, 'utf8'))))]

describe('英語の表', () => {
  it('画面の t() の文は、ぜんぶ英語がある', () => {
    expect(used.length).toBeGreaterThan(1000)
    expect(used.filter((k) => !hasEn(k))).toEqual([])
  })

  it('{0} などの入れる所・太字（**）・折り返し（|）が、日本語と同じ', () => {
    const bad = Object.entries(EN).filter(
      ([ja, en]) => holes(ja).join() !== holes(en).join() || ja.split('**').length !== en.split('**').length || ja.split('|').length !== en.split('|').length,
    )
    expect(bad).toEqual([])
  })

  it('英語の文に 日本語が のこっていない', () => {
    expect(Object.entries(EN).filter(([, en]) => JA.test(en))).toEqual([])
  })

  it('テストでは日本語のまま（端末のことばに よらない）', () => {
    expect(t('ラリーたいけつ')).toBe('ラリーたいけつ')
    expect(t('{0}てん', [3])).toBe('3てん')
    expect(t('{a}と{b}', { a: 'x', b: 'y' })).toBe('xとy')
  })
})

describe('keysIn', () => {
  it('別名（t as tr）や、エスケープした文も拾う', () => {
    const code = `import { t as tr } from '../i18n'\nconst a = tr('いち')\nconst b = tr("に\\"さん")\nconst c = foo.t('ちがう')`
    expect(keysIn(code)).toEqual(['いち', 'に"さん'])
  })
})
