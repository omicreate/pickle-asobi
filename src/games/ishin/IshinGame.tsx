/**
 * いしんでんしん ダブルス（2人・4人）の画面。
 * 遊び方は2つ：てわたし（1台を回して1人ずつ こっそり選ぶ）／むかいあう（2人のとき。机に置いて上下で同時に選ぶ）。
 * しつもん → こっそり選ぶ → 発表（同じなら いしんでんしん）→ …… → けっか。
 * 正解はない。そろわなかったら「どうして それに した？」と話すきっかけにする（ダブルスの声かけの練習）。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { countFinish, countGame } from '../../core/counter'
import { breakDue, oneMore, tookBreak } from '../../core/playtime'
import type { Side } from '../../core/players'
import { getProgress, recordPlay, recordStart } from '../../core/progress'
import type { Reward } from '../../core/progress'
import { sfx, unlockAudio } from '../../core/sound'
import { speak, stopSpeaking } from '../../core/speak'
import { Both, Half, Stage } from '../../core/Stage'
import { load, save } from '../../core/storage'
import { usePlayClock } from '../../core/usePlayClock'
import { PHRASES } from '../../core/voiceLines'
import { useWakeLock } from '../../core/wakelock'
import { PARTY_COLORS, turnLine } from '../../shell/party/colors'
import { TEAMS } from '../../shell/party/scoring'
import { BreakSheet } from '../../ui/BreakSheet'
import { RewardList } from '../../ui/GameUI'
import { Handoff } from '../../ui/Handoff'
import { HowToSheet } from '../../ui/HowToSheet'
import { PikuruCut } from '../../ui/pikuruArt'
import { ShareSheet } from '../../ui/ShareSheet'
import { NisePic } from '../nise/pics'
import { Pic } from '../quiz/pics'
import { I_COUNTS, I_SIZES, isMatch, pairScores, pairsFor, passOrder, pickQuestions, rating } from './ishin'
import type { ISize } from './ishin'
import { I_DECK_INFO, I_DECKS } from './questions'
import type { IChoice, IDeck, IQuestion } from './questions'
import '../../shell/setup.css'
import '../../shell/party/party.css'
import '../nise/nise.css'
import './ishin.css'
import { t } from '../../i18n'

type Phase = 'setup' | 'ask' | 'pass' | 'pick' | 'face' | 'reveal' | 'final'
type Style = 'face' | 'pass'
type Picks = (number | undefined)[]

interface SavedSetup {
  size: ISize
  style: Style
  deck: IDeck
  n: number
}

const players = (size: ISize) => PARTY_COLORS.slice(0, size)

/** 選択肢の絵（絵・色・文字だけ） */
function ChoicePic({ c, size }: { c: IChoice; size: number }) {
  if (c.pic) return <NisePic id={c.pic} size={size} />
  if (c.qpic)
    return (
      <span className="nise-pic" style={{ width: size, height: size }}>
        <Pic id={c.qpic} />
      </span>
    )
  if (c.swatch) return <span className="ishin-swatch" style={{ background: c.swatch, width: size * 0.7, height: size * 0.7 }} />
  return null
}

/** 選択肢のボタン（2列） */
function ChoiceGrid({ q, value, onPick, testPrefix }: { q: IQuestion; value: number | null | undefined; onPick: (i: number) => void; testPrefix: string }) {
  const pics = q.choices.some((c) => c.pic || c.qpic || c.swatch)
  return (
    <div className="ishin-choices" data-pics={pics || undefined}>
      {q.choices.map((c, i) => (
        <button key={c.text} className="ishin-choice" aria-pressed={value === i} onClick={() => onPick(i)} data-testid={`${testPrefix}-${i}`}>
          {pics && <ChoicePic c={c} size={64} />}
          <span>{c.text}</span>
        </button>
      ))}
    </div>
  )
}

/** 1人の答え（色のチップと選んだもの） */
function Answer({ who, q, pick, small = false }: { who: number; q: IQuestion; pick: number | undefined; small?: boolean }) {
  const p = PARTY_COLORS[who]
  const c = pick === undefined ? undefined : q.choices[pick]
  return (
    <div className="ishin-answer" style={{ borderColor: p.color }}>
      <span className="party-chip" style={{ background: p.color }}>
        {p.name}
      </span>
      {c && <ChoicePic c={c} size={small ? 44 : 64} />}
      <b>{c?.text ?? '—'}</b>
    </div>
  )
}

