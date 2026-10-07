/**
 * ElevenLabs で前もって音声にしておくセリフの一覧（scripts/build-voice.mjs が読む）。
 * ここにない文は、端末の読み上げ（speechSynthesis）で読む。
 */
import { QUESTIONS } from '../games/quiz/questions'
import { GAMES } from '../shell/games'
import { howtoSpeech } from '../shell/howto'
import { champLine, nextGameLine, PARTY_COLORS, teamWinLine, turnLine } from '../shell/party/colors'
import { TEAMS } from '../shell/party/scoring'
import { ITEMS } from './items'
import { ALL_MISSIONS } from './missions'

/** ゲームの中で声に出す決まり文句 */
export const PHRASES = {
  ready: 'よーい',
  touch: 'タッチ！',
  correct: 'せいかい！',
  miss: 'ざんねん',
  draw: 'ひきわけ！',
  tooStrong: 'つよすぎ！ そっと ポンだよ',
  point0: 'オレンジの てん！',
  point1: 'あおの てん！',
  win0: 'オレンジの かち！',
  win1: 'あおの かち！',
  great: 'すごい！ さいこう きろく！',
  nice: 'ナイスショット！',
  youWin: 'やったね！ あなたの かち！',
  pikuruWin: 'ピクルくんの かち！ また あそぼう',
  missions: 'きょうの ミッション',
  missionClear: 'ミッション クリア！',
  newItem: 'あたらしい ごほうびを もらったよ！',
  welcome: 'はじめての プレゼント！ ほしを 3つ あげるね',
  partyIntro: 'じゅんばんモード！ じゅんばんに あそんで、きろくで しょうぶだよ',
  partyRound: 'ラウンドの けっかだよ',
  partyEnd: 'みんな よく がんばったね！',
  traded: 'こうかん したよ！',
  srFinal: 'ファイナル ラウンド！ とくてん 2ばい！',
  srLast: 'さいごの チャンス！ かえる？ そのまま？',
  srRead: 'よんだ！ リターン！',
  srAce: 'サービスエース！',
} as const

export function allVoiceLines(): string[] {
  const lines = new Set<string>()
  for (const g of GAMES) {
    lines.add(g.howto)
    for (const t of howtoSpeech(g.id)) lines.add(t)
  }
  for (const q of QUESTIONS.filter((x) => x.level === 'kids')) {
    lines.add(q.prompt)
    for (const c of q.choices) lines.add(c.text)
    lines.add(q.explain)
  }
  for (const p of Object.values(PHRASES)) lines.add(p)
  for (const m of ALL_MISSIONS) lines.add(m.text)
  for (const i of ITEMS) lines.add(i.label)
  for (const c of PARTY_COLORS) {
    lines.add(turnLine(c.name))
    lines.add(champLine(c.name))
  }
  for (const g of GAMES.filter((x) => x.party)) lines.add(nextGameLine(g.title))
  for (const t of TEAMS) lines.add(teamWinLine(t.name))
  return [...lines]
}
