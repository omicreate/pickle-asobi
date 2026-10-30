/**
 * ピクルくん さがし。React に依存しない純粋な計算（場面づくり・ちがいづくり・場所の名前）。
 *
 * - さがせ！ピクルくん（ウォーリー型）：コートのある公園に、にせもののピクルくんがたくさん。ほんもの（ライムの はちまき・
 *   あたまの つる・めがね／ひげ／ぼうし なし・みどりの からだ）を1人さがす。見つけたら「キッチンに いたよ」と場所の名前を言う。
 * - まちがいさがし：上と下の絵で、ちがう所をさがす。
 * レベルで人数・ちがいの大きさが変わる（ちびっこは少なく、はっきり。せんしゅは多く、こまかく）。
 * 座標は横 w（=100）× 縦 h の論理単位。人は (x, y) が体の中心、s が高さ。
 */
import type { Level } from '../../core/players'
import { t } from '../../i18n'

export type Band = 'lime' | 'orange' | 'blue' | 'pink' | 'white' | 'yellow'
export type Hat = 'red' | 'blue'
export type Tone = 'green' | 'dark' | 'olive'

export interface Look {
  band: Band
  stem: boolean
  glasses: boolean
  mustache: boolean
  hat: Hat | null
  body: Tone
}

/** ほんもののピクルくん */
export const REAL: Look = { band: 'lime', stem: true, glasses: false, mustache: false, hat: null, body: 'green' }

export interface Person {
  id: string
  x: number
  y: number
  s: number
  look: Look
  flip: boolean
}

export type ThingKind = 'ball' | 'paddle' | 'cone' | 'bottle'

export interface Thing {
  id: string
  kind: ThingKind
  x: number
  y: number
  s: number
  color: string
  rot: number
}

export interface CourtBox {
  x: number
  y: number
  w: number
  h: number
  /** キッチンの奥行き（ネットから） */
  k: number
}

export interface Scene {
  w: number
  h: number
  court: CourtBox
  kitchenColor: string
  net: boolean
  people: Person[]
  things: Thing[]
}

export type Zone = 'kitchen' | 'service' | 'outside'
export const ZONE_NAME: Record<Zone, string> = { kitchen: t('キッチン'), service: t('サービスコート'), outside: t('コートの そと') }

export const KITCHEN_COLOR = '#ff7eb6'
export const BALL_COLORS = ['#d4f03c', '#ff8a3d', '#ffffff']
export const PADDLE_COLORS = ['#ff8a3d', '#3d9be9', '#ff6fae', '#9b6bff']
export const CONE_COLORS = ['#ff8a3d', '#f5c400']
export const BOTTLE_COLORS = ['#3d9be9', '#3dbe6b']
const colorsOf = (k: ThingKind) => (k === 'ball' ? BALL_COLORS : k === 'paddle' ? PADDLE_COLORS : k === 'cone' ? CONE_COLORS : BOTTLE_COLORS)

/** さがせ！ピクルくん：レベルごとの人数・大きさ・にせものの ちがいの数・ちがいに使う所 */
export const WALLY: Record<Level, { people: number; things: number; s: number; changes: number }> = {
  chibi: { people: 6, things: 4, s: 20, changes: 3 },
  kids: { people: 12, things: 7, s: 15, changes: 2 },
  otona: { people: 22, things: 12, s: 11.5, changes: 1 },
  senshu: { people: 32, things: 16, s: 10, changes: 1 },
}

/** まちがいさがし：レベルごとの人数・物の数・大きさ・ちがいの数 */
export const DIFF: Record<Level, { people: number; things: number; s: number; diffs: number }> = {
  chibi: { people: 3, things: 5, s: 20, diffs: 3 },
  kids: { people: 5, things: 7, s: 17, diffs: 5 },
  otona: { people: 7, things: 10, s: 15, diffs: 6 },
  senshu: { people: 9, things: 12, s: 13, diffs: 7 },
}

