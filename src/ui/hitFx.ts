/**
 * 打った強さを見せる絵（ラリー・エアピックルで共通）。座標はすべて画面の px。
 * 残像：強く打った球ほど長く濃く尾を引く。光：打った瞬間に強さに合わせた輪（強いときは飛び散る線も）。
 */

const BALL = '212, 240, 60'

/**
 * 残像。pts は古い順の球の位置、r は球の半径、k は濃さ（0〜1。0なら描かない）
 */
export function drawTrail(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], r: number, k: number): void {
  if (k <= 0 || pts.length < 2) return
  ctx.lineCap = 'round'
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    const u = i / (pts.length - 1)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.lineWidth = Math.max(1, r * 2 * u)
    ctx.strokeStyle = `rgba(${BALL}, ${(0.8 * k * u).toFixed(3)})`
    ctx.stroke()
  }
}

/**
 * 打った瞬間の光。u は進み具合（0＝打った瞬間〜1＝消える）、p は強さ（0〜1.4）、unit は大きさの基準（球の直径くらいの px）
 */
export function drawImpact(ctx: CanvasRenderingContext2D, x: number, y: number, unit: number, u: number, p: number): void {
  if (u < 0 || u >= 1) return
  const q = Math.min(Math.max(p, 0), 1.4)
  const r = (0.6 + (0.85 + 1.5 * q) * u) * unit
  const a = (1 - u) * (0.45 + 0.4 * Math.min(q, 1))
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.lineWidth = Math.max(2, (0.17 + 0.17 * q) * unit * (1 - u))
  ctx.strokeStyle = `rgba(255, 255, 255, ${a.toFixed(3)})`
  ctx.stroke()
  // 強く打ったときだけ、まわりに飛び散る線
  if (q < 0.7) return
  const r0 = r * 0.85
  const r1 = r * (1.15 + 0.3 * (q - 0.7))
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + 0.3
    ctx.moveTo(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0)
    ctx.lineTo(x + Math.cos(ang) * r1, y + Math.sin(ang) * r1)
  }
  ctx.lineWidth = Math.max(2, 0.17 * unit)
  ctx.strokeStyle = `rgba(${BALL}, ${a.toFixed(3)})`
  ctx.stroke()
}
