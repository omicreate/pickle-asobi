import { describe, expect, it } from 'vitest'
import { GAMES } from './games'

// SNS の紹介の台本（scripts/promo/scenes.mjs）は games.ts のソースから本数を数える。数え方が ずれていないか
const SCENES = '../../scripts/promo/scenes.mjs' as string

describe('SNS の紹介の ミニゲームの数', () => {
  it('GAMES の数と同じ', async () => {
    const { GAME_COUNT, PROMO } = await import(/* @vite-ignore */ SCENES)
    expect(GAME_COUNT).toBe(GAMES.length)
    expect(PROMO.ja.scenes.find((s: { id: string }) => s.id === 'grid').title).toBe(`ミニゲーム ${GAMES.length}本`)
  })

  it('本数の読み（声が かすれないよう 区切る）', async () => {
    const { jaHon, enCount } = await import(/* @vite-ignore */ SCENES)
    expect(jaHon(23)).toBe('にじゅう さんぼん')
    expect(jaHon(20)).toBe('にじゅっぽん')
    expect(jaHon(31)).toBe('さんじゅう いっぽん')
    expect(jaHon(18)).toBe('じゅう はっぽん')
    expect(enCount(23)).toBe('Twenty-three')
    expect(enCount(30)).toBe('Thirty')
    expect(enCount(17)).toBe('Seventeen')
  })
})