/** 発表の中身（てわたしは1枚のカード、むかいあうは上下それぞれに） */
function RevealBody({ q, picks, size, small = false }: { q: IQuestion; picks: Picks; size: ISize; small?: boolean }) {
  const pairs = pairsFor(size)
  return (
    <div className="ishin-reveal">
      <p className="ishin-prompt ishin-prompt-small">{q.prompt}</p>
      {pairs.map((pr, k) => {
        const ok = isMatch(picks, pr)
        return (
          <div key={k} className="ishin-pair" data-match={ok || undefined}>
            {size === 4 && (
              <span className="party-team" style={{ background: TEAMS[k].color }}>
                {TEAMS[k].name}
              </span>
            )}
            <div className="ishin-pair-answers">
              <Answer who={pr[0]} q={q} pick={picks[pr[0]]} small={small} />
              <Answer who={pr[1]} q={q} pick={picks[pr[1]]} small={small} />
            </div>
            <p className="ishin-verdict" data-testid="ishin-verdict">
              {ok ? t('いしんでんしん！ +1') : t('おしい！')}
            </p>
          </div>
        )
      })}
      {q.tip ? (
        <div className="nise-tip">
          <b>{t('まめちしき')}</b>
          <p>{q.tip}</p>
        </div>
      ) : (
        pairs.some((pr) => !isMatch(picks, pr)) && <p className="party-note">{t('どうして それに したか、はなしてみよう。')}</p>
      )}
    </div>
  )
}

