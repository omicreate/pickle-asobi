import { t } from '../../i18n'
/**
 * ジェスチャー ピックル（2〜6人。1台を手わたし）。React に依存しない純粋な計算とお題。
 * やる人だけが画面を見て、声を出さずに体でお題を表す。ほかの人が当てたら「あたり」、むずかしければ「パス」。
 * 1人ずつ順番に、決めた時間だけやる。みんなで当てた数を合わせて、じこベストをめざす（協力）。
 * ルールにかかわるお題は、終わったあとに「まめちしき」を出す。説明は知識カード（PBK）に書いてあることだけ。
 */

export type GDeck = 'kids' | 'pickle'

export interface GCard {
  id: string
  /** 当ててもらう ことば */
  say: string
  /** やる人へのヒント（どう まねするか） */
  act: string
  deck: GDeck
  /** まめちしき（根拠の PBK 番号つき） */
  tip?: string
}

export const G_DECK_INFO: Record<GDeck, { label: string; hint: string }> = {
  kids: { label: t('やさしい'), hint: t('サーブ・スマッシュ など') },
  pickle: { label: t('ピックル つう'), hint: t('ルールの うごきも でる') },
}
export const G_DECKS: GDeck[] = ['kids', 'pickle']

/** 1人がやる時間（秒） */
export const ACT_TIMES = [60, 90]
/** はじまる前の 3・2・1（秒） */
export const COUNTDOWN = 3

