import type { Face } from '../ui/Pikuru'
import { t } from '../i18n'

export type GameId =
  | 'rally'
  | 'tug'
  | 'air'
  | 'dink'
  | 'hayatouch'
  | 'quiz'
  | 'breakout2'
  | 'jump'
  | 'lift'
  | 'catch'
  | 'breakout'
  | 'target'
  | 'pikuru'
  | 'linestop'
  | 'curling'
  | 'serveread'
  | 'reaction'
  | 'stop10'
  | 'nise'
  | 'gesture'
  | 'ishin'
  | 'sagasu'
  | 'sagasu2'

export interface GameInfo {
  id: GameId
  title: string
  /** たいせん／きょうりょく など */
  tag: string
  desc: string
  face: Face
  /** 読み上げる説明（文字が読めない子のため） */
  howto: string
  /** 何人で遊ぶか（1＝ひとりで、2＝1台を机に置いて上下で向かい合う、group＝みんなで1台を手わたし） */
  players: 1 | 2 | 'group'
  /** みんなで遊ぶゲームの人数（いちばん少ない・多い） */
  range?: [number, number]
  /** みんなで遊ぶゲームで、遊べる人数がとびとびのとき（例 2人か4人） */
  sizes?: number[]
  /** ふたりのゲームを「てわたし」（1人ずつ画面を見て、相手には見せない）でも遊べる */
  pass?: boolean
  /** じゅんばんモードで使う（ひとりで、同じ条件で記録を比べられるゲーム） */
  party?: boolean
  /** じゅんばんモードで比べる記録の単位（例 m・てん） */
  unit?: string
  /** 記録の良し悪し（low＝小さいほど良い：反応の時間・ずれ） */
  better?: 'high' | 'low'
  /** 記録の見せ方（無ければ 数＋単位） */
  fmt?: (v: number) => string
  /** ホームの「おとなも むちゅう」に出す（大人どうしでも楽しめる勝負） */
  adult?: boolean
  /** ホームのカードで折り返してよい所を | で示した名前（単語の途中で折り返さないように） */
  wrap?: string
}

/** 記録を文字にする（じゅんばんモードの結果など） */
export function formatValue(g: GameInfo | undefined, v: number): string {
  if (!g) return String(v)
  return g.fmt ? g.fmt(v) : `${v}${g.unit ?? ''}`
}

