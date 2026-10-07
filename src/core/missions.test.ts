import { describe, expect, it } from 'vitest'
import { advance, EASY, RECORD, SOLO_PARTNER, TOGETHER } from './missions'
import { MEDAL_RULES } from './records'

describe('ミッションの ハードル', () => {
  it('記録のミッションは どうメダルより下（小さい子でも届く）', () => {
    for (const m of [...RECORD, ...TOGETHER.filter((x) => x.kind === 'value')]) {
      const rule = MEDAL_RULES[m.game!]
      expect(rule, m.id).toBeTruthy()
      expect(m.need, m.id).toBeLessThan(rule!.need[0])
    }
  })

  it('①は 2かい あそぶだけ・あるいは 1かい', () => {
    for (const m of EASY) expect(m.need, m.id).toBeLessThanOrEqual(2)
  })

  it('③いっしょに は、ひとりなら ピクルくんと ラリーで クリアになる', () => {
    expect(TOGETHER.every((m) => m.together)).toBe(true)
    for (const m of TOGETHER) expect(advance(m, 0, { type: 'finish', game: SOLO_PARTNER, two: false }), m.id).toBe(m.need)
    // ③ではないミッションは そうならない
    const jump = RECORD.find((m) => m.game === 'jump')!
    expect(advance(jump, 0, { type: 'finish', game: SOLO_PARTNER, two: false })).toBe(0)
  })
})