export function IshinGame() {
  useWakeLock()
  const saved = useMemo(() => load<SavedSetup>('ishin-setup', { size: 2, style: 'face', deck: 'e', n: 5 }), [])
  const [size, setSize] = useState<ISize>(I_SIZES.includes(saved.size) ? saved.size : 2)
  const [style, setStyle] = useState<Style>(saved.style === 'pass' ? 'pass' : 'face')
  const [deck, setDeck] = useState<IDeck>(I_DECKS.includes(saved.deck) ? saved.deck : 'e')
  const [n, setN] = useState(I_COUNTS.includes(saved.n) ? saved.n : 5)
  const [phase, setPhase] = useState<Phase>('setup')
  const [qs, setQs] = useState<IQuestion[]>([])
  const [qi, setQi] = useState(0)
  const [picks, setPicks] = useState<Picks>([])
  const [history, setHistory] = useState<Picks[]>([])
  /** てわたしの何番め */
  const [step, setStep] = useState(0)
  /** てわたし：いまの人が選んでいる（まだ きめていない）答え */
  const [sel, setSel] = useState<number | null>(null)
  const [help, setHelp] = useState(false)
  const [rest, setRest] = useState(false)
  const [share, setShare] = useState(false)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [best, setBest] = useState<Record<string, number>>(() => load('ishin-best', {}))
  const [newBest, setNewBest] = useState(false)
  const used = useRef(new Set<string>())
  const revealTimer = useRef(0)

  /** 4人は てわたしだけ */
  const mode: Style = size === 4 ? 'pass' : style
  const order = passOrder(size)
  const ps = players(size)
  const q = qs[qi]
  const bestKey = `${deck}-${n}`
  const clock = usePlayClock(phase === 'setup' || help || rest)

  useEffect(() => save('ishin-setup', { size, style, deck, n }), [size, style, deck, n])
  useEffect(
    () => () => {
      stopSpeaking()
      window.clearTimeout(revealTimer.current)
    },
    [],
  )

  const startQuestion = (list: IQuestion[], i: number) => {
    setQi(i)
    setPicks(Array(size).fill(undefined))
    setSel(null)
    setStep(0)
    setPhase(mode === 'face' ? 'face' : 'ask')
    speak(list[i].prompt)
  }

  const start = () => {
    unlockAudio()
    sfx.go()
    const list = pickQuestions(deck, n, Math.random, used.current)
    setQs(list)
    setHistory([])
    setRewards([])
    setNewBest(false)
    recordStart('ishin')
    countGame('ishin')
    startQuestion(list, 0)
  }

  const toReveal = (final: Picks) => {
    setHistory((h) => [...h, final])
    setPhase('reveal')
    const any = pairsFor(size).some((pr) => isMatch(final, pr))
    if (any) {
      sfx.ok()
      speak(PHRASES.ishinMatch)
    } else {
      sfx.tick()
      speak(PHRASES.ishinMiss)
    }
  }

  const next = () => {
    sfx.tick()
    if (qi + 1 < qs.length) startQuestion(qs, qi + 1)
    else toFinal()
  }

  const toFinal = () => {
    const scores = pairScores(history, size)
    if (size === 2) {
      const prev = best[bestKey]
      if (prev === undefined || scores[0] > prev) {
        const b = { ...best, [bestKey]: scores[0] }
        setBest(b)
        save('ishin-best', b)
        setNewBest(prev !== undefined)
      }
    }
    setRewards(recordPlay({ type: 'finish', game: 'ishin', value: size === 2 ? scores[0] : undefined, two: true }))
    // val：2人＝そろった数、4人＝なし
    countFinish('ishin', { sec: clock.current, val: size === 2 ? scores[0] : undefined })
    clock.current = 0
    sfx.fanfare()
    speak(PHRASES.ishinEnd)
    setPhase('final')
    if (breakDue()) setRest(true)
  }

  /** むかいあう：選んだら すぐ決まる（選びなおしは できる）。2人そろったら少しまって発表 */
  const facePick = (side: Side, i: number | undefined) => {
    unlockAudio()
    sfx.tick()
    setPicks((cur) => {
      const nx = [...cur]
      nx[side] = i
      window.clearTimeout(revealTimer.current)
      if (nx[0] !== undefined && nx[1] !== undefined) revealTimer.current = window.setTimeout(() => toReveal(nx), 700)
      return nx
    })
  }

  // ---------- 準備 ----------
  if (phase === 'setup') {
    return (
      <main className="party ishin">
        <header className="party-head">
          <a className="btn btn-small" href="#/" aria-label={t('もどる')}>
            ←
          </a>
          <h1 className="party-title">{t('いしんでんしん ダブルス')}</h1>
        </header>
        <div className="party-intro">
          <PikuruCut art="ok" height={92} />
          <p>{t('おなじ しつもんに、ペアの ふたりが こっそり こたえるよ。おなじ こたえなら「いしんでんしん！」 せいかいは ないよ。')}</p>
          <button className="btn btn-small" aria-label={t('せつめいを よみあげる')} onClick={() => speak(PHRASES.ishinIntro)}>
            🗣️
          </button>
        </div>

        <h2 className="party-label">{t('なんにんで あそぶ？')}</h2>
        <div className="seg party-seg" role="radiogroup" aria-label={t('にんずう')}>
          {I_SIZES.map((s) => (
            <button key={s} role="radio" aria-checked={size === s} onClick={() => setSize(s)} data-testid={`ishin-size-${s}`}>
              {s === 2 ? t('2にん（ペアで きょうりょく）') : t('4にん（2ペアで たいせん）')}
            </button>
          ))}
        </div>
        <div className="ishin-teams">
          {pairsFor(size).map((pr, k) => (
            <span key={k} className="ishin-team">
              {size === 4 && (
                <span className="party-team" style={{ background: TEAMS[k].color }}>
                  {TEAMS[k].name}
                </span>
              )}
              {pr.map((i) => (
                <span key={i} className="party-chip" style={{ background: PARTY_COLORS[i].color }}>
                  {PARTY_COLORS[i].name}
                </span>
              ))}
            </span>
          ))}
        </div>

        <h2 className="party-label">{t('あそびかた')}</h2>
        {size === 2 ? (
          <>
            <div className="seg party-seg" role="radiogroup" aria-label={t('あそびかた')}>
              {(['face', 'pass'] as const).map((m) => (
                <button key={m} role="radio" aria-checked={style === m} onClick={() => setStyle(m)} data-testid={`ishin-style-${m}`}>
                  {m === 'face' ? t('むかいあう') : t('てわたし')}
                </button>
              ))}
            </div>
            <p className="party-note">
              {style === 'face' ? t('つくえに おいて、うえと したから いっせいに えらぶよ。あいての がめんは みないでね。') : t('1だいを わたしあって、ひとりずつ こっそり えらぶよ。')}
            </p>
          </>
        ) : (
          <p className="party-note">{t('4にんは てわたしで あそぶよ。じゅんばんは オレンジ → ピンク → あお → みどり。')}</p>
        )}

        <h2 className="party-label">{t('しつもん')}</h2>
        <div className="seg party-seg nise-decks" role="radiogroup" aria-label={t('しつもん')}>
          {I_DECKS.map((d) => (
            <button key={d} role="radio" aria-checked={deck === d} onClick={() => setDeck(d)} data-testid={`ishin-deck-${d}`}>
              <b>{I_DECK_INFO[d].label}</b>
              <small>{I_DECK_INFO[d].hint}</small>
            </button>
          ))}
        </div>

        <h2 className="party-label">{t('もんだいの かず')}</h2>
        <div className="seg party-seg" role="radiogroup" aria-label={t('もんだいの かず')}>
          {I_COUNTS.map((k) => (
            <button key={k} role="radio" aria-checked={n === k} onClick={() => setN(k)} data-testid={`ishin-n-${k}`}>
              {t('{0}もん', [k])}
            </button>
          ))}
        </div>
        {size === 2 && best[bestKey] !== undefined && (
          <p className="party-note">
            {t('じこベスト：{0}もん中 {1}もん そろった（{2}）', [n, best[bestKey], I_DECK_INFO[deck].label])}
          </p>
        )}

        <button className="btn solo-help" onClick={() => setHelp(true)}>
          {t('？ あそびかた・ルールを みる')}
        </button>
        <button className="btn btn-go party-start" onClick={start} data-testid="ishin-start">
          {t('はじめる！')}
        </button>
        {help && <HowToSheet game="ishin" onClose={() => setHelp(false)} fixed />}
      </main>
    )
  }

  // ---------- むかいあう（上下で同時に選ぶ・発表も上下に） ----------
  if ((phase === 'face' || (phase === 'reveal' && mode === 'face')) && q) {
    const final = history[history.length - 1]
    return (
      <Stage>
        <div className="ishin-stage">
          {phase === 'face' &&
            ([1, 0] as Side[]).map((side) => (
              <Half key={side} side={side} className="ishin-half">
                <div className="ishin-half-inner">
                  <header className="ishin-half-head">
                    <span className={`side-chip side-chip-${side}`}>{PARTY_COLORS[side].name}</span>
                    <span className="ishin-count">
                      {t('{0} / {1}もん', [qi + 1, qs.length])}
                    </span>
                  </header>
                  <p className="ishin-prompt">{q.prompt}</p>
                  {picks[side] === undefined ? (
                    <ChoiceGrid q={q} value={undefined} onPick={(i) => facePick(side, i)} testPrefix={`ishin-face-${side}`} />
                  ) : (
                    <div className="ishin-wait">
                      <PikuruCut art="think" height={72} />
                      <p>{t('えらんだ！ あいてを まってね')}</p>
                      <button className="btn btn-small" onClick={() => facePick(side, undefined)}>
                        {t('えらびなおす')}
                      </button>
                    </div>
                  )}
                </div>
              </Half>
            ))}
          {phase === 'reveal' && final && (
            <Both interactive className="ishin-half">
              {() => (
                <div className="ishin-half-inner">
                  <RevealBody q={q} picks={final} size={size} small />
                  <button className="btn btn-go" onClick={next} data-testid="ishin-next">
                    {qi + 1 < qs.length ? t('つぎの しつもん') : t('けっか')}
                  </button>
                </div>
              )}
            </Both>
          )}
        </div>
      </Stage>
    )
  }

  const scores = pairScores(history, size)
  const who = order[step]
  const p = ps[who]

  return (
    <main className="party ishin" data-phase={phase}>
      {phase === 'ask' && q && (
        <section className="party-card" data-testid="ishin-ask">
          <p className="party-round">
            {t('{0} / {1}もん', [qi + 1, qs.length])}
          </p>
          <p className="ishin-prompt">{q.prompt}</p>
          <ul className="ishin-preview">
            {q.choices.map((c) => (
              <li key={c.text}>
                <ChoicePic c={c} size={36} />
                {c.text}
              </li>
            ))}
          </ul>
          <div className="party-actions">
            <button className="btn btn-small" aria-label={t('しつもんを よみあげる')} onClick={() => speak(q.prompt)}>
              🗣️
            </button>
            <button
              className="btn btn-go"
              onClick={() => {
                sfx.tick()
                setStep(0)
                setPhase('pass')
                speak(turnLine(ps[order[0]].name))
              }}
              data-testid="ishin-go-pick"
            >
              {t('こっそり えらぶ')}
            </button>
          </div>
        </section>
      )}

      {phase === 'pass' && (
        <Handoff
          name={p.name}
          color={p.color}
          sub={t('{0} / {1}もん', [qi + 1, qs.length])}
          note={t('{0}の ひとに わたしてね。ほかの ひとは みないでね！', [p.name])}
          go={t('{0}だけで えらぶ（タッチ）', [p.name])}
          onGo={() => {
            unlockAudio()
            stopSpeaking()
            sfx.tick()
            setSel(null)
            setPhase('pick')
          }}
          testId="ishin-pass-go"
        />
      )}

      {phase === 'pick' && q && (
        <section className="party-card ishin-pick" style={{ borderColor: p.color }} data-testid="ishin-pick">
          <span className="party-chip party-chip-big" style={{ background: p.color }}>
            {p.name}
          </span>
          <p className="ishin-prompt">{q.prompt}</p>
          <ChoiceGrid
            q={q}
            value={sel}
            onPick={(i) => {
              sfx.tick()
              setSel(i)
            }}
            testPrefix="ishin-choice"
          />
          <button
            className="btn btn-go"
            disabled={sel === null}
            onClick={() => {
              if (sel === null) return
              const nx = [...picks]
              nx[who] = sel
              setPicks(nx)
              if (step + 1 < order.length) {
                sfx.tick()
                setStep(step + 1)
                setPhase('pass')
                speak(turnLine(ps[order[step + 1]].name))
              } else toReveal(nx)
            }}
            data-testid="ishin-decide"
          >
            {sel === null ? t('えらんでね') : t('これに きめた！')}
          </button>
        </section>
      )}

      {phase === 'reveal' && q && history.length > 0 && (
        <section className="party-card party-wide" data-testid="ishin-reveal">
          <p className="party-round">
            {t('{0} / {1}もん', [qi + 1, qs.length])}
          </p>
          <RevealBody q={q} picks={history[history.length - 1]} size={size} />
          <button className="btn btn-go" onClick={next} data-testid="ishin-next">
            {qi + 1 < qs.length ? t('つぎの しつもん') : t('けっか')}
          </button>
        </section>
      )}

      {phase === 'final' && (
        <section className="party-card party-wide" data-testid="ishin-final">
          <div className="nise-art">
            <PikuruCut art="ok" height={96} />
          </div>
          {size === 2 ? (
            <>
              <p className="party-round">{t('{0}もん中', [qs.length])}</p>
              <p className="party-value" data-testid="ishin-score">
                {scores[0]}
                <small>{t('もん そろった！')}</small>
              </p>
              <p className="ishin-rating">{rating(scores[0], qs.length)}</p>
              {newBest && <p className="party-top">{t('じこベスト こうしん！')}</p>}
            </>
          ) : (
            <>
              <h2 className="party-game" data-testid="ishin-winner">
                {scores[0] === scores[1] ? t('ひきわけ！') : t('チーム「{0}」の かち！', [TEAMS[scores[0] > scores[1] ? 0 : 1].name])}
              </h2>
              <div className="party-teams">
                {TEAMS.map((tm, k) => (
                  <div key={tm.name} className="party-team-total" style={{ borderColor: tm.color }}>
                    <span className="party-team" style={{ background: tm.color }}>
                      {tm.name}
                    </span>
                    <b>{t('{0}もん', [scores[k]])}</b>
                  </div>
                ))}
              </div>
            </>
          )}
          <ul className="ishin-history">
            {qs.map((qq, i) => (
              <li key={qq.id}>
                <span>{pairsFor(size).map((pr) => (history[i] && isMatch(history[i], pr) ? '⭕' : '➖')).join('')}</span>
                {qq.prompt}
              </li>
            ))}
          </ul>
          <RewardList rewards={rewards} />
          <div className="party-actions">
            <button className="btn btn-go" onClick={start} data-testid="ishin-again">
              {t('もういちど')}
            </button>
            <button className="btn" onClick={() => setPhase('setup')}>
              {t('にんずう・しつもんを かえる')}
            </button>
            <a className="btn" href="#/">
              {t('おわる')}
            </a>
            <button className="btn result-share" aria-label={t('きねんカード（おうちの人と いっしょに）')} onClick={() => setShare(true)} data-testid="share-btn">
              📸
            </button>
          </div>
        </section>
      )}

      {phase !== 'pass' && phase !== 'pick' && (
        <button className="btn btn-small nise-help" aria-label={t('あそびかた・ルール')} onClick={() => setHelp(true)}>
          ？
        </button>
      )}
      {help && <HowToSheet game="ishin" onClose={() => setHelp(false)} fixed />}
      {share && (
        <ShareSheet
          fixed
          card={{
            game: 'ishin',
            gameTitle: t('いしんでんしん ダブルス'),
            title: size === 2 ? t('{0}もん中 {1}もん そろった！', [qs.length, scores[0]]) : scores[0] === scores[1] ? t('ひきわけ！') : t('チーム「{0}」の かち！', [TEAMS[scores[0] > scores[1] ? 0 : 1].name]),
            sub: size === 2 ? rating(scores[0], qs.length) : t('2ペア たいせん・{0}', [I_DECK_INFO[deck].label]),
            face: 'ok',
            wear: getProgress().wear,
          }}
          onClose={() => setShare(false)}
        />
      )}
      {rest && (
        <BreakSheet
          single
          onRest={tookBreak}
          onMore={() => {
            oneMore()
            setRest(false)
          }}
        />
      )}
    </main>
  )
}
