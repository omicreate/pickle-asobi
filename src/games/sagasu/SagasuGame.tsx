/**
 * ピクルくん さがし（ひとりで）の画面。手に持って遊ぶので画面は回さない。
 * - さがせ！ピクルくん：5回（じゅんばんモードは3回・みんな同じ場面）。見つけるまでの時間の合計で くらべる
 * - まちがいさがし：上と下（横向きなら左右）の絵の ちがいを ぜんぶ見つけるまでの時間
 * ちがう人をタップすると時間が少しふえる（ちびっこは ふえない）。まちがいさがしは15秒たつとヒントが使える。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '../../core/loop'
import type { Level } from '../../core/players'
import { mulberry32 } from '../../core/rng'
import { getSettings } from '../../core/settings'
import { sfx, unlockAudio } from '../../core/sound'
import { speak } from '../../core/speak'
import { useStage } from '../../core/Stage'
import { load, save } from '../../core/storage'
import { PHRASES } from '../../core/voiceLines'
import { usePlay } from '../../shell/playContext'
import { Result } from '../../ui/GameUI'
import { CONTEST_ROUNDS, HINT_AFTER, HINT_MS, makeDiff, makeWally, MISS_MS, WALLY_ROUNDS, whyNot, ZONE_NAME } from './sagasu'
import type { DiffRound, WallyRound, Zone } from './sagasu'
import { SceneSvg, TargetCard } from './SceneSvg'
import './sagasu.css'
import { t } from '../../i18n'
import { Rich } from '../../i18n/Rich'

interface Props {
  levels: [Level, Level]
  paused: boolean
  onRestart: () => void
}

export const ZONE_PHRASE: Record<Zone, string> = {
  kitchen: PHRASES.sagasuKitchen,
  service: PHRASES.sagasuService,
  outside: PHRASES.sagasuOutside,
}

const HEAD = 72
const sec = (ms: number) => (ms / 1000).toFixed(1)
const bestKey = (mode: string, lv: Level) => `sagasu-best-${mode}-${lv}`

export function SagasuGame({ levels, paused, onRestart }: Props) {
  const play = usePlay()
  const contest = play.contest
  const level = levels[0]
  const stage = useStage()
  // じゅんばんモードは いつも さがせ！ピクルくん
  const [mode] = useState(() => (contest ? 'wally' : getSettings().sagasuMode))
  const rand = useMemo(() => (contest ? mulberry32(contest.seed) : Math.random), [contest])
  const rounds = contest ? CONTEST_ROUNDS : WALLY_ROUNDS
  // 絵の縦横（画面に合わせて、始めたときに決める）
  const [dims] = useState(() => {
    const W = Math.max(280, stage.w - 16)
    const H = Math.max(300, stage.h - HEAD - 12)
    if (mode === 'wally') return { side: false, w: 100, h: Math.min(220, Math.max(80, (100 * H) / W)) }
    const side = W > H * 1.1
    const iw = side ? (W - 10) / 2 : W
    const ih = side ? H : (H - 10) / 2
    return { side, w: 100, h: Math.min(150, Math.max(55, (100 * ih) / iw)) }
  })
  const [wally, setWally] = useState<WallyRound | null>(() => (mode === 'wally' ? makeWally(level, dims.w, dims.h, rand) : null))
  const [diff] = useState<DiffRound | null>(() => (mode === 'diff' ? makeDiff(level, dims.w, dims.h, rand) : null))
  const [round, setRound] = useState(0)
  const [found, setFound] = useState<Set<string>>(new Set())
  const [ring, setRing] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [over, setOver] = useState<{ ms: number; best: number; isBest: boolean } | null>(null)
  const elapsed = useRef(0)
  const penalty = useRef(0)
  const sinceFind = useRef(0)
  const toastTimer = useRef(0)
  const [, setTick] = useState(0)
  const busy = ring !== null || over !== null

  useEffect(() => {
    speak(mode === 'wally' ? PHRASES.sagasuWally : PHRASES.sagasuDiff)
    return () => window.clearTimeout(toastTimer.current)
  }, [mode])

  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __sagasu?: unknown }).__sagasu = { wally, diff, found }
  }, [wally, diff, found])

  useFrame((dt) => {
    if (paused || busy) return
    elapsed.current += dt * 1000
    sinceFind.current += dt
    setTick((n) => (n + 1) % 1000)
  })

  const flash = (text: string) => {
    setToast(text)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1100)
  }

  const finish = (ms: number) => {
    sfx.fanfare()
    play.finish({ value: Math.round(ms) })
    if (contest) {
      setOver({ ms, best: 0, isBest: false })
      return
    }
    const key = bestKey(mode, level)
    const prev = load<number>(key, 0)
    const isBest = !prev || ms < prev
    if (isBest) save(key, Math.round(ms))
    speak(isBest && prev ? PHRASES.great : PHRASES.sagasuAll)
    setOver({ ms, best: isBest ? ms : prev, isBest: isBest && !!prev })
  }

  const total = () => elapsed.current + penalty.current

  // ---------- さがせ！ピクルくん ----------
  const onPerson = (id: string) => {
    unlockAudio()
    if (paused || busy || !wally) return
    if (id === wally.target) {
      sfx.ok()
      speak(ZONE_PHRASE[wally.zone])
      setRing(id)
      window.setTimeout(() => {
        if (round + 1 < rounds) {
          setRound(round + 1)
          setWally(makeWally(level, dims.w, dims.h, rand))
          setRing(null)
        } else {
          finish(total())
        }
      }, 1900)
    } else {
      sfx.ng()
      penalty.current += MISS_MS[level]
      // どこが ちがうかを見せる（つぎは見分けられるように）
      const why = whyNot(wally.scene.people.find((p) => p.id === id)?.look ?? wally.scene.people[0].look)
      flash(`${why ?? t('ちがうよ')}${MISS_MS[level] ? t(' +{0}びょう', [MISS_MS[level] / 1000]) : ''}`)
    }
  }

  // ---------- まちがいさがし ----------
  const missPenalty = level === 'otona' || level === 'senshu' ? MISS_MS[level] / 2 : 0
  const onDiff = (id: string) => {
    unlockAudio()
    if (paused || busy || !diff) return
    const d = diff.diffs.find((x) => x.id === id)
    const next = new Set(found)
    next.add(id)
    setFound(next)
    setHint(null)
    sinceFind.current = 0
    sfx.ok()
    flash(`${d?.label ?? ''}！`)
    if (next.size >= diff.diffs.length) {
      window.setTimeout(() => finish(total()), 900)
      setRing('done')
    } else speak(PHRASES.sagasuFound)
  }
  const onDiffMiss = () => {
    unlockAudio()
    if (paused || busy || !diff) return
    sfx.ng()
    penalty.current += missPenalty
    flash(missPenalty ? t('ちがうよ +{0}びょう', [missPenalty / 1000]) : t('ちがうよ'))
  }
  const useHint = () => {
    if (!diff || busy) return
    const left = diff.diffs.filter((d) => !found.has(d.id))
    if (!left.length) return
    sfx.tick()
    penalty.current += HINT_MS
    sinceFind.current = 0
    setHint(left[0].id)
    speak(PHRASES.sagasuHint)
  }

  const hintDiff = diff && hint ? diff.diffs.find((d) => d.id === hint) ?? null : null
  const canHint = mode === 'diff' && sinceFind.current >= HINT_AFTER && !hint

  return (
    <div className="sagasu" data-mode={mode}>
      <header className="sagasu-head">
        {mode === 'wally' ? (
          <>
            <TargetCard size={60} />
            <div className="sagasu-head-text">
              <b>{t('ほんものは どこ？')}</b>
              <small className="sagasu-marks">{t('ライムの はちまき・あたまに つる')}</small>
              <small>
                {t('{0} / {1}かいめ', [round + 1, rounds])}
              </small>
            </div>
          </>
        ) : (
          <div className="sagasu-head-text">
            <b>{t('ちがいを さがそう')}</b>
            <small data-testid="sagasu-left">
              {t('のこり {0}こ', [diff ? diff.diffs.length - found.size : 0])}
            </small>
          </div>
        )}
        <span className="sagasu-time" aria-label={t('じかん')}>
          {sec(total())}
        </span>
        {mode === 'diff' && (
          <button className="btn btn-small sagasu-hint-btn" disabled={!canHint} onClick={useHint} data-testid="sagasu-hint">
            {t('ヒント')}
          </button>
        )}
      </header>

      <div className="sagasu-field" data-side={dims.side || undefined}>
        {mode === 'wally' && wally && (
          <SceneSvg key={round} scene={wally.scene} onPerson={onPerson} ring={ring} disabled={busy || paused} testId="sagasu-scene" />
        )}
        {mode === 'diff' && diff && (
          <>
            <SceneSvg scene={diff.a} diffs={diff.diffs} found={found} onDiff={onDiff} onMiss={onDiffMiss} hint={hintDiff} disabled={busy || paused} testId="sagasu-a" />
            <SceneSvg scene={diff.b} diffs={diff.diffs} found={found} onDiff={onDiff} onMiss={onDiffMiss} hint={hintDiff} disabled={busy || paused} testId="sagasu-b" />
          </>
        )}
      </div>

      {ring && mode === 'wally' && wally && (
        <div className="sagasu-found-note" data-testid="sagasu-found">
          <Rich text={t('みつけた！ **{0}**に いたよ', [ZONE_NAME[wally.zone]])} />
        </div>
      )}
      {toast && <div className="sagasu-toast">{toast}</div>}

      {over && !contest && (
        <Result
          single
          title={() => (mode === 'wally' ? t('{0}かい みつけた！', [rounds]) : t('ぜんぶ みつけた！'))}
          sub={() => t('{0}びょう（じこベスト {1}びょう）', [sec(over.ms), sec(over.best)])}
          face={() => 'ok'}
          onAgain={onRestart}
          extra={over.isBest ? <p className="sagasu-best">{t('じこベスト こうしん！')}</p> : undefined}
        />
      )}
    </div>
  )
}
