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
import { getSettings, setSettings } from '../../core/settings'
import { sfx, unlockAudio } from '../../core/sound'
import { speak } from '../../core/speak'
import { useStage } from '../../core/Stage'
import { load, save } from '../../core/storage'
import { PHRASES } from '../../core/voiceLines'
import { usePlay } from '../../shell/playContext'
import { Result } from '../../ui/GameUI'
import { CONTEST_ROUNDS, HINT_AFTER, HINT_MS, makeDiff, makeStage, makeWally, MISS_MS, STAGE_MISS_MS, STAGES, WALLY_ROUNDS, whyNot, ZONE_NAME } from './sagasu'
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
/** ステージ：どこまで クリアしたか */
export const STAGE_MAX_KEY = 'sagasu-stage-max'
/** はじめられる ステージ（クリアした つぎ まで） */
export const stageLimit = () => Math.min(STAGES, load<number>(STAGE_MAX_KEY, 0) + 1)

/** ステージの めじるし（後半は くち・まゆげ も ちがいに なる。3行目は 15から） */
function stageMarks(n: number): [string, string, string | null] {
  return [t('○ ライムの はちまき・つる'), t('× めがね・ひげ・ぼうし'), n >= 21 ? t('○ にっこり × まゆげ') : n >= 15 ? t('○ にっこり くち') : null]
}

