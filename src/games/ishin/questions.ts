/**
 * いしんでんしん ダブルスの しつもん。答えに正解はなく、パートナーと同じものを選べたら「いしんでんしん」。
 * - e：絵で選ぶ（字が読めない子も遊べる。しつもんは読み上げる）
 * - nakayoshi：ふだんのこと・ピックルボールの楽しみ方
 * - doubles：ダブルスの作戦。答えあわせで「まめちしき」を出す。説明は知識カード（PBK）に書いてあることだけ
 *   （真ん中の球をだれが取るか、は出典が1件だけのカード（PBK-0056・C）なので、まめちしきは出さない）
 */
import type { PicId } from '../quiz/pics'
import type { NisePicId } from '../nise/pics'
import { t as tr } from '../../i18n'

export type IDeck = 'e' | 'nakayoshi' | 'doubles'

export interface IChoice {
  text: string
  /** にせピクルくんの絵 */
  pic?: NisePicId
  /** クイズの絵 */
  qpic?: PicId
  /** 色（すきな いろ など） */
  swatch?: string
}

export interface IQuestion {
  id: string
  deck: IDeck
  prompt: string
  choices: IChoice[]
  /** まめちしき（根拠の PBK 番号つき） */
  tip?: string
}

export const I_DECK_INFO: Record<IDeck, { label: string; hint: string }> = {
  e: { label: tr('え'), hint: tr('じが よめなくても OK') },
  nakayoshi: { label: tr('なかよし'), hint: tr('すきな もの・ふだんの こと') },
  doubles: { label: tr('ダブルス さくせん'), hint: tr('まめちしき つき') },
}
export const I_DECKS: IDeck[] = ['e', 'nakayoshi', 'doubles']

const t = (text: string): IChoice => ({ text })
const p = (text: string, pic: NisePicId): IChoice => ({ text, pic })
const q = (text: string, qpic: PicId): IChoice => ({ text, qpic })
const c = (text: string, swatch: string): IChoice => ({ text, swatch })

