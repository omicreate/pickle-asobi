/**
 * ElevenLabs で前もって音声にしておくセリフの一覧（scripts/build-voice.mjs が読む）。
 * ここにない文は、端末の読み上げ（speechSynthesis）で読む。
 */
import { I_QUESTIONS } from '../games/ishin/questions'
import { QUESTIONS } from '../games/quiz/questions'
import { GAMES } from '../shell/games'
import { howtoSpeech } from '../shell/howto'
import { champLine, nextGameLine, PARTY_COLORS, teamWinLine, turnLine } from '../shell/party/colors'
import { TEAMS } from '../shell/party/scoring'
import { ITEMS } from './items'
import { ALL_MISSIONS } from './missions'
import { t } from '../i18n'

/** ゲームの中で声に出す決まり文句 */
export const PHRASES = {
  ready: t('よーい'),
  touch: t('タッチ！'),
  correct: t('せいかい！'),
  miss: t('ざんねん'),
  draw: t('ひきわけ！'),
  tooStrong: t('つよすぎ！ そっと ポンだよ'),
  point0: t('オレンジの てん！'),
  point1: t('あおの てん！'),
  win0: t('オレンジの かち！'),
  win1: t('あおの かち！'),
  great: t('すごい！ さいこう きろく！'),
  nice: t('ナイスショット！'),
  youWin: t('やったね！ あなたの かち！'),
  pikuruWin: t('ピクルくんの かち！ また あそぼう'),
  missions: t('きょうの ミッション'),
  missionClear: t('ミッション クリア！'),
  missionSolo: t('ひとりの ときは、ピクルくんと ラリーでも クリア できるよ'),
  newItem: t('あたらしい ごほうびを もらったよ！'),
  welcome: t('はじめての プレゼント！ ほしを 3つ あげるね'),
  partyIntro: t('じゅんばんモード！ じゅんばんに あそんで、きろくで しょうぶだよ'),
  partyRound: t('ラウンドの けっかだよ'),
  partyEnd: t('みんな よく がんばったね！'),
  traded: t('こうかん したよ！'),
  srFinal: t('ファイナル ラウンド！ とくてん 2ばい！'),
  srLast: t('さいごの チャンス！ かえる？ そのまま？'),
  srRead: t('よんだ！ リターン！'),
  srAce: t('サービスエース！'),
  rest: t('たくさん あそんだね！ ちょっと きゅうけい しよう'),
  niseIntro: t('ひとりだけ おだいが ちがう、にせピクルくんが いるよ。はなして、せーので ゆびさし！ にせピクルくんは、じぶんが にせものだと しらないよ'),
  niseReady: t('みんな おだいを みたね！ つくえの まんなかに おいてね'),
  niseTalk: t('はなしあい スタート！ おだいの ことばは いわないでね'),
  niseTie: t('おなじ かず！ もう すこし はなして、もういちど ゆびさし'),
  nisePoint: t('じかん！ にせピクルくんだと おもう ひとを、せーので ゆびさそう'),
  niseSeno: t('せーの！'),
  niseVote: t('じかん！ こっそり とうひょう するよ。1だいを じゅんばんに まわしてね'),
  niseCaught: t('にせピクルくん だった！'),
  niseMissed: t('ほんものの ピクルくん だった！'),
  niseChance: t('ぎゃくてん チャンス！ みんなの おだいを、こえに だして いってみよう'),
  niseMinnaWin: t('みんなの かち！'),
  niseWin: t('にせピクルくんの かち！'),
  niseReverse: t('ぎゃくてん！ にせピクルくんの かち！'),
  gestIntro: t('やる ひとだけ がめんを みて、こえを ださずに からだで まねしよう。パドルは もたずに、てで やってね'),
  gestStart: t('スタート！'),
  gestEnd: t('そこまで！'),
  gestFinal: t('みんなで たくさん つたえられたね！'),
  sagasuWally: t('ほんものの ピクルくんを さがそう！ ライムの はちまきと、あたまの つるが めじるしだよ'),
  sagasuKitchen: t('みつけた！ ピクルくんは キッチンに いたよ'),
  sagasuService: t('みつけた！ ピクルくんは サービスコートに いたよ'),
  sagasuOutside: t('みつけた！ ピクルくんは コートの そとに いたよ'),
  sagasuDiff: t('うえと したの え、ちがう ところを さがそう'),
  sagasuFound: t('みつけた！'),
  sagasuAll: t('ぜんぶ みつけた！'),
  sagasuHint: t('ヒント！ この あたりを よく みてね'),
  sagasuDuel: t('さきに ほんものを みつけた ほうが かち！'),
  ishinIntro: t('おなじ しつもんに、ペアの ふたりが こっそり こたえるよ。おなじ こたえなら いしんでんしん！ せいかいは ないよ'),
  ishinMatch: t('いしんでんしん！'),
  ishinMiss: t('おしい！ どうして それに したか、はなしてみよう'),
  ishinEnd: t('けっか はっぴょう！'),
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
  // いしんでんしん：しつもんは みんなに聞こえてよいので読み上げる（答えは読まない）
  for (const q of I_QUESTIONS) lines.add(q.prompt)
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