export const GAMES: GameInfo[] = [
  {
    id: 'rally',
    title: t('ラリーたいけつ'),
    tag: t('たいせん'),
    desc: t('ゆびで パドルを うごかして うちあおう'),
    face: 'ok',
    howto: t('ゆびで パドルを うごかして、ボールを うちかえそう。うえに シュッと ふると、つよく とぶよ。'),
    players: 2,
  },
  {
    id: 'tug',
    title: t('れんだ つなひき'),
    tag: t('たいせん'),
    desc: t('いっぱい タッチして ボールを おしこもう'),
    face: 'eh',
    howto: t('じぶんの がめんを いっぱい タッチ！ まんなかの ボールを、あいての ほうへ おしこもう。さきに 2かい かったら かち。'),
    players: 2,
  },
  {
    id: 'air',
    title: t('エアピックル'),
    tag: t('たいせん'),
    desc: t('パドルで うって ゴールを ねらおう'),
    face: 'ok',
    howto: t('ゆびで パドルを うごかして、ボールを うとう。あいての ゴールに いれたら 1てん。さきに 5てん とったら かち。'),
    players: 2,
  },
  {
    id: 'dink',
    title: t('ディンクで つなごう'),
    tag: t('きょうりょく'),
    desc: t('ふたりで なんかい つづくかな'),
    face: 'think',
    howto: t('ふたりで きょうりょく。ネットの まえの キッチンに、そっと ボールを おとして、なんかい つづくか ちょうせんしよう。'),
    players: 2,
  },
  {
    id: 'hayatouch',
    title: t('はやタッチ'),
    tag: t('はやおし'),
    desc: t('ひかったら タッチ！ インかな アウトかな'),
    face: 'eh',
    howto: t('ボールが みどりに ひかったら、すぐに タッチ。オレンジの ときは さわらないでね。'),
    players: 2,
  },
  {
    id: 'quiz',
    title: t('ピクルくんクイズ'),
    wrap: t('ピクルくん|クイズ'),
    tag: t('クイズ'),
    desc: t('さきに あてた ほうが かち'),
    face: 'think',
    howto: t('ピクルくんの クイズだよ。こたえが わかったら、てもとの ボタンを はやく おそう。'),
    players: 2,
  },
  {
    id: 'sagasu2',
    title: t('ピクルくん さがし たいせん'),
    wrap: t('ピクルくん さがし|たいせん'),
    tag: t('たいせん'),
    desc: t('さきに ほんものを みつけた ほうが かち'),
    face: 'eh',
    howto: t('うえと したに、にせものの ピクルくんが いっぱい。さきに ほんものを みつけて タッチした ほうが 1てん。さきに 3てん とったら かち。'),
    players: 2,
  },
  {
    id: 'breakout2',
    title: t('ピクルくずし たいせん'),
    tag: t('たいせん'),
    desc: t('まんなかの ブロックを さきに くずそう'),
    face: 'eh',
    howto: t('うえと したで、まんなかの ブロックを くずしあうよ。じぶんの いろの ボールで くずすと てんに なる。'),
    players: 2,
  },
  {
    id: 'jump',
    title: t('ピクルくん ジャンプ'),
    tag: t('ひとりで'),
    desc: t('とんでくる ボールを 3だんジャンプで よけよう'),
    face: 'eh',
    howto: t('タップで ジャンプ。くうちゅうで もういちど タップすると、3だんまで とべるよ。とんでくる ボールや ネットを よけよう。'),
    players: 1,
    party: true,
    unit: 'm',
  },
  {
    id: 'lift',
    title: t('ポンポン リフティング'),
    tag: t('ひとりで'),
    desc: t('ボールを おとさずに なんかい つづくかな'),
    face: 'think',
    howto: t('ボールの かげの ところに パドルを うごかそう。おちてきた ボールが パドルに あたると、ポンと はねるよ。なんかい つづくかな。'),
    players: 1,
    party: true,
    unit: t('かい'),
  },
  {
    id: 'catch',
    title: t('ボールキャッチ'),
    wrap: t('ボール|キャッチ'),
    tag: t('ひとりで'),
    desc: t('あなの あいた ボールだけ とろう'),
    face: 'eh',
    howto: t('かごを うごかして、そらから おちてくる ピックルボールを とろう。あなが あいているのが ピックルボール。ほかの ボールは とらないでね。'),
    players: 1,
    party: true,
    unit: t('てん'),
  },
  {
    id: 'breakout',
    title: t('ピクルくずし'),
    tag: t('ひとりで'),
    desc: t('パドルで うちかえして ブロックを くずそう'),
    face: 'ok',
    howto: t('ゆびで パドルを うごかして、ボールを うちかえそう。ブロックを ぜんぶ くずしたら クリア。みどりの ピクルスは 2かい あてよう。'),
    players: 1,
    party: true,
    unit: t('てん'),
  },
  {
    id: 'target',
    title: t('ねらってショット'),
    wrap: t('ねらって|ショット'),
    tag: t('ひとりで'),
    desc: t('ピクルマシンの ボールを まとに うちかえそう'),
    face: 'think',
    howto: t('ピクルマシンから ボールが くるよ。ひかっている まとを ねらって うちかえそう。10きゅうで いくつ はいるかな。'),
    players: 1,
    party: true,
    unit: t('きゅう'),
  },
  {
    id: 'pikuru',
    title: t('ピクルくんと ラリー'),
    tag: t('ひとりで'),
    desc: t('ピクルくんと しょうぶ！'),
    face: 'ok',
    howto: t('ピクルくんと しょうぶだよ。ゆびで パドルを うごかして、ボールを うちかえそう。'),
    players: 1,
  },
  {
    id: 'sagasu',
    title: t('ピクルくん さがし'),
    wrap: t('ピクルくん|さがし'),
    tag: t('ひとりで'),
    desc: t('ほんものの ピクルくんや、まちがいを さがそう'),
    face: 'think',
    howto: t('にせものの ピクルくんが いっぱい！ ライムの はちまきと、あたまの つるが ある ほんものを さがして タッチしよう。まちがいさがしも あるよ。'),
    players: 1,
    party: true,
    better: 'low',
    unit: t('びょう'),
    fmt: (v) => t('{0}びょう', [(v / 1000).toFixed(1)]),
  },
  {
    id: 'linestop',
    title: t('ラインぎわ ストップ'),
    tag: t('たいせん'),
    desc: t('ぎりぎりで とめた ほうが かち'),
    face: 'eh',
    howto: t('ボールが じぶんの ほうへ ころがってくるよ。タップで とめよう。ラインに ちかいほど かち。こえたら アウト。'),
    players: 2,
    adult: true,
  },
  {
    id: 'curling',
    title: t('キッチン カーリング'),
    tag: t('たいせん'),
    desc: t('まとの まんなかに ちかづけよう'),
    face: 'think',
    howto: t('ゆびを うしろに ひいて はなすと、ボールを なげるよ。まとの まんなかに ちかい ほうが てんを とる。あいての ボールを はじいても いいよ。'),
    players: 2,
    adult: true,
  },
  {
    id: 'serveread',
    title: t('よみあい サーブ'),
    tag: t('しんりせん'),
    desc: t('こっそり えらんで、よみあい かけひき'),
    face: 'think',
    howto: t('じゅんばんに こっそり えらぼう。サーブは ねらう ところ、レシーブは まつ ところ。あいてが えらぶ あいだは めを とじて、はなしかけて ゆさぶろう。おなじなら レシーブの てん、ちがえば サーブの てん。'),
    players: 2,
    pass: true,
    adult: true,
  },
  {
    id: 'reaction',
    title: t('リアクション ボレー'),
    tag: t('ハイスコア'),
    desc: t('きたら すぐ タップ！ はんのうを はかろう'),
    face: 'eh',
    howto: t('ピクルマシンから ボールが きたら、すぐに タップ。オレンジの ボールは さわらないでね。5かいの へいきんで くらべるよ。'),
    players: 1,
    party: true,
    adult: true,
    better: 'low',
    unit: t('びょう'),
    fmt: (v) => t('{0}びょう', [(v / 1000).toFixed(3)]),
  },
  {
    id: 'stop10',
    title: t('ピタッと 10びょう'),
    tag: t('ハイスコア'),
    desc: t('10びょう ちょうどで キャッチ'),
    face: 'think',
    howto: t('タップで ロブを うちあげるよ。とけいが きえても、10びょう ちょうどだと おもったら タップ。3かいの うち いちばん ちかい きろくで くらべるよ。'),
    players: 1,
    party: true,
    adult: true,
    better: 'low',
    unit: t('びょう'),
    fmt: (v) => t('ずれ {0}びょう', [(v / 1000).toFixed(2)]),
  },
  {
    id: 'nise',
    title: t('にせピクルくんは だれだ？'),
    wrap: t('にせピクルくんは|だれだ？'),
    tag: t('じんろう'),
    desc: t('ひとりだけ おだいが ちがう。はなして みつけよう'),
    face: 'think',
    howto: t('ひとりずつ こっそり おだいを みるよ。ひとりだけ ちがう おだいの、にせピクルくんが いる。おだいの ことを はなして、さいごに せーので ゆびさし！'),
    players: 'group',
    range: [3, 6],
  },
  {
    id: 'gesture',
    title: t('ジェスチャー ピックル'),
    wrap: t('ジェスチャー|ピックル'),
    tag: t('ジェスチャー'),
    desc: t('こえを ださずに、からだで つたえよう'),
    face: 'ok',
    howto: t('やる ひとだけ がめんを みて、こえを ださずに からだで まねしよう。みんなは なにか あててね。あたったら、やる ひとが あたりを おすよ。'),
    players: 'group',
    range: [2, 6],
  },
  {
    id: 'ishin',
    title: t('いしんでんしん ダブルス'),
    wrap: t('いしんでんしん|ダブルス'),
    tag: t('きょうりょく'),
    desc: t('パートナーと おなじ こたえを えらべるかな'),
    face: 'ok',
    howto: t('おなじ しつもんに、ペアの ふたりが こっそり こたえるよ。おなじ こたえなら いしんでんしん！ せいかいは ないよ。'),
    players: 'group',
    range: [2, 4],
    sizes: [2, 4],
  },
]

export const gameById = (id: string | undefined) => GAMES.find((g) => g.id === id)
