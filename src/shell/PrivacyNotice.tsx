import { useState } from 'react'
import { setSettings } from '../core/settings'
import { load, save } from '../core/storage'
import { t } from '../i18n'
import './privacy.css'

const KEY = 'privacySeen'

/** はじめて開いたときだけ、回数を数えていることを一行で知らせる。閉じる・説明を開く・送らないを選んだら、次からは出さない */
export function PrivacyNotice() {
  const [open, setOpen] = useState(() => !load<boolean>(KEY, false))
  if (!open) return null
  const close = () => {
    save(KEY, true)
    setOpen(false)
  }
  return (
    <aside className="privacy-notice" aria-label={t('計測のお知らせ')}>
      <p>
        {t('このアプリは、開いた回数と遊んだ回数だけを数えています。')}{' '}
        <a href="#/parents" onClick={close}>
          {t('詳しく')}
        </a>
        {' / '}
        <button
          type="button"
          className="privacy-off"
          onClick={() => {
            setSettings({ counter: false })
            close()
          }}
        >
          {t('送らない')}
        </button>
      </p>
      <button type="button" className="privacy-x" aria-label={t('お知らせを閉じる')} onClick={close}>
        ×
      </button>
    </aside>
  )
}