/** にせものに使う ちがい（レベルが上がるほど、まぎらわしい物がふえる） */
function variants(level: Level): { [K in keyof Look]?: Look[K][] } {
  const easy = level === 'chibi' || level === 'kids'
  return {
    band: easy ? ['orange', 'blue', 'pink'] : level === 'otona' ? ['orange', 'blue', 'pink', 'white'] : ['orange', 'blue', 'white', 'yellow'],
    // せんしゅの「yellow」は SceneSvg で だいだい寄りの黄色（ライムと見分けられる色）にする
    hat: ['red', 'blue'],
    glasses: [true],
    body: easy ? ['dark'] : ['dark', 'olive'],
    ...(easy ? {} : { mustache: [true], stem: [false] }),
  }
}

const pick = <T>(xs: readonly T[], rand: () => number): T => xs[Math.floor(rand() * xs.length)]

function shuffle<T>(xs: T[], rand: () => number): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** ほんものと ちがう所（絵の上で 丸を つける所） */
export type Part = 'hat' | 'glasses' | 'mustache' | 'band' | 'stem' | 'body'

/** にせものが ほんものと どこが ちがうか（いちばん目立つものから1つ） */
export function partOf(look: Look): Part | null {
  if (look.hat) return 'hat'
  if (look.glasses) return 'glasses'
  if (look.mustache) return 'mustache'
  if (look.band !== 'lime') return 'band'
  if (!look.stem) return 'stem'
  if (look.body !== 'green') return 'body'
  return null
}

const WHY: Record<Part, string> = {
  hat: t('ぼうしを かぶってるよ'),
  glasses: t('めがねを かけてるよ'),
  mustache: t('ひげが あるよ'),
  band: t('はちまきの いろが ちがうよ'),
  stem: t('あたまに つるが ないよ'),
  body: t('からだの いろが ちがうよ'),
}

/** まちがえて押したときに見せる文 */
export function whyNot(look: Look): string | null {
  const part = partOf(look)
  return part ? WHY[part] : null
}

/** ちがう所の まんなか（人の中心からの ずれ。s=高さで かける。flip は左右を逆に） */
export function partSpot(part: Part, p: Pick<Person, 'x' | 'y' | 's' | 'flip'>): { x: number; y: number; r: number } {
  const { x, y, s } = p
  const k = p.flip ? -1 : 1
  if (part === 'hat') return { x, y: y - s * 0.48, r: s * 0.42 }
  if (part === 'glasses') return { x, y: y + s * 0.05, r: s * 0.36 }
  if (part === 'mustache') return { x, y: y + s * 0.25, r: s * 0.3 }
  if (part === 'band') return { x, y: y - s * 0.18, r: s * 0.38 }
  if (part === 'stem') return { x: x + k * s * 0.1, y: y - s * 0.6, r: s * 0.25 }
  return { x, y, r: s * 0.62 }
}

export const sameLook = (a: Look, b: Look) =>
  a.band === b.band && a.stem === b.stem && a.glasses === b.glasses && a.mustache === b.mustache && a.hat === b.hat && a.body === b.body

/** にせものの見た目：ほんものから changes か所だけ変える */
export function decoyLook(level: Level, changes: number, rand: () => number): Look {
  const v = variants(level)
  const attrs = shuffle(Object.keys(v) as (keyof Look)[], rand).slice(0, Math.max(1, changes))
  const look: Look = { ...REAL }
  for (const a of attrs) (look as unknown as Record<string, unknown>)[a] = pick(v[a] as unknown[], rand)
  return look
}

/** コートの位置（縦長のコートを まんなかに。キッチンは 2.13m / 13.41m） */
export function courtBox(w: number, h: number): CourtBox {
  const ch = Math.min(h * 0.78, (w * 0.5) / 0.455)
  const cw = ch * 0.455
  return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch, k: ch * (2.13 / 13.41) }
}

/** 足もとが 線から m 以上はなれていれば その場所、線に近ければ null（見た目で まよう所に ほんものを置かない） */
export function clearZone(c: CourtBox, x: number, y: number, m: number): Zone | null {
  const z = zoneOf(c, x, y)
  const mid = c.y + c.h / 2
  const dx = Math.min(Math.abs(x - c.x), Math.abs(x - (c.x + c.w)))
  const dy = Math.min(...[c.y, c.y + c.h, mid - c.k, mid + c.k].map((l) => Math.abs(y - l)))
  // コートの中：横は左右の線から、縦は 線から はなす
  if (z !== 'outside') return dx >= m && dy >= m ? z : null
  // そと：コートの四角から m 以上
  const ox = Math.max(c.x - x, 0, x - (c.x + c.w))
  const oy = Math.max(c.y - y, 0, y - (c.y + c.h))
  return Math.hypot(ox, oy) >= m ? z : null
}

