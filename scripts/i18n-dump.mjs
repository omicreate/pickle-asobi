// 英語版の表づくりを手伝う：データの日本語の文を、決まった順に出す。
//   node scripts/i18n-dump.mjs <group> [--missing]   … group の文を番号つきで出す（--missing は英語の表に無いものだけ）
//   node scripts/i18n-dump.mjs <group> --write <英語の配列.json>  … 同じ順の英語を src/i18n/en/<group>.ts に書く
// group: games howto quiz nise gesture ishin misc
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const root = new URL('../', import.meta.url)
const path = (rel) => new URL(rel, root).pathname.replace(/^\/([A-Z]:)/, '$1')
const [group, flag, file] = process.argv.slice(2)

const server = await createServer({
  root: path(''),
  cacheDir: 'node_modules/.vite-voice',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  logLevel: 'error',
})
const load = (p) => server.ssrLoadModule(p)

const out = []
const add = (s) => {
  if (typeof s === 'string' && /[぀-ヿ一-鿿]/.test(s) && !out.includes(s)) out.push(s)
}

if (group === 'games') {
  const { GAMES } = await load('/src/shell/games.ts')
  for (const g of GAMES) [g.title, g.tag, g.desc, g.howto, g.unit].forEach(add)
} else if (group === 'howto') {
  const { HOWTO } = await load('/src/shell/howto.ts')
  for (const h of Object.values(HOWTO)) [...h.play, ...h.rules, ...h.levels, ...h.detail].forEach(add)
} else if (group === 'quiz') {
  const { QUESTIONS } = await load('/src/games/quiz/questions.ts')
  for (const q of QUESTIONS) [q.prompt, ...q.choices.map((c) => c.text), q.explain].forEach(add)
} else if (group === 'nise') {
  const { WORDS, DECK_INFO } = await load('/src/games/nise/words.ts')
  const { TALK_HINTS } = await load('/src/games/nise/nise.ts')
  for (const d of Object.values(DECK_INFO)) [d.label, d.hint].forEach(add)
  for (const ps of Object.values(WORDS)) for (const p of ps) [p.a.text, p.b.text, p.tip].forEach(add)
  for (const hs of Object.values(TALK_HINTS)) hs.forEach(add)
} else if (group === 'gesture') {
  const { CARDS, G_DECK_INFO } = await load('/src/games/gesture/gesture.ts')
  for (const d of Object.values(G_DECK_INFO)) [d.label, d.hint].forEach(add)
  for (const c of CARDS) [c.say, c.act, c.tip].forEach(add)
} else if (group === 'ishin') {
  const { I_QUESTIONS, I_DECK_INFO } = await load('/src/games/ishin/questions.ts')
  for (const d of Object.values(I_DECK_INFO)) [d.label, d.hint].forEach(add)
  for (const q of I_QUESTIONS) [q.prompt, ...q.choices.map((c) => c.text), q.tip].forEach(add)
} else if (group === 'misc') {
  const { ALL_MISSIONS } = await load('/src/core/missions.ts')
  ALL_MISSIONS.forEach((m) => add(m.text))
  const { ITEMS, SPECIAL_TEXT } = await load('/src/core/items.ts')
  ITEMS.forEach((i) => add(i.label))
  Object.values(SPECIAL_TEXT ?? {}).forEach(add)
  const { ACCESSORIES } = await load('/src/ui/accessories.ts')
  Object.values(ACCESSORIES).forEach((a) => add(a.label))
  const pa = await load('/src/ui/paddleArt.ts')
  Object.values(pa.DESIGNS).forEach((d) => add(d.label))
  Object.values(pa.SHAPES).forEach((d) => add(d.label))
  const { LEVEL_INFO } = await load('/src/core/players.ts')
  Object.values(LEVEL_INFO).forEach((l) => [l.label, l.hint].forEach(add))
  const { PHRASES } = await load('/src/core/voiceLines.ts')
  Object.values(PHRASES).forEach(add)
  const sr = await load('/src/games/serveread/serveread.ts')
  Object.values(sr.SPOT_LABEL).forEach(add)
  sr.TAUNTS.forEach(add)
  const sg = await load('/src/games/sagasu/sagasu.ts')
  Object.values(sg.ZONE_NAME).forEach(add)
  Object.values(sg.DIFF_LABEL).forEach(add)
  const { PARTY_COLORS } = await load('/src/shell/party/colors.ts')
  PARTY_COLORS.forEach((c) => add(c.name))
  const { TEAMS } = await load('/src/shell/party/scoring.ts')
  TEAMS.forEach((c) => add(c.name))
}
await server.close()

if (flag === '--write') {
  const en = JSON.parse(readFileSync(file, 'utf8'))
  if (en.length !== out.length) {
    console.error(`数が合いません：日本語 ${out.length}・英語 ${en.length}`)
    process.exit(1)
  }
  const esc = (s) => JSON.stringify(s)
  const body = out.map((ja, i) => `  ${esc(ja)}: ${esc(en[i])},`).join('\n')
  writeFileSync(path(`src/i18n/en/${group}.ts`), `// 英語の表（${group}）。scripts/i18n-dump.mjs で作った。日本語の文を直したら、ここも直す\nexport default {\n${body}\n} as Record<string, string>\n`)
  console.log(`src/i18n/en/${group}.ts：${out.length} 件`)
} else {
  let list = out.map((s, i) => [i, s])
  if (flag === '--missing') {
    const { EN } = await import(path('src/i18n/en/index.ts')).catch(() => ({ EN: {} }))
    list = list.filter(([, s]) => !(s in EN))
  }
  console.log(list.map(([i, s]) => `${i}\t${s}`).join('\n'))
  console.error(`${group}：${out.length} 件`)
}
