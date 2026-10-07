/**
 * きねんカードの共有。子どもだけで SNS に のせないように、最初に おうちの人の確認（ParentGate）を出す。
 * 共有は端末の「共有」画面（Web Share）を使う。使えない端末では画像を保存できるようにする。
 * どこにも自動では送らない（のせるかどうか・どこに のせるかは おうちの人が決める）。
 */
import { useEffect, useState } from 'react'
import { countShare } from '../core/counter'
import { makeCard, shareText } from './shareCard'
import type { CardData } from './shareCard'
import { ParentGate } from './ParentGate'
import './share.css'

type Step = 'gate' | 'making' | 'ready' | 'error'

export function ShareSheet({ card, onClose, flipped = false, fixed = false }: { card: CardData; onClose: () => void; flipped?: boolean; fixed?: boolean }) {
  const [step, setStep] = useState<Step>('gate')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (step !== 'making') return
    let alive = true
    makeCard(card)
      .then((b) => {
        if (!alive) return
        setBlob(b)
        setUrl(URL.createObjectURL(b))
        setStep('ready')
      })
      .catch(() => alive && setStep('error'))
    return () => {
      alive = false
    }
  }, [step, card])

  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  const file = blob ? new File([blob], 'pickle-asobi.png', { type: 'image/png' }) : null
  const canShare = !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

  const share = async () => {
    if (!file) return
    try {
      await navigator.share({ files: [file], text: shareText(card) })
      countShare(card.game ?? '')
    } catch {
      // とじただけのときも ここに来る
    }
  }

  return (
    <div className={`share-backdrop ${fixed ? 'share-backdrop-fixed' : ''}`} onClick={onClose}>
      <div className="share-sheet" data-flipped={flipped || undefined} onClick={(e) => e.stopPropagation()} data-testid="share-sheet">
        {step === 'gate' && <ParentGate onPass={() => setStep('making')} onCancel={onClose} />}
        {step === 'making' && <p className="share-wait">カードを つくっています…</p>}
        {step === 'error' && <p className="share-wait">カードを つくれませんでした。</p>}
        {step === 'ready' && url && (
          <>
            <h2 className="share-title">きねんカード</h2>
            <img className="share-img" src={url} alt={`${card.gameTitle} ${card.title}`} />
            <p className="share-note">名前や顔写真は入っていません。共有先は保護者の方が選んでください。{note}</p>
            <div className="share-actions">
              {canShare && (
                <button className="btn btn-go" onClick={share}>
                  シェアする
                </button>
              )}
              <a className="btn" href={url} download="pickle-asobi.png" onClick={() => {
                  countShare(card.game ?? '')
                  setNote('（保存できないときは、画像を長押しして保存してください）')
                }}
              >
                画像を保存
              </a>
            </div>
          </>
        )}
        {step !== 'gate' && (
          <button className="btn btn-quiet" onClick={onClose}>
            とじる
          </button>
        )}
      </div>
    </div>
  )
}
