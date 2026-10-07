/**
 * きょうの ミッション。日付から毎日3つ決まる（どの端末でも、その日は同じミッション）。
 * ①かんたん（あそぶだけ） ②きろく（ひとりで遊ぶゲームの目標） ③いっしょに（ふたり・みんなで）
 * 目標の数はレベルに関係なく同じ。レベルでゲームの難しさが変わるので、小さい子でも届く数（どうメダルより下）にしている。
 * ③いっしょに は、ひとりで遊ぶ子のために ピクルくんと ラリーでも クリアになる。
 */
import type { GameId } from '../shell/games'
import { hashString } from './rng'

export type MissionKind = 'play' | 'value' | 'any' | 'two' | 'party'

export interface MissionDef {
  id: string
  /** 読み上げる・画面に出す文（ひらがな中心） */
  text: string
  kind: MissionKind
  /** いくつで達成か（play・any・two・party は回数、value はそのゲームの記録） */
  need: number
  game?: GameId
  /** いっしょに（③）のミッション。ひとりのときは ピクルくんと ラリーでも クリアになる */
  together?: boolean
}

/** ひとりで遊ぶ子も ③いっしょに を クリアできるように：ピクルくん（コンピューター）と ラリー */
export const SOLO_PARTNER: GameId = 'pikuru'

export const EASY: MissionDef[] = [
  { id: 'any-2', text: 'ゲームを 2かい あそぼう', kind: 'any', need: 2 },
  { id: 'play-jump', text: 'ピクルくん ジャンプで あそぼう', kind: 'play', need: 1, game: 'jump' },
  { id: 'play-lift', text: 'ポンポン リフティングで あそぼう', kind: 'play', need: 1, game: 'lift' },
  { id: 'play-catch', text: 'ボールキャッチで あそぼう', kind: 'play', need: 1, game: 'catch' },
  { id: 'play-breakout', text: 'ピクルくずしで あそぼう', kind: 'play', need: 1, game: 'breakout' },
  { id: 'play-target', text: 'ねらってショットで あそぼう', kind: 'play', need: 1, game: 'target' },
  { id: 'play-pikuru', text: 'ピクルくんと ラリーで あそぼう', kind: 'play', need: 1, game: 'pikuru' },
  { id: 'play-reaction', text: 'リアクション ボレーで あそぼう', kind: 'play', need: 1, game: 'reaction' },
  { id: 'play-stop10', text: 'ピタッと 10びょうで あそぼう', kind: 'play', need: 1, game: 'stop10' },
  { id: 'play-sagasu', text: 'ピクルくん さがしで あそぼう', kind: 'play', need: 1, game: 'sagasu' },
]

export const RECORD: MissionDef[] = [
  { id: 'jump-30', text: 'ジャンプで 30メートル はしろう', kind: 'value', need: 30, game: 'jump' },
  { id: 'lift-3', text: 'リフティングを 3かい しよう', kind: 'value', need: 3, game: 'lift' },
  { id: 'catch-6', text: 'ボールキャッチで 6てん とろう', kind: 'value', need: 6, game: 'catch' },
  { id: 'breakout-10', text: 'ピクルくずしで 10てん とろう', kind: 'value', need: 10, game: 'breakout' },
  { id: 'target-2', text: 'ねらってショットで 2こ いれよう', kind: 'value', need: 2, game: 'target' },
]

export const TOGETHER: MissionDef[] = ([
  { id: 'two-1', text: 'ふたりで あそぶ ゲームを 1かい あそぼう', kind: 'two', need: 1 },
  { id: 'dink-2', text: 'ディンクで 2かい つなごう', kind: 'value', need: 2, game: 'dink' },
  { id: 'tug-1', text: 'れんだ つなひきで しょうぶしよう', kind: 'play', need: 1, game: 'tug' },
  { id: 'air-1', text: 'エアピックルで しょうぶしよう', kind: 'play', need: 1, game: 'air' },
  { id: 'quiz-1', text: 'ピクルくんクイズで あそぼう', kind: 'play', need: 1, game: 'quiz' },
  { id: 'rally-1', text: 'ラリーたいけつで しょうぶしよう', kind: 'play', need: 1, game: 'rally' },
  { id: 'party-1', text: 'じゅんばんモードで あそぼう', kind: 'party', need: 1 },
  { id: 'linestop-1', text: 'ラインぎわ ストップで しょうぶしよう', kind: 'play', need: 1, game: 'linestop' },
  { id: 'curling-1', text: 'キッチン カーリングで しょうぶしよう', kind: 'play', need: 1, game: 'curling' },
  { id: 'serveread-1', text: 'よみあい サーブで しょうぶしよう', kind: 'play', need: 1, game: 'serveread' },
  { id: 'gesture-1', text: 'ジェスチャー ピックルで あそぼう', kind: 'play', need: 1, game: 'gesture' },
  { id: 'sagasu2-1', text: 'ピクルくん さがし たいせんで しょうぶしよう', kind: 'play', need: 1, game: 'sagasu2' },
  { id: 'ishin-1', text: 'いしんでんしん ダブルスで あそぼう', kind: 'play', need: 1, game: 'ishin' },
] as MissionDef[]).map((m) => ({ ...m, together: true }))

export const ALL_MISSIONS = [...EASY, ...RECORD, ...TOGETHER]

/** 1日に全部クリアしたときの おまけ */
export const BONUS_STARS = 2

/** 端末の時刻での日付（YYYY-MM-DD） */
export function dayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** その日の3つ。①と②で同じゲームにならないようにする */
export function missionsFor(day: string): MissionDef[] {
  const h = hashString(day)
  const a = EASY[h % EASY.length]
  let b = RECORD[(h >>> 8) % RECORD.length]
  if (a.game && a.game === b.game) b = RECORD[((h >>> 8) + 1) % RECORD.length]
  const c = TOGETHER[(h >>> 16) % TOGETHER.length]
  return [a, b, c]
}

/** record＝じこベスト・メダルに数える（ひとりで遊んだとき・ディンク。じゅんばんモードは数えない） */
export type PlayEvent = { type: 'finish'; game: GameId; value?: number; two: boolean; record?: boolean } | { type: 'party' }

/** 1回遊んだあとの進み具合 */
export function advance(def: MissionDef, current: number, ev: PlayEvent): number {
  if (ev.type === 'party') return def.kind === 'party' ? current + 1 : current
  // ③いっしょに は、ひとりなら ピクルくんと ラリーで クリア
  if (def.together && ev.game === SOLO_PARTNER) return Math.max(current, def.need)
  switch (def.kind) {
    case 'any':
      return current + 1
    case 'two':
      return ev.two ? current + 1 : current
    case 'play':
      return ev.game === def.game ? current + 1 : current
    case 'value':
      return ev.game === def.game && ev.value !== undefined ? Math.max(current, ev.value) : current
    case 'party':
      return current
  }
}
