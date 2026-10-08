/**
 * どのゲームが何回遊ばれたかを、匿名で数える（ソフトテニスIQと同じしくみ：Google Apps Script の受け口に送り、
 * スプレッドシート「pickleball_iq_数値集計」に1行ずつ書く。受け口の正本は別リポジトリ pbiq-metrics）。
 *
 * 送るもの：できごとの種類（開いた・始めた・最後まで遊んだ・共有した）、ゲームの名前（例 jump）、
 *          どこから来たか（リンクの ?src= の印。例 pb_ig_bio）、ホーム画面に追加して開いたか、アプリの版。
 * 送らないもの：名前・点数・写真・端末ID・Cookie・位置・前に見ていたページ（referrer）。
 * 送らないとき：集計先が未設定（site.config.json の counterUrl が空）／開発中／公開URL以外（試遊用の Artifact など）
 *              ／おうちの方へ で「送らない」にしたとき／ブラウザの「追跡しない」（DNT・GPC）がオンのとき。
 * 電波がないときは送らずに捨てる（あとでまとめて送ったりしない）。
 */
import site from '../../site.config.json'
import { getSettings } from './settings'

export const COUNTER_URL: string = site.counterUrl
export const PUBLIC_URL: string = site.publicUrl
/** アプリの版（集計で、直した前後を見分ける） */
export const APP_VERSION = '0.15.1'

export type CountEvent = 'open' | 'start' | 'finish' | 'share'

/** 公開URL（GitHub Pages）で開いているか */
export function onPublicSite(): boolean {
  try {
    return location.hostname === new URL(PUBLIC_URL).hostname
  } catch {
    return false
  }
}

/** いま送れる状態か（おうちの方へ に出す説明にも使う） */
export function counterStatus(): 'off-config' | 'off-site' | 'off-user' | 'off-dnt' | 'on' {
  if (!COUNTER_URL) return 'off-config'
  if (import.meta.env.DEV || !onPublicSite()) return 'off-site'
  if (!getSettings().counter) return 'off-user'
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl === true) return 'off-dnt'
  return 'on'
}

/** リンクの印（?src=）。英数字・ハイフン・下線だけ（40文字まで）。それ以外は使わない（集計シートへの数式の混入などを防ぐ） */
export function cleanSrc(v: string | null | undefined): string {
  return v && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : ''
}

const SRC_KEY = 'pickle-asobi:src'
let src = ''

/**
 * はじめに1回：URL の ?src= を読んで覚え、アドレスからは消す（そのURLを人に送っても印が広がらないように）。
 * 同じタブで開き直したときは、覚えた印を使う。
 */
export function readSource(): string {
  try {
    const u = new URL(location.href)
    const fromUrl = cleanSrc(u.searchParams.get('src'))
    if (u.searchParams.has('src')) {
      u.searchParams.delete('src')
      history.replaceState(history.state, '', u.pathname + u.search + u.hash)
    }
    if (fromUrl) sessionStorage.setItem(SRC_KEY, fromUrl)
    src = fromUrl || cleanSrc(sessionStorage.getItem(SRC_KEY))
  } catch {
    src = ''
  }
  return src
}

/** ホーム画面に追加して（アプリとして）開いているか */
function standalone(): boolean {
  try {
    return matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

/**
 * 最後まで遊んだときに いっしょに送る数（難しさの調整に使う。どれも匿名の数だけ）
 * - lv：レベル（ひとり＝chibi など、ふたり＝下の人-上の人）
 * - sec：遊んだ秒数（止めていた時間は数えない）
 * - val：ひとり＝記録（点・回数・m・ミリ秒）、ふたり＝レベルの低い方が勝ったら1・高い方なら0（同じレベル・引き分けは無し）
 */
export interface FinishInfo {
  lv?: string
  sec?: number
  val?: number
}

const LV = '(chibi|kids|otona|senshu)'
const LV_RE = new RegExp(`^${LV}(-${LV})?$`)

/** 送ってよい形にそろえる（形がちがうものは送らない） */
export function cleanFinish(info: FinishInfo = {}): Record<string, string> {
  const out: Record<string, string> = {}
  if (info.lv && LV_RE.test(info.lv)) out.lv = info.lv
  if (typeof info.sec === 'number' && Number.isFinite(info.sec) && info.sec >= 0) out.sec = String(Math.min(36000, Math.round(info.sec)))
  if (typeof info.val === 'number' && Number.isFinite(info.val) && Math.abs(info.val) < 1e7) out.val = String(Math.round(info.val * 100) / 100)
  return out
}

/** 送り先の URL（送らないときは null） */
export function countUrl(ev: CountEvent, game = '', extra: Record<string, string> = {}): string | null {
  if (counterStatus() !== 'on') return null
  const q = new URLSearchParams({ app: 'pickle-asobi', ev, v: APP_VERSION })
  if (game) q.set('game', game)
  if (src) q.set('src', src)
  if (ev === 'open') q.set('pwa', standalone() ? '1' : '0')
  for (const [k, v] of Object.entries(extra)) q.set(k, v)
  return `${COUNTER_URL}?${q}`
}

function send(ev: CountEvent, game = '', extra: Record<string, string> = {}): void {
  const url = countUrl(ev, game, extra)
  if (!url) return
  try {
    // sendBeacon は本文なしの POST。受け口（GAS の doPost）は URL の引数だけを読む
    if (navigator.sendBeacon?.(url)) return
    void fetch(url, { mode: 'no-cors', credentials: 'omit', cache: 'no-store', keepalive: true, referrerPolicy: 'no-referrer' }).catch(() => {})
  } catch {
    // 送れなくても遊びは続ける
  }
}

let opened = false

/** アプリを開いた（1回だけ） */
export function countOpen(): void {
  if (opened) return
  opened = true
  send('open')
}

/** ゲームを始めた（例 jump・party） */
export function countGame(id: string): void {
  send('start', id)
}

/** ゲームを最後まで遊んだ（結果の画面が出た）。レベル・秒数・記録も（FinishInfo） */
export function countFinish(id: string, info?: FinishInfo): void {
  send('finish', id, cleanFinish(info))
}

/** ふたりのゲーム：レベルの低い方が勝ったら1、高い方なら0（同じレベル・引き分けは undefined） */
export function lowerWon(levels: readonly string[], winner: 0 | 1 | null | undefined): number | undefined {
  const order = ['chibi', 'kids', 'otona', 'senshu']
  const a = order.indexOf(levels[0])
  const b = order.indexOf(levels[1])
  if (a < 0 || b < 0 || a === b || winner === null || winner === undefined) return undefined
  const lower = a < b ? 0 : 1
  return winner === lower ? 1 : 0
}

/** きねんカードを共有した・保存した */
export function countShare(id: string): void {
  send('share', id)
}
