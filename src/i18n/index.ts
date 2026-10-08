/**
 * ことば（日本語・英語）。画面の文は日本語の文そのものを鍵にして、英語の表（en/）から引く。表に無い文は日本語のまま出す。
 * - 決め方：?lang=en / ?lang=ja（アドレスから消して覚える）→ 覚えている設定 → 端末のことば（日本語でなければ英語）
 * - 切りかえたら、ページを読みなおす（どの画面も最初から そのことばで作る）
 * - 文の中の数などは {n} のように書き、t('…{n}…', { n }) で入れる
 */
import { EN } from './en'

export type Lang = 'ja' | 'en'
const KEY = 'pickle-asobi:lang'

function detect(): Lang {
  try {
    const u = new URL(location.href)
    const q = u.searchParams.get('lang')
    if (q === 'en' || q === 'ja') {
      localStorage.setItem(KEY, q)
      u.searchParams.delete('lang')
      history.replaceState(history.state, '', u.pathname + u.search + u.hash)
      return q
    }
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'ja') return saved
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
    return langs.some((l) => /^ja\b/i.test(l ?? '')) ? 'ja' : 'en'
  } catch {
    return 'ja'
  }
}

/** ブラウザの外（テスト・声づくりのスクリプト）は日本語。scripts/build-voice.mjs --lang en は globalThis.__PICKLE_LANG__ で英語にする */
const outside = (): Lang => ((globalThis as { __PICKLE_LANG__?: Lang }).__PICKLE_LANG__ === 'en' ? 'en' : 'ja')

export const LANG: Lang = typeof window === 'undefined' ? outside() : detect()
export const isEn = LANG === 'en'

if (typeof document !== 'undefined') {
  document.documentElement.lang = LANG
  if (isEn) document.title = 'Play with Pikuru | Pickleball mini-games for families and friends'
}

/** ことばを切りかえて、読みなおす */
export function setLang(l: Lang): void {
  try {
    localStorage.setItem(KEY, l)
  } catch {
    // 覚えられなくても、この回は切りかえる
  }
  const u = new URL(location.href)
  u.searchParams.set('lang', l)
  location.replace(u.pathname + u.search + u.hash)
}

/** 日本語の文 → いまのことばの文。vars で {0}・{1}（配列）や {名前} を入れかえる */
export function t(ja: string, vars?: readonly (string | number)[] | Record<string, string | number>): string {
  let s = LANG === 'en' ? (EN[ja] ?? ja) : ja
  if (vars) {
    const v = vars as Record<string, string | number>
    s = s.replace(/\{(\w+)\}/g, (m, k: string) => (k in v ? String(v[k]) : m))
  }
  return s
}

/** 英語の表に その文があるか（テスト用） */
export const hasEn = (ja: string) => ja in EN