export function zoneOf(c: CourtBox, x: number, y: number): Zone {
  const inside = x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h
  if (!inside) return 'outside'
  return Math.abs(y - (c.y + c.h / 2)) <= c.k ? 'kitchen' : 'service'
}

/** 人の足もと（場所の名前はここで決める） */
export const feet = (p: Person) => ({ x: p.x, y: p.y + p.s * 0.5 })

interface Placed {
  x: number
  y: number
  r: number
}

function place(rand: () => number, w: number, h: number, s: number, placed: Placed[], minGap: number, ok?: (x: number, y: number) => boolean): { x: number; y: number } | null {
  for (let t = 0; t < 400; t++) {
    const x = s * 0.4 + rand() * (w - s * 0.8)
    const y = s * 0.7 + rand() * (h - s * 1.4)
    if (ok && !ok(x, y)) continue
    if (placed.every((p) => Math.hypot(p.x - x, p.y - y) >= (p.r + s * 0.5) * minGap)) return { x, y }
  }
  return null
}

function makeThing(id: string, rand: () => number, s: number): Omit<Thing, 'x' | 'y'> {
  const kind = pick<ThingKind>(['ball', 'ball', 'paddle', 'cone', 'bottle'], rand)
  return { id, kind, s: kind === 'ball' ? s * 0.4 : s * 0.62, color: pick(colorsOf(kind), rand), rot: Math.round(rand() * 360) }
}

export interface WallyRound {
  scene: Scene
  /** ほんものの id */
  target: string
  zone: Zone
}

/** さがせ！ピクルくん の場面。ほんものは まず決めた場所（キッチン・サービスコート・コートの そと）に置く */
export function makeWally(level: Level, w: number, h: number, rand: () => number = Math.random): WallyRound {
  const spec = WALLY[level]
  // 小さい画面（ふたりで遊ぶ半分）では、人を少し小さくする
  const s = spec.s * Math.min(1, Math.sqrt((w * h) / (100 * 150)) * 1.15)
  const court = courtBox(w, h)
  const zone = pick<Zone>(['kitchen', 'service', 'outside'], rand)
  const placed: Placed[] = []
  const people: Person[] = []
  // ほんものは 線から はなして置く（「キッチンに いたよ」と 見た目が くいちがわないように）
  const tp =
    place(rand, w, h, s, placed, 1, (x, y) => clearZone(court, x, y + s * 0.5, s * 0.4) === zone) ??
    place(rand, w, h, s, placed, 1, (x, y) => zoneOf(court, x, y + s * 0.5) === zone) ??
    place(rand, w, h, s, placed, 1)!
  people.push({ id: 'p0', x: tp.x, y: tp.y, s, look: { ...REAL }, flip: rand() < 0.5 })
  placed.push({ x: tp.x, y: tp.y, r: s * 0.75 })
  for (let i = 1; i < spec.people; i++) {
    const pos = place(rand, w, h, s, placed, 0.82)
    if (!pos) break
    let look = decoyLook(level, spec.changes, rand)
    while (sameLook(look, REAL)) look = decoyLook(level, spec.changes, rand)
    people.push({ id: `p${i}`, x: pos.x, y: pos.y, s, look, flip: rand() < 0.5 })
    placed.push({ x: pos.x, y: pos.y, r: s * 0.5 })
  }
  const things: Thing[] = []
  for (let i = 0; i < spec.things; i++) {
    const t = makeThing(`t${i}`, rand, s)
    const pos = place(rand, w, h, t.s, placed, 0.9)
    if (!pos) break
    things.push({ ...t, ...pos })
    placed.push({ x: pos.x, y: pos.y, r: t.s * 0.6 })
  }
  const real = people[0]
  return {
    scene: { w, h, court, kitchenColor: KITCHEN_COLOR, net: true, people: shuffle(people, rand), things },
    target: real.id,
    zone: zoneOf(court, feet(real).x, feet(real).y),
  }
}

