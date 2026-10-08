/**
 * ホーム画面に入れる方法（おうちの方へ）。#/install
 * インスタなどのアプリの中のブラウザで開いているときは、まず Safari・Chrome で開きなおす案内を出す。
 * iPhone と Android の手順を図つきで（開いている端末の方を先に）。Android の Chrome なら、ボタン1つで入れられる。
 */
import { useEffect, useState } from 'react'
import { canPromptInstall, externalOpenUrl, inAppName, isStandalone, onInstallPrompt, osOf, promptInstall, reopenUrl } from '../core/browser'
import type { Os } from '../core/browser'
import { sfx } from '../core/sound'
import { AddHomeArt, ChromeMenuArt, ChromeScreen, HomeScreenArt, InAppMenu, InAppScreen, InstallDialogArt, Phone, SafariScreen, ShareSheetArt } from '../ui/installArt'
import { PikuruCut } from '../ui/pikuruArt'
import './setup.css'
import './collection.css'
import './parents.css'
import './install.css'
import { t as tr } from '../i18n'
import { Rich } from '../i18n/Rich'

type Tab = 'ios' | 'android'

export function Install() {
  const app = inAppName()
  const os: Os = osOf()
  const [tab, setTab] = useState<Tab>(os === 'android' ? 'android' : 'ios')
  const [copied, setCopied] = useState(false)
  const [canPrompt, setCanPrompt] = useState(canPromptInstall())
  const standalone = isStandalone()
  const url = reopenUrl()
  const ext = externalOpenUrl(os, url)

  useEffect(() => onInstallPrompt(() => setCanPrompt(canPromptInstall())), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      sfx.ok()
    } catch {
      // コピーできない端末では、アドレスを長押しで選んでもらう
      setCopied(false)
    }
  }

  return (
    <main className="parents install">
      <header className="col-head">
        <a className="btn btn-small" href="#/" aria-label={tr('もどる')}>
          ←
        </a>
        <h1 className="col-title">{tr('ホーム画面に入れる')}</h1>
      </header>

      {standalone ? (
        <section className="par-card inst-done">
          <PikuruCut art="ok" height={90} />
          <p>{tr('ホーム画面から開いています。このまま遊べます（電波がなくても遊べます）。')}</p>
        </section>
      ) : (
        <p className="inst-lead">{tr('ホーム画面に入れると、アプリのように ピクルくんの アイコンから すぐ開けて、電波のない所でも遊べます。')}</p>
      )}

      {app && (
        <section className="par-card inst-inapp" data-testid="install-inapp">
          <h2>{tr('いま {0} の中で開いています', [tr(app)])}</h2>
          <p>{tr('アプリの中のブラウザでは、ホーム画面に入れられません。記録（ほし・きせかえ）も、ふだんのブラウザとは別に保存されます。{0} で開きなおしてください。', [os === 'android' ? 'Chrome' : 'Safari'])}</p>
          <div className="inst-row">
            <Phone width={150} label={tr('① 右上の「…」')}>
              <InAppScreen hi="more" os={os === 'android' ? 'android' : 'ios'} />
            </Phone>
            <Phone width={150} label={tr('②「外部ブラウザで開く」')}>
              <InAppMenu hi="menu" />
            </Phone>
          </div>
          <div className="inst-buttons">
            {ext && (
              <a className="btn btn-go" href={ext} data-testid="install-open-external">
                {os === 'android' ? tr('Chrome で ひらく') : tr('Safari で ひらく')}
              </a>
            )}
            <button className="btn" onClick={copy} data-testid="install-copy">
              {copied ? tr('コピーしました') : tr('リンクを コピー')}
            </button>
          </div>
          <p className="par-note">{tr('ボタンで開かないときは、上の図のように「…」から開くか、リンクをコピーして {0} のアドレス欄に貼りつけてください。', [os === 'android' ? 'Chrome' : 'Safari'])}</p>
          <p className="inst-url">{url}</p>
        </section>
      )}

      {canPrompt && !app && (
        <section className="par-card">
          <button
            className="btn btn-go"
            onClick={() => {
              void promptInstall()
            }}
            data-testid="install-prompt"
          >
            {tr('📲 ホーム画面に入れる')}
          </button>
        </section>
      )}

      <div className="seg inst-tabs" role="tablist" aria-label={tr('スマホの しゅるい')}>
        {(['ios', 'android'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} aria-checked={tab === t} onClick={() => setTab(t)} data-testid={`install-tab-${t}`}>
            {t === 'ios' ? tr('iPhone・iPad（Safari）') : 'Android（Chrome）'}
          </button>
        ))}
      </div>

      {tab === 'ios' ? (
        <ol className="inst-steps">
          <li>
            <Phone width={170}>
              <SafariScreen hi="share" />
            </Phone>
            <p>
              <Rich text={tr('**Safari** で開いて、下の **共有ボタン**（四角と上向きの矢印）をタップ。見つからないときは「…」の中にあります。')} />
            </p>
          </li>
          <li>
            <Phone width={170}>
              <ShareSheetArt hi="addHome" />
            </Phone>
            <p>
              <Rich text={tr('下へ動かして **「ホーム画面に追加」** をタップ。')} />
            </p>
          </li>
          <li>
            <Phone width={170}>
              <AddHomeArt hi="add" />
            </Phone>
            <p>
              <Rich text={tr('右上の **「追加」** をタップ。')} />
            </p>
          </li>
          <li>
            <Phone width={170}>
              <HomeScreenArt hi="icon" />
            </Phone>
            <p>{tr('ホーム画面の ピクルくんから開けます。')}</p>
          </li>
        </ol>
      ) : (
        <ol className="inst-steps">
          <li>
            <Phone width={170}>
              <ChromeScreen hi="cmore" />
            </Phone>
            <p>
              <Rich text={tr('**Chrome** で開いて、右上の **「⋮」** をタップ。')} />
            </p>
          </li>
          <li>
            <Phone width={170}>
              <ChromeMenuArt hi="cmenu" />
            </Phone>
            <p>
              <Rich text={tr('**「ホーム画面に追加」** か **「アプリをインストール」** をタップ。')} />
            </p>
          </li>
          <li>
            <Phone width={170}>
              <InstallDialogArt hi="install" />
            </Phone>
            <p>
              <Rich text={tr('**「インストール」**（または「追加」）をタップ。')} />
            </p>
          </li>
          <li>
            <Phone width={170}>
              <HomeScreenArt hi="icon" />
            </Phone>
            <p>{tr('ホーム画面の ピクルくんから開けます。')}</p>
          </li>
        </ol>
      )}

      <section className="par-card">
        <h2>{tr('知っておくと よいこと')}</h2>
        <ul className="inst-notes">
          <li>{tr('ボタンの名前や場所は、アプリ・OS の版によって少しちがいます。')}</li>
          <li>{tr('記録（ほし・きせかえ・メダル）は、ブラウザごと・ホーム画面のアプリごとに別々に保存されます。ホーム画面に入れたら、そこから遊ぶのがおすすめです。')}</li>
          <li>{tr('ホーム画面に入れても、お金はかかりません。広告もありません。')}</li>
        </ul>
      </section>
    </main>
  )
}
