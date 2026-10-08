/** ホームの「きょうの ミッション」とスタンプ（遊んだ日）。読めない子のために読み上げボタンをつける */
import { ITEMS } from '../core/items'
import { BONUS_STARS, dayKey } from '../core/missions'
import { todayMissions, useProgress } from '../core/progress'
import { unlockAudio } from '../core/sound'
import { speak } from '../core/speak'
import { GameIcon } from '../ui/GameIcon'
import { Pikuru } from '../ui/Pikuru'
import { PHRASES } from '../core/voiceLines'
import { isEn, t } from '../i18n'

const WEEK = isEn ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど']

export function MissionCard() {
  const p = useProgress()
  const { defs, state } = todayMissions(p)
  const today = new Date()
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - today.getDay() + i)
    return { label: WEEK[i], key: dayKey(d), today: i === today.getDay() }
  })
  // 次の とくべつな ごほうび（スタンプ）
  const next = [
    { n: 7, item: ITEMS.find((i) => i.special === 'stamps7') },
    { n: 14, item: ITEMS.find((i) => i.special === 'stamps14') },
  ].find((x) => p.days.length < x.n)

  return (
    <section className="mission-card" aria-labelledby="mission-title" data-testid="missions">
      <div className="mission-head">
        <h2 id="mission-title">{t('きょうの ミッション')}</h2>
        <button
          className="btn btn-small mission-speak"
          aria-label={t('ミッションを よみあげる')}
          onClick={() => {
            unlockAudio()
            speak([PHRASES.missions, ...defs.map((d) => d.text), ...(defs.some((d) => d.together && !state.done[defs.indexOf(d)]) ? [PHRASES.missionSolo] : [])])
          }}
        >
          🗣️
        </button>
        <a className="star-pill" href="#/collection" aria-label={t('ほし {0}こ（きせかえへ）', [p.stars])} data-testid="home-stars">
          ⭐ {p.stars}
        </a>
      </div>
      <ul className="mission-list">
        {defs.map((d, i) => {
          const done = state.done[i]
          const v = Math.min(state.progress[i], d.need)
          return (
            <li key={d.id} data-done={done || undefined}>
              <span className="mission-check" aria-hidden>
                {done ? '✓' : ''}
              </span>
              {/* 字が読めなくても、どのゲームか 絵で分かるように */}
              <span className="mission-icon" aria-hidden>
                {d.game ? <GameIcon game={d.game} size={34} /> : <Pikuru face="ok" size={34} />}
              </span>
              <span className="mission-text">
                {d.text}
                {d.together && !done && (
                  <small className="mission-solo">
                    {t('ひとりなら')}{' '}<GameIcon game="pikuru" size={18} />{' '}{t('ピクルくんと')}{' '}<span className="nowrap">{t('ラリーでも OK')}</span>
                  </small>
                )}
              </span>
              <span className="mission-prog">{done ? '⭐+1' : d.need > 1 ? `${v}/${d.need}` : ''}</span>
            </li>
          )
        })}
      </ul>
      <p className="mission-bonus">{state.bonus ? t('ぜんぶ クリア！ ⭐+{0} もらったよ', [BONUS_STARS]) : t('3つ ぜんぶ クリアで ⭐+{0}', [BONUS_STARS])}</p>
      <div className="stamps" aria-label={t('スタンプ {0}こ', [p.days.length])}>
        {week.map((w) => (
          <span
            key={w.key}
            className="stamp"
            data-on={p.days.includes(w.key) || undefined}
            data-today={w.today || undefined}
            style={p.days.includes(w.key) ? { backgroundImage: `url(${import.meta.env.BASE_URL}pikuru/ok.png)` } : undefined}
          >
            <i aria-hidden>{p.days.includes(w.key) ? '' : w.label}</i>
          </span>
        ))}
        <span className="stamp-total">
          {t('スタンプ {0}こ', [p.days.length])}
          {next?.item && (
            <small>
              {t('あと {0}こで「{1}」', [next.n - p.days.length, next.item.label])}
            </small>
          )}
        </span>
      </div>
    </section>
  )
}
