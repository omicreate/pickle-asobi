/**
 * エアピックル（ふたり）の画面。机に置いて上下で向かい合う。
 * 指でパドル（上から見た面）を動かして球を打ち、相手のゴールに入れる。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { useFrame } from '../../core/loop'
import { SIDE_COLOR, SIDE_NAME } from '../../core/players'
import type { Level, Side } from '../../core/players'
import { sfx, unlockAudio } from '../../core/sound'
import { speak } from '../../core/speak'
import { useStage } from '../../core/Stage'
import { PHRASES } from '../../core/voiceLines'
import { usePlay } from '../../shell/playContext'
import { Notice, Result, Scores } from '../../ui/GameUI'
import type { NoticeData } from '../../ui/GameUI'
import { drawPaddleArt } from '../../ui/paddleArt'
import type { PaddleLook } from '../../ui/paddleArt'
import type { Face } from '../../ui/Pikuru'
import { PikuruCut } from '../../ui/pikuruArt'
import { aim, airPower, BALL_R, createAir, FIELD_H, FIELD_W, goalWidth, stepAir, TARGET } from './air'
import { drawImpact, drawTrail } from '../../ui/hitFx'
import type { AirState } from './air'
import { t } from '../../i18n'

interface Props {
  levels: [Level, Level]
  paused: boolean
  onRestart: () => void
}

/** 指より少しネット側にパドルを出す（指で隠れないように） */
const FINGER_OFFSET = 9
/** 残像に残す点の数・打った瞬間の光の時間（秒） */
const TRAIL_LEN = 9
const IMPACT_TIME = 0.22

/** 見た目だけに使う残像と光（球の動きには関わらない） */
interface AirFx {
  trail: { x: number; y: number }[]
  impact: { x: number; y: number; power: number; t: number } | null
}

export function AirGame({ levels, paused, onRestart }: Props) {
  const stage = useStage()
  const play = usePlay()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const game = useMemo<AirState>(() => createAir(levels), [levels])
  const pointers = useRef(new Map<number, Side>())
  const owner = useRef<[number | null, number | null]>([null, null])
  const noticeTimer = useRef(0)
  const countRef = useRef(3)
  const fx = useRef<AirFx>({ trail: [], impact: null })
  const [score, setScore] = useState<[number, number]>([0, 0])
  const [notice, setNotice] = useState<NoticeData | null>({ title: '3', big: true })
  const [over, setOver] = useState<Side | null>(null)
  const [face, setFace] = useState<Face>('think')

  const view = useMemo(() => {
    const scale = Math.min((stage.w - 12) / FIELD_W, (stage.h - 12) / (FIELD_H + 8))
    return { scale, ox: (stage.w - FIELD_W * scale) / 2, oy: (stage.h - FIELD_H * scale) / 2 }
  }, [stage.w, stage.h])

  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __air?: AirState }).__air = game
  }, [game])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
    c.width = Math.round(stage.w * dpr)
    c.height = Math.round(stage.h * dpr)
    c.style.width = `${stage.w}px`
    c.style.height = `${stage.h}px`
    c.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [stage.w, stage.h])

  useFrame((dt) => {
    if (!paused) {
      if (noticeTimer.current > 0) {
        noticeTimer.current -= dt
        if (noticeTimer.current <= 0) setNotice(null)
      }
      // はじめの 3・2・1
      if (game.phase === 'ready') {
        const n = Math.ceil(game.wait)
        if (n !== countRef.current && n > 0) {
          countRef.current = n
          sfx.tick()
          setNotice({ title: String(n), big: true })
        }
      }
      for (const ev of stepAir(game, dt)) {
        switch (ev.type) {
          case 'go':
            sfx.whistle()
            setNotice(null)
            setFace('eh')
            break
          case 'hit': {
            // 強く打つほど高く鋭い音・大きな光
            const power = airPower(game, ev.speed)
            sfx.hit(power)
            fx.current.impact = { x: game.ball.x, y: game.ball.y, power, t: IMPACT_TIME }
            fx.current.trail = []
            break
          }
          case 'wall':
            sfx.bounce()
            break
          case 'goal':
            sfx.ok()
            setScore(ev.score)
            setFace('ok')
            speak(ev.scorer === 0 ? PHRASES.point0 : PHRASES.point1)
            setNotice({ title: t('ゴール！'), sub: t('{0}の てん', [SIDE_NAME[ev.scorer]]), faces: [ev.scorer === 0 ? 'ok' : 'oops', ev.scorer === 1 ? 'ok' : 'oops'] })
            noticeTimer.current = 1.4
            break
          case 'over':
            sfx.fanfare()
            speak(ev.winner === 0 ? PHRASES.win0 : PHRASES.win1)
            setNotice(null)
            play.finish({ winner: ev.winner })
            setOver(ev.winner)
            break
        }
      }
    }
    if (!paused) {
      const f = fx.current
      if (game.phase === 'play') {
        f.trail.push({ x: game.ball.x, y: game.ball.y })
        if (f.trail.length > TRAIL_LEN) f.trail.shift()
      } else f.trail = []
      if (f.impact) {
        f.impact.t -= dt
        if (f.impact.t <= 0) f.impact = null
      }
    }
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) draw(ctx, stage.w, stage.h, view, game, play.paddles, fx.current)
  })

  const toField = (e: PointerEvent) => {
    const p = stage.toLogical(e.clientX, e.clientY)
    const side: Side = p.y < stage.h / 2 ? 1 : 0
    return { side, x: (p.x - view.ox) / view.scale, y: (p.y - view.oy) / view.scale + (side === 0 ? -FINGER_OFFSET : FINGER_OFFSET) }
  }
  const onDown = (e: PointerEvent<HTMLCanvasElement>) => {
    unlockAudio()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // 捕まえられなくても動く
    }
    const { side, x, y } = toField(e)
    pointers.current.set(e.pointerId, side)
    owner.current[side] = e.pointerId
    aim(game, side, x, y)
  }
  const onMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const side = pointers.current.get(e.pointerId)
    if (side === undefined || owner.current[side] !== e.pointerId) return
    const { x, y } = toField(e)
    aim(game, side, x, y)
  }
  const onUp = (e: PointerEvent<HTMLCanvasElement>) => {
    const side = pointers.current.get(e.pointerId)
    pointers.current.delete(e.pointerId)
    if (side !== undefined && owner.current[side] === e.pointerId) owner.current[side] = null
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, display: 'block', touchAction: 'none' }}
        data-testid="air-canvas"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div style={{ position: 'absolute', left: 2, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 5 }}>
        <PikuruCut art={face} height={Math.round(Math.min(80, stage.w * 0.17))} />
      </div>
      <Scores score={score} />
      <Notice data={notice} />
      {over !== null && (
        <Result
          title={(side) => (side === over ? t('かち！ やったね') : t('おしい！'))}
          sub={(side) => t('{0} たい {1}（{2}てん とったら かち）', [score[side], score[side === 0 ? 1 : 0], TARGET])}
          face={(side) => (side === over ? 'ok' : 'oops')}
          onAgain={onRestart}
        />
      )}
    </div>
  )
}

