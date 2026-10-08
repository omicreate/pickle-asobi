import { describe, expect, it } from 'vitest'
import { cleanSrc } from './counter'
import { __setPlayed, breakDue, oneMore, tookBreak } from './playtime'
import { shareLink, shareText } from '../ui/shareCard'

describe('集計の印（?src=）', () => {
  it('英数字・ハイフン・下線だけ。ほかは使わない（シートへの数式の混入を防ぐ）', () => {
    expect(cleanSrc('pb_ig_bio')).toBe('pb_ig_bio')
    expect(cleanSrc('share')).toBe('share')
    expect(cleanSrc('=HYPERLINK("x")')).toBe('')
    expect(cleanSrc('a'.repeat(41))).toBe('')
    expect(cleanSrc(null)).toBe('')
  })
})

describe('共有のリンク', () => {
  it('受け取った人が そのゲームの じゅんびの画面を すぐ開ける（共有から来た印つき）', () => {
    expect(shareLink('jump')).toBe('https://omicreate.github.io/pickle-asobi/?src=share#/setup/jump')
    expect(shareLink('party')).toBe('https://omicreate.github.io/pickle-asobi/?src=share#/party')
    expect(shareLink()).toBe('https://omicreate.github.io/pickle-asobi/?src=share')
  })
  it('ひとりの記録には「ちょうせんしてね」をそえる。公開版でないときは URL をつけない', () => {
    const t = shareText({ gameTitle: 'ピクルくん ジャンプ', title: '120m', game: 'jump', challenge: true })
    expect(t).toContain('ちょうせんしてね')
    expect(t).not.toContain('https://')
  })
})

describe('遊びすぎの声かけ', () => {
  it('決めた時間をこえたら声をかける。0分なら かけない', () => {
    __setPlayed(29 * 60)
    expect(breakDue(30)).toBe(false)
    __setPlayed(30 * 60)
    expect(breakDue(30)).toBe(true)
    expect(breakDue(0)).toBe(false)
  })
  it('きゅうけいしたら0から。「あと1かい」は5分後に また', () => {
    __setPlayed(31 * 60)
    oneMore(30)
    expect(breakDue(30)).toBe(false)
    __setPlayed(31 * 60)
    tookBreak()
    expect(breakDue(20)).toBe(false)
  })
})

describe('最後まで遊んだときの数（難しさの調整用）', () => {
  it('レベル・秒数・記録は 形が合うものだけ送る', async () => {
    const { cleanFinish, lowerWon } = await import('./counter')
    expect(cleanFinish({ lv: 'kids', sec: 42.4, val: 12 })).toEqual({ lv: 'kids', sec: '42', val: '12' })
    expect(cleanFinish({ lv: 'kids-senshu' })).toEqual({ lv: 'kids-senshu' })
    expect(cleanFinish({ lv: 'hacker', sec: -1, val: Number.NaN })).toEqual({})
    expect(cleanFinish({ sec: 999999 })).toEqual({ sec: '36000' })
    // ふたり：レベルの低い方（下の キッズ）が勝ったら1
    expect(lowerWon(['kids', 'otona'], 0)).toBe(1)
    expect(lowerWon(['kids', 'otona'], 1)).toBe(0)
    expect(lowerWon(['senshu', 'chibi'], 1)).toBe(1)
    expect(lowerWon(['kids', 'kids'], 0)).toBeUndefined()
    expect(lowerWon(['kids', 'otona'], null)).toBeUndefined()
  })
})