export const I_QUESTIONS: IQuestion[] = [
  // ---------- え ----------
  { id: 'e-fruit', deck: 'e', prompt: tr('いま たべたい くだものは？'), choices: [p(tr('りんご'), 'apple'), p(tr('バナナ'), 'banana'), p(tr('いちご'), 'strawberry'), p(tr('すいか'), 'watermelon')] },
  { id: 'e-pikuru', deck: 'e', prompt: tr('ピクルくんが すきそうな たべものは？'), choices: [p(tr('きゅうり'), 'cucumber'), p(tr('トマト'), 'tomato'), p(tr('メロン'), 'melon'), p(tr('さくらんぼ'), 'cherry')] },
  { id: 'e-ball', deck: 'e', prompt: tr('すきな ボールは？'), choices: [p(tr('ピックルボール'), 'pb-ball'), p(tr('テニスボール'), 'tennis-ball'), q(tr('サッカーボール'), 'soccer-ball')] },
  { id: 'e-pet', deck: 'e', prompt: tr('いっしょに あそぶ なら？'), choices: [p(tr('いぬ'), 'dog'), p(tr('ねこ'), 'cat')] },
  { id: 'e-sky', deck: 'e', prompt: tr('ひると よる、どっちが すき？'), choices: [p(tr('ひる'), 'sun'), p(tr('よる'), 'moon')] },
  { id: 'e-color', deck: 'e', prompt: tr('すきな いろは？'), choices: [c(tr('オレンジ'), '#ff8a3d'), c(tr('あお'), '#3d9be9'), c(tr('みどり'), '#4caf50'), c(tr('ピンク'), '#ff6fae')] },
  { id: 'e-tool', deck: 'e', prompt: tr('つかって みたい どうぐは？'), choices: [p(tr('パドル'), 'paddle'), p(tr('ラケット'), 'racket'), q(tr('バット'), 'bat')] },
  { id: 'e-court', deck: 'e', prompt: tr('コートの どこで うちたい？'), choices: [q(tr('ネットの まえ'), 'zone-kitchen'), q(tr('まんなか'), 'zone-middle'), q(tr('うしろ'), 'zone-back')] },
  { id: 'e-red', deck: 'e', prompt: tr('あかい もので すきなのは？'), choices: [p(tr('りんご'), 'apple'), p(tr('トマト'), 'tomato'), p(tr('いちご'), 'strawberry'), p(tr('さくらんぼ'), 'cherry')] },
  { id: 'e-summer', deck: 'e', prompt: tr('なつに たべたい ものは？'), choices: [p(tr('すいか'), 'watermelon'), p(tr('メロン'), 'melon'), p(tr('きゅうり'), 'cucumber'), p(tr('トマト'), 'tomato')] },

  // ---------- なかよし ----------
  { id: 'n-holiday', deck: 'nakayoshi', prompt: tr('やすみの ひに したいのは？'), choices: [t(tr('ピックルボール')), t(tr('おでかけ')), t(tr('ゲーム')), t(tr('ゆっくり ねる'))] },
  { id: 'n-breakfast', deck: 'nakayoshi', prompt: tr('あさごはんは？'), choices: [t(tr('ごはん')), t(tr('パン')), t(tr('シリアル')), t(tr('くだもの'))] },
  { id: 'n-shot', deck: 'nakayoshi', prompt: tr('すきな ショットは？'), choices: [t(tr('サーブ')), t(tr('ディンク')), t(tr('スマッシュ')), t(tr('ロブ'))] },
  { id: 'n-pose', deck: 'nakayoshi', prompt: tr('かったときの ポーズは？'), choices: [t(tr('ガッツポーズ')), t(tr('ハイタッチ')), t(tr('ジャンプ')), t(tr('ピース'))] },
  { id: 'n-before', deck: 'nakayoshi', prompt: tr('しあいの まえに することは？'), choices: [t(tr('ストレッチ')), t(tr('しんこきゅう')), t(tr('ジャンプ')), t(tr('みずを のむ'))] },
  { id: 'n-drink', deck: 'nakayoshi', prompt: tr('ピックルボールの あとに のみたいのは？'), choices: [t(tr('みず')), t(tr('おちゃ')), t(tr('スポーツドリンク')), t(tr('ジュース'))] },
  { id: 'n-season', deck: 'nakayoshi', prompt: tr('なつと ふゆ、どっちが すき？'), choices: [t(tr('なつ')), t(tr('ふゆ'))] },
  { id: 'n-trip', deck: 'nakayoshi', prompt: tr('いきたい ところは？'), choices: [t(tr('うみ')), t(tr('やま')), t(tr('ゆうえんち')), t(tr('どうぶつえん'))] },
  { id: 'n-pikuru', deck: 'nakayoshi', prompt: tr('ピクルくんの とくいわざは？'), choices: [t(tr('ディンク')), t(tr('スマッシュ')), t(tr('ダンス')), t(tr('おひるね'))] },
  { id: 'n-dinner', deck: 'nakayoshi', prompt: tr('ばんごはんに たべたいのは？'), choices: [t(tr('カレー')), t(tr('おすし')), t(tr('ハンバーグ')), t(tr('ラーメン'))] },
  { id: 'n-name', deck: 'nakayoshi', prompt: tr('ふたりの チームの なまえは？'), choices: [t(tr('チーム ピクルス')), t(tr('チーム パドル')), t(tr('チーム ディンク')), t(tr('チーム キッチン'))] },
  { id: 'n-donmai', deck: 'nakayoshi', prompt: tr('ミスした パートナーに かける ことばは？'), choices: [t(tr('ドンマイ！')), t(tr('つぎ いこう！')), t(tr('ナイストライ！')), t(tr('だいじょうぶ！'))] },
  { id: 'n-rain', deck: 'nakayoshi', prompt: tr('あめの ひに したいのは？'), choices: [t(tr('おうちで ゲーム')), t(tr('えいが')), t(tr('ほんを よむ')), t(tr('おひるね'))] },
  { id: 'n-color', deck: 'nakayoshi', prompt: tr('パドルの いろ なら？'), choices: [t(tr('オレンジ')), t(tr('あお')), t(tr('みどり')), t(tr('ピンク'))] },

  // ---------- ダブルス さくせん ----------
  { id: 'd-aim', deck: 'doubles', prompt: tr('まよったら、どこを ねらう？'), choices: [t(tr('ふたりの まんなか')), t(tr('サイドライン ぎりぎり')), t(tr('あいての あたまの うえ'))], tip: tr('迷ったら真ん中。角度を与えず、相手2人に「どっちが取る？」を迫れる（PBK-0052）。') },
  { id: 'd-return', deck: 'doubles', prompt: tr('リターンを うったら？'), choices: [t(tr('キッチンラインへ でる')), t(tr('ベースラインに のこる')), t(tr('まんなかで とまる'))], tip: tr('リターンしたら、すぐキッチンラインへ出ると有利（PBK-0019）。サーブ側は3球目を弾ませるために後ろに残るから。') },
  { id: 'd-serve', deck: 'doubles', prompt: tr('サーブを うったら？'), choices: [t(tr('ベースラインの ちかくで まつ')), t(tr('すぐ ネットへ でる')), t(tr('よこに うごく'))], tip: tr('サーブ側は、リターンを1回弾ませる必要があるので、ベースライン付近で待ち、3球目の後に前へ出る（PBK-0047）。') },
  { id: 'd-move', deck: 'doubles', prompt: tr('パートナーが よこに うごいたら？'), choices: [t(tr('おなじ ほうへ うごく')), t(tr('その ばに のこる')), t(tr('はんたいへ うごく'))], tip: tr('2人は1.8〜2.4mほどの間隔を保ち、片方が動けばもう片方も同じ方向へ動いて、すき間を作らない（PBK-0053）。') },
  { id: 'd-dink', deck: 'doubles', prompt: tr('ディンクは どこへ うつ？'), choices: [t(tr('クロス（ななめ）')), t(tr('ストレート（まっすぐ）')), t(tr('まんなか'))], tip: tr('ディンクはクロスが基本。ネットの低い所を通り、距離も長いので安全。ストレートや真ん中を混ぜるのも有効（PBK-0050）。') },
  { id: 'd-third', deck: 'doubles', prompt: tr('3きゅうめ。ひくくて ふかい リターンが きたら？'), choices: [t(tr('ドロップ')), t(tr('ドライブ')), t(tr('ロブ'))], tip: tr('低く深いリターンにはドロップで時間を作って前へ。浅く高く弾んだリターンはドライブで攻める（PBK-0048）。') },
  { id: 'd-pop', deck: 'doubles', prompt: tr('ディンクの うちあいで、うかんだ ボールが きたら？'), choices: [t(tr('せめる')), t(tr('ディンクで つなぐ')), t(tr('ロブで かえす'))], tip: tr('ディンクは低く我慢して続け、相手が攻撃できる高さに浮かせたら攻める（PBK-0051）。') },
  { id: 'd-servekey', deck: 'doubles', prompt: tr('サーブで だいじなのは？'), choices: [t(tr('ふかさと たしかさ')), t(tr('つよさ')), t(tr('スピン'))], tip: tr('サーブは強さより、確実に深く入れるのが基本。外したサーブは、相手の得点ではなくサーブ権を失う（PBK-0046・0018）。') },
  { id: 'd-transition', deck: 'doubles', prompt: tr('ベースラインと キッチンラインの あいだでは？'), choices: [t(tr('とまらず とおりぬける')), t(tr('とまって まつ')), t(tr('うしろへ さがる'))], tip: tr('ベースラインとキッチンラインの間は足元を狙われやすい。止まらず通り抜ける（PBK-0055）。') },
  { id: 'd-partner', deck: 'doubles', prompt: tr('レシーブの とき、パートナーは どこに たつ？'), choices: [t(tr('キッチンライン')), t(tr('ベースライン')), t(tr('ふたりの まんなか'))], tip: tr('レシーバーはベースラインの少し後ろ、パートナーは最初からキッチンラインに立つ（PBK-0054）。') },
  { id: 'd-middle', deck: 'doubles', prompt: tr('まんなかに きた ボールは だれが とる？'), choices: [t(tr('フォアハンドが まんなかの ひと')), t(tr('バックハンドが まんなかの ひと')), t(tr('さきに こえを かけた ひと'))] },
  { id: 'd-line', deck: 'doubles', prompt: tr('じぶんの がわの ラインぎわ。インか アウトか まよったら？'), choices: [t(tr('イン')), t(tr('アウト')), t(tr('やりなおし'))], tip: tr('自分の側のラインは自分たちで判定する。すぐにアウトと言えない球はイン（PBK-0041）。') },
]

export const questionsFor = (deck: IDeck): IQuestion[] => I_QUESTIONS.filter((x) => x.deck === deck)