export function SagasuGame({ levels, paused, onRestart }: Props) {
  const play = usePlay()
  const contest = play.contest
  const level = levels[0]
  const stage = useStage()
  // じゅんばんモードは いつも さがせ！ピクルくん
  const [mode] = useState(() => (contest ? 'wally' : getSettings().sagasuMode))
  const rand = useMemo(() => (contest ? mulberry32(contest.seed) : Math.random), [contest])
  const rounds = contest ? CONTEST_ROUNDS : WALLY_ROUNDS
  const [stageNo, setStageNo] = useState(() => Math.max(1, Math.min(stageLimit(), Math.round(getSettings().sagasuStage) || 1)))
  const crowd = mode === 'wally' || mode === 'stage'
  // 絵の縦横（画面に合わせて、始めたときに決める）
  const [dims] = useState(() => {
    const W = Math.max(280, stage.w - 16)
    const H = Math.max(300, stage.h - HEAD - 12)
    if (mode !== 'diff') return { side: false, w: 100, h: Math.min(220, Math.max(80, (100 * H) / W)) }
    const side = W > H * 1.1
    const iw = side ? (W - 10) / 2 : W
    const ih = side ? H : (H - 10) / 2
    return { side, w: 100, h: Math.min(150, Math.max(55, (100 * ih) / iw)) }
  })
  const [wally, setWally] = useState<WallyRound | null>(() =>
    mode === 'wally' ? makeWally(level, dims.w, dims.h, rand) : mode === 'stage' ? makeStage(stageNo, dims.w, dims.h, rand) : null,
  )
  const [diff] = useState<DiffRound | null>(() => (mode === 'diff' ? makeDiff(level, dims.w, dims.h, rand) : null))
  const [round, setRound] = useState(0)
  const [found, setFound] = useState<Set<string>>(new Set())
  const [ring, setRing] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  /** さがせ！ピクルくん：このラウンドで まちがえた人・いま まちがえた人・ヒントの丸 */
  const [missed, setMissed] = useState<Set<string>>(new Set())
  const [miss, setMiss] = useState<string | null>(null)
  const [wallyHint, setWallyHint] = useState<{ x: number; y: number; r: number } | null>(null)
  const [over, setOver] = useState<{ ms: number; best: number; isBest: boolean } | null>(null)
  /** ステージ：さいごまで クリアした */
  const [allClear, setAllClear] = useState(false)
  const elapsed = useRef(0)
  const penalty = useRef(0)
  const sinceFind = useRef(0)
  const toastTimer = useRef(0)
  /** 見つけたあと つぎへ進む タイマー（画面を はなれたら止める。止めないと 前の回の記録が あとから とどく） */
  const nextTimer = useRef(0)
  const [, setTick] = useState(0)
  const busy = ring !== null || over !== null || allClear

  useEffect(() => {
    speak(mode === 'diff' ? PHRASES.sagasuDiff : PHRASES.sagasuWally)
    return () => {
      window.clearTimeout(toastTimer.current)
      window.clearTimeout(nextTimer.current)
    }
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
    toastTimer.current = window.setTimeout(() => {
      setToast(null)
      setMiss(null)
    }, 1100)
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
      setMiss(null)
      setToast(null)
      setWallyHint(null)
      if (mode === 'stage') {
        if (stageNo > load<number>(STAGE_MAX_KEY, 0)) save(STAGE_MAX_KEY, stageNo)
        // こたえあわせで 大きく見せるので、少し長めに止める
        nextTimer.current = window.setTimeout(() => {
          if (stageNo >= STAGES) {
            sfx.fanfare()
            speak(PHRASES.sagasuAll)
            setAllClear(true)
            return
          }
          setStageNo(stageNo + 1)
          setSettings({ sagasuStage: stageNo + 1 })
          setWally(makeStage(stageNo + 1, dims.w, dims.h, rand))
          setRing(null)
          setMissed(new Set())
          sinceFind.current = 0
          // タイムは ステージごと
          elapsed.current = 0
          penalty.current = 0
        }, 2400)
        return
      }
      nextTimer.current = window.setTimeout(() => {
        if (round + 1 < rounds) {
          setRound(round + 1)
          setWally(makeWally(level, dims.w, dims.h, rand))
          setRing(null)
          setMissed(new Set())
          sinceFind.current = 0
        } else {
          finish(total())
        }
      }, 1900)
    } else {
      sfx.ng()
      const missMs = mode === 'stage' ? STAGE_MISS_MS : MISS_MS[level]
      penalty.current += missMs
      // どこが ちがうかを 文と 絵の丸で見せ、押した人は うすくする（つぎは見分けられるように）
      setMiss(id)
      setMissed((cur) => new Set(cur).add(id))
      const why = whyNot(wally.scene.people.find((p) => p.id === id)?.look ?? wally.scene.people[0].look)
      flash(`${why ?? t('ちがうよ')}${missMs ? t(' +{0}びょう', [missMs / 1000]) : ''}`)
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
      nextTimer.current = window.setTimeout(() => finish(total()), 900)
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

  // さがせ！ピクルくん：ほんものの まわりを 丸で しめす（ほんものが まんなかに こないよう、少し ずらす）
  const useWallyHint = () => {
    if (!wally || busy) return
    const p = wally.scene.people.find((x) => x.id === wally.target)
    if (!p) return
    sfx.tick()
    penalty.current += HINT_MS
    const a = rand() * Math.PI * 2
    const d = p.s * 0.6
    setWallyHint({ x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, r: p.s * 1.1 })
    speak(PHRASES.sagasuHint)
  }

  const hintDiff = diff && hint ? diff.diffs.find((d) => d.id === hint) ?? null : null
  const canHint = mode === 'diff' && sinceFind.current >= HINT_AFTER && !hint
  const canWallyHint = crowd && sinceFind.current >= HINT_AFTER && !wallyHint && !busy
  const marks = mode === 'stage' ? stageMarks(stageNo) : stageMarks(1)

  return (
    <div className="sagasu" data-mode={mode}>
      <header className="sagasu-head">
        {crowd ? (
          <>
            <TargetCard size={60} />
            <div className="sagasu-head-text">
              {!marks[2] && <b>{t('ほんものは どこ？')}</b>}
              <small className="sagasu-marks">{marks[0]}</small>
              <small className="sagasu-marks-no">{marks[1]}</small>
              {marks[2] && <small className="sagasu-marks">{marks[2]}</small>}
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
          {mode === 'wally' && <small>{t('{0} / {1}かいめ', [round + 1, rounds])}</small>}
          {mode === 'stage' && <small data-testid="sagasu-stage">{t('ステージ {0}', [stageNo])}</small>}
        </span>
        {mode === 'diff' && (
          <button className="btn btn-small sagasu-hint-btn" disabled={!canHint} onClick={useHint} data-testid="sagasu-hint">
            {t('ヒント')}
          </button>
        )}
      </header>

      <div className="sagasu-field" data-side={dims.side || undefined}>
        {crowd && wally && (
          <SceneSvg
            key={mode === 'stage' ? stageNo : round}
            zoomable={mode === 'stage'}
            scene={wally.scene}
            onPerson={onPerson}
            ring={ring}
            missed={missed}
            miss={miss}
            hint={wallyHint}
            disabled={busy || paused}
            testId="sagasu-scene"
          />
        )}
        {mode === 'diff' && diff && (
          <>
            <SceneSvg scene={diff.a} diffs={diff.diffs} found={found} onDiff={onDiff} onMiss={onDiffMiss} hint={hintDiff} disabled={busy || paused} testId="sagasu-a" />
            <SceneSvg scene={diff.b} diffs={diff.diffs} found={found} onDiff={onDiff} onMiss={onDiffMiss} hint={hintDiff} disabled={busy || paused} testId="sagasu-b" />
          </>
        )}
      </div>

      {ring && crowd && wally && (
        <div className="sagasu-found-note" data-testid="sagasu-found">
          {mode === 'stage' ? (
            <Rich text={t('ステージ{0} クリア！ **{1}**に いたよ', [stageNo, ZONE_NAME[wally.zone]])} />
          ) : (
            <Rich text={t('みつけた！ **{0}**に いたよ', [ZONE_NAME[wally.zone]])} />
          )}
        </div>
      )}
      {toast && <div className="sagasu-toast">{toast}</div>}
      {canWallyHint && !toast && (
        <button className="btn btn-small sagasu-wally-hint" onClick={useWallyHint} data-testid="sagasu-wally-hint">
          {t('ヒント +{0}びょう', [HINT_MS / 1000])}
        </button>
      )}

      {allClear && (
        <Result
          single
          title={() => t('ぜんぶの ステージ クリア！')}
          sub={() => t('{0}にんの なかから みつけた めいたんてい', [wally?.scene.people.length ?? 0])}
          face={() => 'ok'}
          onAgain={() => {
            setSettings({ sagasuStage: 1 })
            onRestart()
          }}
        />
      )}
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
