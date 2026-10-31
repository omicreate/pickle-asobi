/**
 * ピクルくん さがしの絵（SVG）。人・物は1つずつ要素にして、タップはブラウザの当たり判定にまかせる
 * （ふたりで遊ぶときの 180° 回した半分でも、座標の計算がいらない）。
 */
import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from 'react'
import { t } from '../../i18n'
import { partOf, partSpot, REAL } from './sagasu'
import type { Band, Diff, Hat, Look, Person, Scene, Thing, Tone } from './sagasu'

const INK = '#1b1b3a'
const DARK = '#2e5a1c'
// yellow はライム（#d4f03c）と見分けられるよう、だいだい寄りの黄色にする
const BAND: Record<Band, string> = { lime: '#d4f03c', orange: '#ff8a3d', blue: '#3d9be9', pink: '#ff6fae', white: '#ffffff', yellow: '#ffb300' }
const HAT: Record<Hat, string> = { red: '#e53935', blue: '#3d6fd9' }
// olive は みどり（#6bb33f）と見分けられるよう、黄みを強くする
const TONE: Record<Tone, string> = { green: '#6bb33f', dark: '#3f7f2a', olive: '#a8b83a' }

/** ピクルくん（とにせもの）。x,y は体の中心、s は高さ */
export function PersonFigure({ look, x, y, s, flip = false }: { look: Look; x: number; y: number; s: number; flip?: boolean }) {
  const w = s * 0.6
  const sw = Math.max(0.5, s * 0.06)
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`}>
      <ellipse cx={0} cy={s * 0.52} rx={w * 0.55} ry={s * 0.07} fill="rgba(18,48,43,0.18)" pointerEvents="none" />
      {look.stem && !look.hat && <path d={`M ${w * 0.05} ${-s / 2} q ${w * 0.1} ${-s * 0.2} ${w * 0.32} ${-s * 0.16}`} fill="none" stroke={DARK} strokeWidth={s * 0.07} strokeLinecap="round" />}
      <rect x={-w / 2} y={-s / 2} width={w} height={s} rx={w / 2} fill={TONE[look.body]} stroke={DARK} strokeWidth={sw} />
      <rect x={-w / 2 + sw / 2} y={-s * 0.25} width={w - sw} height={s * 0.15} fill={BAND[look.band]} stroke={DARK} strokeWidth={sw * 0.6} />
      {[-1, 1].map((k) => (
        <g key={k}>
          <circle cx={k * w * 0.2} cy={s * 0.05} r={s * 0.1} fill="#fff" stroke={DARK} strokeWidth={sw * 0.5} />
          <circle cx={k * w * 0.2 + s * 0.02} cy={s * 0.06} r={s * 0.05} fill={INK} />
        </g>
      ))}
      {look.glasses && (
        <g fill="none" stroke={INK} strokeWidth={sw * 0.8}>
          <circle cx={-w * 0.2} cy={s * 0.05} r={s * 0.13} />
          <circle cx={w * 0.2} cy={s * 0.05} r={s * 0.13} />
          <path d={`M ${-w * 0.2 + s * 0.13} ${s * 0.05} H ${w * 0.2 - s * 0.13}`} />
        </g>
      )}
      {look.mustache ? (
        <path d={`M ${-w * 0.28} ${s * 0.27} q ${w * 0.14} ${-s * 0.1} ${w * 0.28} 0 q ${w * 0.14} ${-s * 0.1} ${w * 0.28} 0`} fill="none" stroke={INK} strokeWidth={sw * 1.4} strokeLinecap="round" />
      ) : look.mouth === 'o' ? (
        <ellipse cx={0} cy={s * 0.27} rx={w * 0.09} ry={s * 0.055} fill={INK} />
      ) : (
        <path d={`M ${-w * 0.15} ${s * 0.25} q ${w * 0.15} ${s * 0.1} ${w * 0.3} 0`} fill="none" stroke={DARK} strokeWidth={sw * 0.8} strokeLinecap="round" />
      )}
      {look.brows && (
        <g stroke={INK} strokeWidth={sw * 0.9} strokeLinecap="round">
          {[-1, 1].map((k) => (
            <path key={k} d={`M ${k * w * 0.2 - w * 0.1} ${-s * 0.07 + k * s * 0.012} L ${k * w * 0.2 + w * 0.1} ${-s * 0.07 - k * s * 0.012}`} />
          ))}
        </g>
      )}
      {look.hat && (
        <g>
          <path d={`M ${-w * 0.52} ${-s * 0.3} Q ${-w * 0.5} ${-s * 0.68} 0 ${-s * 0.68} Q ${w * 0.5} ${-s * 0.68} ${w * 0.52} ${-s * 0.3} Z`} fill={HAT[look.hat]} stroke={DARK} strokeWidth={sw * 0.7} />
          <path d={`M ${w * 0.3} ${-s * 0.32} H ${w * 0.95}`} stroke={HAT[look.hat]} strokeWidth={s * 0.08} strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}

function ThingFigure({ t }: { t: Thing }) {
  const s = t.s
  let body: ReactNode
  if (t.kind === 'ball') {
    body = (
      <g>
        <circle r={s / 2} fill={t.color} stroke={DARK} strokeWidth={s * 0.08} />
        {[
          [-0.18, -0.12],
          [0.16, -0.14],
          [0.02, 0.2],
        ].map(([dx, dy], i) => (
          <circle key={i} cx={dx * s} cy={dy * s} r={s * 0.075} fill={DARK} />
        ))}
      </g>
    )
  } else if (t.kind === 'paddle') {
    body = (
      <g>
        <rect x={-s * 0.06} y={s * 0.2} width={s * 0.12} height={s * 0.3} rx={s * 0.05} fill={DARK} />
        <rect x={-s * 0.25} y={-s * 0.5} width={s * 0.5} height={s * 0.72} rx={s * 0.18} fill={t.color} stroke={DARK} strokeWidth={s * 0.05} />
      </g>
    )
  } else if (t.kind === 'cone') {
    body = (
      <g>
        <path d={`M 0 ${-s * 0.5} L ${s * 0.32} ${s * 0.4} H ${-s * 0.32} Z`} fill={t.color} stroke={DARK} strokeWidth={s * 0.05} strokeLinejoin="round" />
        <path d={`M ${-s * 0.17} ${0} H ${s * 0.17}`} stroke="#fff" strokeWidth={s * 0.1} />
        <rect x={-s * 0.42} y={s * 0.38} width={s * 0.84} height={s * 0.1} rx={s * 0.04} fill={t.color} stroke={DARK} strokeWidth={s * 0.04} />
      </g>
    )
  } else {
    body = (
      <g>
        <rect x={-s * 0.18} y={-s * 0.35} width={s * 0.36} height={s * 0.8} rx={s * 0.08} fill={t.color} stroke={DARK} strokeWidth={s * 0.05} />
        <rect x={-s * 0.1} y={-s * 0.5} width={s * 0.2} height={s * 0.17} rx={s * 0.04} fill="#fff" stroke={DARK} strokeWidth={s * 0.04} />
      </g>
    )
  }
  // 物は押せない（人の前に かさなっても、うしろの人に タッチが とどくように）
  return (
    <g transform={`translate(${t.x} ${t.y}) rotate(${t.kind === 'ball' ? 0 : (t.rot % 60) - 30})`} pointerEvents="none">
      {body}
    </g>
  )
}

/** 公園とコート（コートは縦長。キッチンは ネットの両側） */
function Ground({ scene }: { scene: Scene }) {
  const c = scene.court
  const mid = c.y + c.h / 2
  const lw = Math.max(0.35, c.w * 0.012)
  return (
    <g>
      <rect width={scene.w} height={scene.h} fill="#cfe8a9" />
      {[
        [8, 10],
        [scene.w - 9, scene.h * 0.18],
        [10, scene.h - 12],
        [scene.w - 10, scene.h - 9],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={6} fill="#a9d47a" />
      ))}
      <rect x={c.x - 2} y={c.y - 2} width={c.w + 4} height={c.h + 4} rx={1.5} fill="#1f4fb0" />
      <rect x={c.x} y={c.y} width={c.w} height={c.h} fill="#2f6fe4" stroke="#fff" strokeWidth={lw} />
      <rect x={c.x} y={mid - c.k} width={c.w} height={c.k * 2} fill={scene.kitchenColor} stroke="#fff" strokeWidth={lw} />
      <line x1={c.x + c.w / 2} y1={c.y} x2={c.x + c.w / 2} y2={mid - c.k} stroke="#fff" strokeWidth={lw} />
      <line x1={c.x + c.w / 2} y1={mid + c.k} x2={c.x + c.w / 2} y2={c.y + c.h} stroke="#fff" strokeWidth={lw} />
      {scene.net && (
        <g>
          <line x1={c.x - 2.5} y1={mid} x2={c.x + c.w + 2.5} y2={mid} stroke={INK} strokeWidth={lw * 2.6} strokeLinecap="round" />
          <circle cx={c.x - 2.5} cy={mid} r={lw * 2} fill={INK} />
          <circle cx={c.x + c.w + 2.5} cy={mid} r={lw * 2} fill={INK} />
        </g>
      )}
    </g>
  )
}

export interface SceneSvgProps {
  scene: Scene
  /** 人をタップ（さがせ！ピクルくん） */
  onPerson?: (id: string) => void
  /** まちがいの丸をタップ（まちがいさがし） */
  diffs?: Diff[]
  found?: Set<string>
  onDiff?: (id: string) => void
  /** なにもない所をタップ */
  onMiss?: () => void
  /** 見つけた人を丸でかこむ（ほかの人は うすくする） */
  ring?: string | null
  /** まちがえて押した人（うすくする） */
  missed?: Set<string>
  /** いま まちがえて押した人（ちがう所に 丸を つける） */
  miss?: string | null
  /** ヒントの丸 */
  hint?: Pick<Diff, 'x' | 'y' | 'r'> | null
  disabled?: boolean
  testId?: string
  /** 指で ひろげて 大きく・なぞって 動かせる（ステージ）。タップは 指を はなしたときに きめる */
  zoomable?: boolean
}

/** 大きくできる 上限（ばい） */
const MAX_ZOOM = 5
interface View {
  x: number
  y: number
  w: number
  h: number
}

export function SceneSvg({ scene, onPerson, diffs = [], found, onDiff, onMiss, ring, missed, miss, hint, disabled = false, testId, zoomable = false }: SceneSvgProps) {
  const full: View = { x: 0, y: 0, w: scene.w, h: scene.h }
  const [view, setView] = useState<View>(full)
  const svgRef = useRef<SVGSVGElement>(null)
  // 指の動き（1本＝動かす／2本＝ひろげる）。動かしたら タップに しない
  const gesture = useRef<{ pts: Map<number, { x: number; y: number }>; start?: { x: number; y: number; view: View; dist?: number; mid?: { x: number; y: number } }; moved: boolean; target: string | null }>({
    pts: new Map(),
    moved: false,
    target: null,
  })
  const clamp = (v: View): View => {
    const w = Math.min(scene.w, Math.max(scene.w / MAX_ZOOM, v.w))
    const h = (w * scene.h) / scene.w
    return { x: Math.min(scene.w - w, Math.max(0, v.x)), y: Math.min(scene.h - h, Math.max(0, v.y)), w, h }
  }
  /** 画面の1px が 絵の いくつか */
  const unit = () => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r || !r.width) return 0
    return Math.max(view.w / r.width, view.h / r.height)
  }
  /** 画面の点 → 絵の点 */
  const toScene = (cx: number, cy: number) => {
    const r = svgRef.current!.getBoundingClientRect()
    const u = unit()
    return { x: view.x + view.w / 2 + (cx - (r.left + r.width / 2)) * u, y: view.y + view.h / 2 + (cy - (r.top + r.height / 2)) * u }
  }
  const zoomAt = (p: { x: number; y: number }, base: View, factor: number) => {
    const w = base.w / factor
    const h = base.h / factor
    return clamp({ x: p.x - ((p.x - base.x) * w) / base.w, y: p.y - ((p.y - base.y) * h) / base.h, w, h })
  }
  // 見つけたら、ほんものを まんなかに大きく見せる（こたえあわせ）
  const ringFocus = ring ? scene.people.find((p) => p.id === ring) : undefined
  useEffect(() => {
    if (!zoomable || !ringFocus) return
    setView((v) => {
      const w = Math.min(v.w, scene.w / 2.5, Math.max(scene.w / MAX_ZOOM, ringFocus.s * 6))
      const h = (w * scene.h) / scene.w
      return clamp({ x: ringFocus.x - w / 2, y: ringFocus.y - h / 2, w, h })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomable, ringFocus?.id])

  const zoomBy = (factor: number) => setView((v) => zoomAt({ x: v.x + v.w / 2, y: v.y + v.h / 2 }, v, factor))
  const onDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    g.pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    try {
      // 絵の外まで指が出ても 動きを追う（つかめない指なら そのまま）
      ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    } catch {
      /* つかめなくても 動かせる */
    }
    if (g.pts.size === 1) {
      const el = e.target as Element
      g.target = el.closest('[data-person]')?.getAttribute('data-person') ?? el.getAttribute('data-hit')
      g.moved = false
      g.start = { x: e.clientX, y: e.clientY, view }
    } else if (g.pts.size === 2) {
      const [a, b] = [...g.pts.values()]
      g.moved = true
      g.start = { x: 0, y: 0, view, dist: Math.hypot(a.x - b.x, a.y - b.y), mid: toScene((a.x + b.x) / 2, (a.y + b.y) / 2) }
    }
  }
  const onMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    if (!g.pts.has(e.pointerId) || !g.start) return
    g.pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (g.pts.size === 1) {
      const dx = e.clientX - g.start.x
      const dy = e.clientY - g.start.y
      if (!g.moved && Math.hypot(dx, dy) < 10) return
      g.moved = true
      const u = unit()
      setView(clamp({ ...g.start.view, x: g.start.view.x - dx * u, y: g.start.view.y - dy * u }))
    } else if (g.pts.size === 2 && g.start.dist && g.start.mid) {
      const [a, b] = [...g.pts.values()]
      setView(zoomAt(g.start.mid, g.start.view, Math.hypot(a.x - b.x, a.y - b.y) / g.start.dist))
    }
  }
  const onUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const g = gesture.current
    if (!g.pts.has(e.pointerId)) return
    g.pts.delete(e.pointerId)
    if (g.pts.size > 0) {
      // 2本から1本に もどったら、そこから 動かしなおす
      const [rest] = [...g.pts.values()]
      g.start = { x: rest.x, y: rest.y, view }
      return
    }
    if (g.moved || disabled) return
    if (g.target && onPerson) onPerson(g.target)
    else onMiss?.()
  }
  const onWheel = (e: ReactWheelEvent<SVGSVGElement>) => setView((v) => zoomAt(toScene(e.clientX, e.clientY), v, e.deltaY < 0 ? 1.2 : 1 / 1.2))

  const tapPerson = (id: string) => (e: { stopPropagation: () => void }) => {
    if (zoomable || disabled || !onPerson) return
    e.stopPropagation()
    onPerson(id)
  }
  const dim = (id: string) => (ring && id !== ring ? 'sagasu-dim' : missed?.has(id) ? 'sagasu-missed' : undefined)
  // 奥（上）から順にかく
  const items = [
    ...scene.things.map((t) => ({ y: t.y, el: <g key={t.id} className={ring ? 'sagasu-dim' : undefined}><ThingFigure t={t} /></g> })),
    ...scene.people.map((p: Person) => ({
      y: p.y,
      el: (
        <g key={p.id} className={['sagasu-person', dim(p.id)].filter(Boolean).join(' ')} data-person={p.id} onPointerDown={tapPerson(p.id)}>
          <PersonFigure look={p.look} x={p.x} y={p.y} s={p.s} flip={p.flip} />
        </g>
      ),
    })),
  ].sort((a, b) => a.y - b.y)
  const ringP = ring ? scene.people.find((p) => p.id === ring) : undefined
  const missP = miss ? scene.people.find((p) => p.id === miss) : undefined
  const missPart = missP ? partOf(missP.look) : null
  const missSpot = missP && missPart ? partSpot(missPart, missP) : null
  // 丸い当たり（人）の上に、四角い当たり（キッチン・ネット）が かぶらないよう、四角を先に
  const open = diffs.filter((d) => !found?.has(d.id)).sort((a, b) => Number(!a.rect) - Number(!b.rect))
  const svg = (
    <svg
      ref={svgRef}
      className="sagasu-svg"
      viewBox={zoomable ? `${view.x} ${view.y} ${view.w} ${view.h}` : `0 0 ${scene.w} ${scene.h}`}
      preserveAspectRatio="xMidYMid meet"
      data-testid={testId}
      data-zoom={zoomable ? (scene.w / view.w).toFixed(2) : undefined}
      onPointerDown={
        zoomable
          ? onDown
          : () => {
              if (!disabled) onMiss?.()
            }
      }
      onPointerMove={zoomable ? onMove : undefined}
      onPointerUp={zoomable ? onUp : undefined}
      onPointerCancel={zoomable ? onUp : undefined}
      onWheel={zoomable ? onWheel : undefined}
    >
      <Ground scene={scene} />
      {/* 小さい子の指でも当たるよう、体より少し大きい当たり。見えている体より下に置くので、
          となりの人の当たりが 体の上に かぶらない（見えている人が いつも先に当たる） */}
      {onPerson &&
        scene.people.map((p) => (
          <rect key={`hit-${p.id}`} data-hit={p.id} x={p.x - p.s * 0.42} y={p.y - p.s * 0.7} width={p.s * 0.84} height={p.s * 1.3} fill="transparent" onPointerDown={tapPerson(p.id)} />
        ))}
      {items.map((x) => x.el)}
      {onDiff &&
        open.map((d) => {
          const tap = (e: { stopPropagation: () => void }) => {
            if (disabled) return
            e.stopPropagation()
            onDiff(d.id)
          }
          return d.rect ? (
            <rect key={d.id} x={d.rect.x} y={d.rect.y} width={d.rect.w} height={d.rect.h} fill="transparent" data-diff={d.id} onPointerDown={tap} />
          ) : (
            <circle key={d.id} cx={d.x} cy={d.y} r={d.r} fill="transparent" data-diff={d.id} onPointerDown={tap} />
          )
        })}
      {diffs
        .filter((d) => found?.has(d.id))
        .map((d) =>
          d.rect ? (
            <rect key={`f-${d.id}`} className="sagasu-found" x={d.rect.x} y={d.rect.y} width={d.rect.w} height={d.rect.h} rx={2} fill="none" stroke="#ff3d7f" strokeWidth={1.2} pointerEvents="none" />
          ) : (
            <circle key={`f-${d.id}`} className="sagasu-found" cx={d.x} cy={d.y} r={d.r} fill="none" stroke="#ff3d7f" strokeWidth={1.2} pointerEvents="none" />
          ),
        )}
      {hint && <circle className="sagasu-hint" cx={hint.x} cy={hint.y} r={hint.r * 1.8} fill="rgba(255,138,61,0.12)" stroke="#ff8a3d" strokeWidth={1} strokeDasharray="2 2" pointerEvents="none" />}
      {missSpot && (
        <g key={miss} className="sagasu-miss-mark" pointerEvents="none" data-testid="sagasu-miss-mark">
          <circle cx={missSpot.x} cy={missSpot.y} r={Math.max(2.2, missSpot.r)} fill="none" stroke="#ff8a3d" strokeWidth={Math.max(0.6, missP!.s * 0.06)} />
        </g>
      )}
      {ringP && (
        <g pointerEvents="none">
          <circle className="sagasu-ring" cx={ringP.x} cy={ringP.y} r={ringP.s * 0.85} fill="none" stroke="#ff3d7f" strokeWidth={Math.max(0.8, ringP.s * 0.08)} />
        </g>
      )}
    </svg>
  )
  if (!zoomable) return svg
  return (
    <div className="sagasu-zoom">
      {svg}
      <div className="sagasu-zoom-btns">
        <button className="btn btn-small" aria-label={t('おおきく')} onClick={() => zoomBy(1.6)} disabled={view.w <= scene.w / MAX_ZOOM + 0.01} data-testid="sagasu-zoom-in">
          ＋
        </button>
        <button className="btn btn-small" aria-label={t('ちいさく')} onClick={() => zoomBy(1 / 1.6)} disabled={view.w >= scene.w - 0.01} data-testid="sagasu-zoom-out">
          －
        </button>
      </div>
    </div>
  )
}

/** これが ほんもの！ のカード（人1人を大きく） */
export function TargetCard({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden>
      <rect width={40} height={40} rx={8} fill="#fff6e3" />
      <PersonFigure look={REAL} x={20} y={22} s={26} />
    </svg>
  )
}