// ---------------- まちがいさがし ----------------

export type DiffKind = 'band' | 'glasses' | 'stem' | 'hat' | 'remove' | 'color' | 'add' | 'kitchen' | 'net'

export interface Diff {
  id: string
  kind: DiffKind
  /** 当たりの丸（論理座標） */
  x: number
  y: number
  r: number
  /** 丸では かこめない ちがい（キッチン・ネット）は 四角で当たりにする */
  rect?: { x: number; y: number; w: number; h: number }
  /** 見つけたあとに出す名前 */
  label: string
}

export const DIFF_LABEL: Record<DiffKind, string> = {
  band: t('はちまきの いろ'),
  glasses: t('めがね'),
  stem: t('あたまの つる'),
  hat: t('ぼうし'),
  remove: t('なくなった もの'),
  color: t('ものの いろ'),
  add: t('ふえた ボール'),
  kitchen: t('キッチンの いろ'),
  net: t('ネット'),
}

export interface DiffRound {
  /** 上の絵（もと） */
  a: Scene
  /** 下の絵（ちがいあり） */
  b: Scene
  diffs: Diff[]
}

/** まちがいさがし：もとの絵を作り、ちがう所を diffs こ入れた絵を作る（同じ人・物に2つ入れない） */
export function makeDiff(level: Level, w: number, h: number, rand: () => number = Math.random): DiffRound {
  const spec = DIFF[level]
  const s = spec.s
  const court = courtBox(w, h)
  const placed: Placed[] = []
  const people: Person[] = []
  for (let i = 0; i < spec.people; i++) {
    const pos = place(rand, w, h, s, placed, 1)
    if (!pos) break
    // まちがいさがしの人は、ほんものの見た目に近い人も まぜる（ちがいを入れやすいように）
    const look = rand() < 0.5 ? { ...REAL } : decoyLook(level, 1, rand)
    people.push({ id: `p${i}`, x: pos.x, y: pos.y, s, look, flip: rand() < 0.5 })
    placed.push({ x: pos.x, y: pos.y, r: s * 0.6 })
  }
  const things: Thing[] = []
  for (let i = 0; i < spec.things; i++) {
    const t = makeThing(`t${i}`, rand, s)
    const pos = place(rand, w, h, t.s, placed, 1.1)
    if (!pos) break
    things.push({ ...t, ...pos })
    placed.push({ x: pos.x, y: pos.y, r: t.s * 0.6 })
  }
  const a: Scene = { w, h, court, kitchenColor: KITCHEN_COLOR, net: true, people, things }
  const b: Scene = { ...a, people: people.map((p) => ({ ...p, look: { ...p.look } })), things: things.map((t) => ({ ...t })) }

  const easy = level === 'chibi' || level === 'kids'
  const diffs: Diff[] = []
  const usedObj = new Set<string>()
  const minR = 7
  const add = (d: Omit<Diff, 'id' | 'label'>) => diffs.push({ ...d, id: `d${diffs.length}`, label: DIFF_LABEL[d.kind] })

  // 候補を まぜて、決めた数になるまで入れる
  type Cand = () => boolean
  const personCand = (kind: 'band' | 'glasses' | 'stem' | 'hat'): Cand => () => {
    const p = shuffle(b.people, rand).find((x) => !usedObj.has(x.id) && (kind !== 'stem' || (x.look.stem && !x.look.hat)) && (kind !== 'glasses' || !x.look.glasses) && (kind !== 'hat' || !x.look.hat))
    if (!p) return false
    usedObj.add(p.id)
    if (kind === 'band') p.look.band = pick((['orange', 'blue', 'pink', 'white', 'lime'] as Band[]).filter((c) => c !== p.look.band), rand)
    if (kind === 'glasses') p.look.glasses = true
    if (kind === 'stem') p.look.stem = false
    if (kind === 'hat') p.look.hat = pick<Hat>(['red', 'blue'], rand)
    const cy = kind === 'stem' || kind === 'hat' ? p.y - p.s * 0.45 : p.y - p.s * 0.1
    add({ kind, x: p.x, y: cy, r: Math.max(minR, p.s * 0.55) })
    return true
  }
  const thingCand = (kind: 'remove' | 'color'): Cand => () => {
    const t = shuffle(b.things, rand).find((x) => !usedObj.has(x.id))
    if (!t) return false
    usedObj.add(t.id)
    if (kind === 'remove') b.things = b.things.filter((x) => x.id !== t.id)
    else t.color = pick(colorsOf(t.kind).filter((c) => c !== t.color), rand)
    add({ kind, x: t.x, y: t.y, r: Math.max(minR, t.s * 0.9) })
    return true
  }
  const addCand: Cand = () => {
    const pos = place(rand, w, h, s * 0.4, placed, 1.2)
    if (!pos) return false
    b.things = [...b.things, { id: `added${diffs.length}`, kind: 'ball', x: pos.x, y: pos.y, s: s * 0.4, color: BALL_COLORS[0], rot: 0 }]
    placed.push({ x: pos.x, y: pos.y, r: s * 0.3 })
    add({ kind: 'add', x: pos.x, y: pos.y, r: minR })
    return true
  }
  const kitchenCand: Cand = () => {
    if (usedObj.has('kitchen')) return false
    usedObj.add('kitchen')
    b.kitchenColor = '#2f6fe4'
    // キッチンは ネットの両がわ。どちらを押しても当たり
    const mid = court.y + court.h / 2
    add({ kind: 'kitchen', x: court.x + court.w / 2, y: mid, r: Math.max(minR, court.k), rect: { x: court.x, y: mid - court.k, w: court.w, h: court.k * 2 } })
    return true
  }
  const netCand: Cand = () => {
    if (usedObj.has('net')) return false
    usedObj.add('net')
    b.net = false
    // ネットは はしから はしまで当たり（柱の所も）
    const mid = court.y + court.h / 2
    add({ kind: 'net', x: court.x + court.w / 2, y: mid, r: Math.max(minR, court.w * 0.35), rect: { x: court.x - 5, y: mid - 3.5, w: court.w + 10, h: 7 } })
    return true
  }
  const pool: Cand[] = [
    personCand('band'),
    personCand('glasses'),
    personCand('hat'),
    thingCand('remove'),
    thingCand('color'),
    addCand,
    ...(easy ? [kitchenCand, netCand, thingCand('remove')] : [personCand('stem'), personCand('band'), thingCand('color')]),
  ]
  let guard = 0
  while (diffs.length < spec.diffs && guard++ < 200) {
    const c = pick(pool, rand)
    c()
  }
  return { a, b, diffs }
}