interface View {
  scale: number
  ox: number
  oy: number
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, v: View, s: AirState, looks: [PaddleLook, PaddleLook], fx: AirFx) {
  const k = v.scale
  const X = (x: number) => v.ox + x * k
  const Y = (y: number) => v.oy + y * k
  ctx.fillStyle = '#f2efe8'
  ctx.fillRect(0, 0, w, h)

  // 場（コートの色）とキッチン、まんなかのネット
  ctx.beginPath()
  ctx.roundRect(X(0), Y(0), FIELD_W * k, FIELD_H * k, 14)
  ctx.fillStyle = '#2f6fe4'
  ctx.fill()
  const kz = FIELD_H * 0.16
  ctx.fillStyle = '#ff7eb6'
  ctx.fillRect(X(0), Y(FIELD_H / 2 - kz), FIELD_W * k, kz * 2 * k)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.strokeRect(X(0) + 1, Y(FIELD_H / 2 - kz), FIELD_W * k - 2, kz * 2 * k)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(X(0), Y(FIELD_H / 2) - 2, FIELD_W * k, 4)
  ctx.beginPath()
  ctx.arc(X(FIELD_W / 2), Y(FIELD_H / 2), 12 * k, 0, Math.PI * 2)
  ctx.lineWidth = 2
  ctx.stroke()

  // ゴール（自分の色）
  for (const side of [0, 1] as Side[]) {
    const gw = goalWidth(s, side)
    const y = side === 0 ? Y(FIELD_H) : Y(0)
    ctx.fillStyle = SIDE_COLOR[side]
    ctx.fillRect(X(FIELD_W / 2 - gw / 2), y - 4, gw * k, 8)
    ctx.fillStyle = 'rgba(18, 48, 43, 0.5)'
    ctx.fillRect(X(FIELD_W / 2 - gw / 2), side === 0 ? y + 4 : y - 4 - 3 * k, gw * k, 3 * k)
  }
  ctx.beginPath()
  ctx.roundRect(X(0), Y(0), FIELD_W * k, FIELD_H * k, 14)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.stroke()

  // 速い球ほど長く濃い残像（まさつで遅くなると薄れる）、打った瞬間は強さに合わせた光
  const b = s.ball
  const speedK = Math.min(1, Math.max(0, (airPower(s, Math.hypot(b.vx, b.vy)) - 0.5) / 0.6))
  if (speedK > 0) {
    const n = Math.min(fx.trail.length, Math.round(3 + speedK * (TRAIL_LEN - 3)))
    drawTrail(ctx, fx.trail.slice(fx.trail.length - n).map((q) => ({ x: X(q.x), y: Y(q.y) })), BALL_R * k, speedK)
  }
  if (fx.impact) drawImpact(ctx, X(fx.impact.x), Y(fx.impact.y), BALL_R * 2 * k, 1 - fx.impact.t / IMPACT_TIME, fx.impact.power)

  // 球（影つき）
  ctx.beginPath()
  ctx.ellipse(X(b.x) + 2, Y(b.y) + 3, BALL_R * k, BALL_R * k * 0.8, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fill()
  const r = BALL_R * k
  ctx.beginPath()
  ctx.arc(X(b.x), Y(b.y), r, 0, Math.PI * 2)
  ctx.fillStyle = '#d4f03c'
  ctx.fill()
  ctx.lineWidth = Math.max(1.5, r * 0.14)
  ctx.strokeStyle = '#2e5a1c'
  ctx.stroke()
  ctx.fillStyle = '#2e5a1c'
  for (const [dx, dy] of [
    [-0.35, -0.25],
    [0.3, -0.3],
    [0.05, 0.38],
  ]) {
    ctx.beginPath()
    ctx.arc(X(b.x) + dx * r, Y(b.y) + dy * r, r * 0.16, 0, Math.PI * 2)
    ctx.fill()
  }

  // パドル（原画の形。握りは自分の方へ）
  for (const side of [0, 1] as Side[]) {
    const p = s.paddles[side]
    drawPaddleArt(ctx, { x: X(p.x), y: Y(p.y), faceLen: p.len * k, angle: side === 0 ? -Math.PI / 2 : Math.PI / 2, look: looks[side] })
  }
}