export const CARDS: GCard[] = [
  { id: 'serve', say: t('サーブ'), act: t('したから ボールを うつ まね'), deck: 'kids' },
  { id: 'dink', say: t('ディンク'), act: t('ネットの まえで、そっと ポン'), deck: 'kids', tip: t('キッチンラインから、相手のキッチンにそっと落とす球。クロスに打つのが基本（PBK-0050）。') },
  { id: 'smash', say: t('スマッシュ'), act: t('うえから おもいきり うちおろす'), deck: 'kids' },
  { id: 'lob', say: t('ロブ'), act: t('たかーく うちあげて、そらを みあげる'), deck: 'kids' },
  { id: 'hightouch', say: t('ハイタッチ'), act: t('パートナーと「ナイス！」の まね'), deck: 'kids' },
  { id: 'chase', say: t('ボールを おいかける'), act: t('その ばで はしって、てを のばす'), deck: 'kids' },
  { id: 'pikuru', say: t('ピクルくん'), act: t('きゅうりの ピクルくんの まね'), deck: 'kids' },
  { id: 'whiff', say: t('からぶり'), act: t('おもいきり ふったのに あたらない'), deck: 'kids', tip: t('空振りしても、ボールは生きている。ラリーは続く（PBK-0042）。') },
  { id: 'netball', say: t('ネットに ひっかかった'), act: t('ボールが ネットに ばさっ。がっかり'), deck: 'kids' },
  { id: 'win', say: t('かちポーズ'), act: t('やったー！ りょうてを あげる'), deck: 'kids' },
  { id: 'sun', say: t('まぶしい'), act: t('たいようで ボールが みえない'), deck: 'kids' },
  { id: 'lift', say: t('リフティング'), act: t('パドルで ボールを ポンポン'), deck: 'kids' },
  { id: 'paddletap', say: t('パドルタップ'), act: t('しあいの あと、パドルを あわせて あいさつ'), deck: 'kids' },
  { id: 'kitchen-volley', say: t('キッチンで ボレー'), act: t('キッチンに ふみこんで、はずむ まえに うつ。あっ！'), deck: 'pickle', tip: t('キッチンの中でボレーするとフォルト。弾んだ球なら、キッチンの中で打ってよい（PBK-0014・0015）。') },
  { id: 'not-ready', say: t('まだ じゅんびが できてない'), act: t('パドルを あたまの うえに あげる'), deck: 'pickle', tip: t('スコアのコールが始まる前なら、パドルか手を頭の上に上げると「まだ準備できていない」の合図（PBK-0031）。') },
  { id: 'drop-serve', say: t('ドロップサーブ'), act: t('ボールを おとして、はずませてから うつ'), deck: 'pickle', tip: t('落として弾ませてから打つ。振り方の制限はない（PBK-0009）。') },
  { id: 'volley-serve', say: t('ボレーサーブ'), act: t('てから はなして、したから うえへ ふる'), deck: 'pickle', tip: t('手から離して直接打つ。パドルが上向きの弧で動き、ボールが腰より高くない所で打つ（PBK-0008）。') },
  { id: 'return-run', say: t('リターン ダッシュ'), act: t('かえしたら、まえへ ダッシュ'), deck: 'pickle', tip: t('リターンしたら、すぐキッチンラインへ出ると有利（PBK-0019）。') },
  { id: 'body-hit', say: t('からだに あたった'), act: t('ボールが からだに あたって「いたっ」'), deck: 'pickle', tip: t('ボールが体に当たったら、当たった人のフォルト。パドルと、それを握る手の手首より下は打球として扱う（PBK-0025）。') },
  { id: 'net-touch', say: t('ネットに さわった'), act: t('うった あと、ネットに てが ふれる'), deck: 'pickle', tip: t('ボールが生きている間に、体や身につけた物がネットに触れたらフォルト（PBK-0027）。') },
  { id: 'atp', say: t('ポストの そとを まわす'), act: t('ネットの よこから、まわりこむ ショット'), deck: 'pickle', tip: t('返球は、ネットポストの外側を回して入れてもよい（PBK-0026）。') },
  { id: 'move-together', say: t('パートナーと いっしょに うごく'), act: t('ふたりで よこに スライド'), deck: 'pickle', tip: t('2人は1.8〜2.4mほどの間隔を保ち、片方が動けばもう片方も同じ方向へ動く（PBK-0053）。') },
  { id: 'score-call', say: t('スコアコール'), act: t('ゆびで 3つの かずを みせてから サーブ'), deck: 'pickle', tip: t('ダブルスのスコアは3つの数字。各ゲームは「0-0-2」で始まる（PBK-0006）。言い終えてから10秒以内に打つ（PBK-0032）。') },
  { id: 'third-drop', say: t('3きゅうめ ドロップ'), act: t('うしろから そっと、あいての キッチンへ'), deck: 'pickle', tip: t('低く深いリターンには、3球目をドロップにして時間を作り、前へ出る（PBK-0048）。') },
  { id: 'drive', say: t('ドライブ'), act: t('つよく まっすぐ うつ'), deck: 'pickle' },
  { id: 'line-call', say: t('ラインジャッジ'), act: t('ボールを じっと みて、ゆびで イン！'), deck: 'pickle', tip: t('自分の側のラインは自分たちで判定する。迷ったらイン（PBK-0041）。') },
  { id: 'middle', say: t('まんなかを ねらう'), act: t('ふたりの あいだを ねらって うつ'), deck: 'pickle', tip: t('迷ったら真ん中。相手2人に「どっちが取る？」を迫れる（PBK-0052）。') },
]

/** その山で出るお題（ピックル つうは、やさしいお題もまぜる） */
export const cardsFor = (deck: GDeck): GCard[] => (deck === 'kids' ? CARDS.filter((c) => c.deck === 'kids') : CARDS)

/** まだ出していないお題から1つ。出し切ったら最初から */
export function drawCard(deck: GDeck, used: Set<string>, rand: () => number = Math.random): GCard {
  const pool = cardsFor(deck)
  let fresh = pool.filter((c) => !used.has(c.id))
  if (fresh.length === 0) {
    for (const c of pool) used.delete(c.id)
    fresh = pool
  }
  const c = fresh[Math.floor(rand() * fresh.length)]
  used.add(c.id)
  return c
}

export interface TurnLog {
  card: GCard
  got: boolean
}

export const turnScore = (log: TurnLog[]): number => log.filter((x) => x.got).length

/** みんなの合計（協力） */
export const teamTotal = (logs: TurnLog[][]): number => logs.reduce((n, l) => n + turnScore(l), 0)

/** いちばん多く伝えた人（同じ数なら全員）。だれも当たっていなければ空 */
export function bestActors(logs: TurnLog[][]): number[] {
  const scores = logs.map(turnScore)
  const top = Math.max(0, ...scores)
  return top === 0 ? [] : scores.flatMap((s, i) => (s === top ? [i] : []))
}