/** タップした所が、まだ見つけていない ちがいの丸に入っているか（入っていれば その id） */
export function hitDiff(diffs: Diff[], found: Set<string>, x: number, y: number): string | null {
  let best: { id: string; d: number } | null = null
  for (const d of diffs) {
    if (found.has(d.id)) continue
    const inRect = d.rect && x >= d.rect.x && x <= d.rect.x + d.rect.w && y >= d.rect.y && y <= d.rect.y + d.rect.h
    const dist = inRect ? 0 : Math.hypot(d.x - x, d.y - y)
    if ((inRect || dist <= d.r) && (!best || dist < best.d)) best = { id: d.id, d: dist }
  }
  return best?.id ?? null
}

/** ひとりで遊ぶときの さがせ！ピクルくん の回数（じゅんばんモードは短め） */
export const WALLY_ROUNDS = 5
export const CONTEST_ROUNDS = 3
/** ちがう人をタップしたときに足す時間（ミリ秒）。ちびっこは足さない */
export const MISS_MS: Record<Level, number> = { chibi: 0, kids: 1000, otona: 2000, senshu: 3000 }
/** ヒントで足す時間（ミリ秒） */
export const HINT_MS = 10000
/** ヒントが使えるようになるまで（秒） */
export const HINT_AFTER = 15
/** ふたりで：先に何回みつけたら勝ちか */
export const DUEL_WIN = 3
