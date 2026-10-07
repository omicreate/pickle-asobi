/**
 * どのゲームが何回遊ばれたかを、匿名で数える（GoatCounter など、Cookie を使わない集計サービス）。
 *
 * 送るもの：「どのゲームを始めたか」（例 /game/jump）と、アプリを開いたこと（/）だけ。
 * 送らないもの：名前・点数・端末ID・Cookie・前に見ていたページ（referrer）。
 * 送らないとき：集計先が未設定（site.config.json の counterOrigin が空）／開発中／公開URL以外（試遊用の Artifact など）
 *              ／おうちの方へ で「送らない」にしたとき／ブラウザの「追跡しない」（DNT・GPC）がオンのとき。
 * 電波がないときは送らずに捨てる（あとでまとめて送ったりしない）。
 */
import site from '../../site.config.json'
import { getSettings } from './settings'

export const COUNTER_ORIGIN: string = site.counterOrigin
export const PUBLIC_URL: string = site.publicUrl

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
  if (!COUNTER_ORIGIN) return 'off-config'
  if (import.meta.env.DEV || !onPublicSite()) return 'off-site'
  if (!getSettings().counter) return 'off-user'
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  if (nav.doNotTrack === '1' || nav.globalPrivacyControl === true) return 'off-dnt'
  return 'on'
}

function send(path: string, event: boolean): void {
  if (counterStatus() !== 'on') return
  const q = new URLSearchParams({ p: path, rnd: Math.random().toString(36).slice(2) })
  if (event) q.set('e', 'true')
  try {
    void fetch(`${COUNTER_ORIGIN}/count?${q}`, { mode: 'no-cors', credentials: 'omit', cache: 'no-store', keepalive: true, referrerPolicy: 'no-referrer' }).catch(() => {})
  } catch {
    // 送れなくても遊びは続ける
  }
}

let opened = false

/** アプリを開いた（1回だけ） */
export function countOpen(): void {
  if (opened) return
  opened = true
  send('/', false)
}

/** ゲームを始めた（例 game/jump・party） */
export function countGame(id: string): void {
  send(`game/${id}`, true)
}
