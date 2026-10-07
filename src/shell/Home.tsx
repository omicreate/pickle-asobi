import { useEffect, useState } from 'react'
import { countOpen } from '../core/counter'
import { WELCOME_STARS } from '../core/items'
import { takeWelcome } from '../core/progress'
import { setSettings, useSettings } from '../core/settings'
import { unlockAudio } from '../core/sound'
import { speak } from '../core/speak'
import { PHRASES } from '../core/voiceLines'
import { Pikuru } from '../ui/Pikuru'
import { PikuruCut } from '../ui/pikuruArt'
import { GAMES } from './games'
import { MissionCard } from './MissionCard'
import { href } from './route'
import './home.css'

export function Home() {
  const settings = useSettings()
  const [welcome, setWelcome] = useState(false)

  useEffect(() => {
    countOpen()
    if (takeWelcome()) setWelcome(true)
  }, [])

  return (
    <main className="home">
      <header className="home-hero">
        <a className="home-pikuru" href="#/collection" aria-label="ピクルくんの きせかえ">
          <PikuruCut art="full" height={150} />
        </a>
        <div>
          <h1 className="home-title">
            ピクルくんと
            <br />
            あそぼ
          </h1>
          <p className="home-lead">ひとりでも ふたりでも みんなでも あそべるよ</p>
          <a className="btn btn-small home-dress" href="#/collection" onClick={unlockAudio}>
            👕 きせかえ
          </a>
        </div>
      </header>

      <MissionCard />

      {([2, 1] as const).map((n) => (
        <section key={n} className="game-section" aria-labelledby={`games-${n}`}>
          <h2 id={`games-${n}`} className="game-section-title">
            {n === 2 ? 'ふたりで あそぶ' : 'ひとりで あそぶ'}
          </h2>
          <ul className="game-list">
            {GAMES.filter((g) => g.players === n && !g.adult).map((g) => (
              <li key={g.id}>
                <a className="game-card" href={href('setup', g.id)} data-game={g.id} onClick={unlockAudio}>
                  <Pikuru face={g.face} size={72} />
                  <span className="game-text">
                    <span className="game-tag">{g.tag}</span>
                    <span className="game-title">{g.title}</span>
                    <span className="game-desc">{g.desc}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="game-section" aria-labelledby="games-adult">
        <h2 id="games-adult" className="game-section-title">
          おとなも むちゅう
        </h2>
        <p className="game-section-lead">かたてで サッと。けっかで もりあがる しょうぶ</p>
        <ul className="game-list">
          {GAMES.filter((g) => g.adult).map((g) => (
            <li key={g.id}>
              <a className="game-card game-card-adult" href={href('setup', g.id)} data-game={g.id} onClick={unlockAudio}>
                <Pikuru face={g.face} size={72} />
                <span className="game-text">
                  <span className="game-tag">{g.players === 2 ? `ふたり・${g.tag}` : g.tag}</span>
                  <span className="game-title">{g.title}</span>
                  <span className="game-desc">{g.desc}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="game-section" aria-labelledby="games-party">
        <h2 id="games-party" className="game-section-title">
          みんなで あそぶ
        </h2>
        <a className="game-card game-card-party" href="#/party" data-game="party" onClick={unlockAudio}>
          <Pikuru face="ok" size={72} />
          <span className="game-text">
            <span className="game-tag">2〜6にん</span>
            <span className="game-title">じゅんばんモード</span>
            <span className="game-desc">1だいを じゅんばんに まわして、きろくで しょうぶ！</span>
          </span>
        </a>
      </section>

      <section className="home-toggles" aria-label="せってい">
        <button className="toggle" aria-pressed={settings.sound} onClick={() => setSettings({ sound: !settings.sound })}>
          <span aria-hidden>{settings.sound ? '🔊' : '🔇'}</span> おと {settings.sound ? 'あり' : 'なし'}
        </button>
        <button className="toggle" aria-pressed={settings.speak} onClick={() => setSettings({ speak: !settings.speak })}>
          <span aria-hidden>{settings.speak ? '🗣️' : '🤐'}</span> よみあげ {settings.speak ? 'あり' : 'なし'}
        </button>
      </section>

      <a className="home-parents" href="#/parents" data-testid="parents-link">
        おうちの方へ（記録・集計・共有・あそびかた）
      </a>

      {welcome && (
        <div className="welcome-backdrop" onClick={() => setWelcome(false)}>
          <div className="welcome" role="dialog" aria-label="はじめての プレゼント" onClick={(e) => e.stopPropagation()}>
            <PikuruCut art="ok" height={120} />
            <p className="welcome-title">はじめての プレゼント！</p>
            <p className="welcome-stars">⭐ × {WELCOME_STARS}</p>
            <p className="welcome-sub">ほしで ピクルくんの こものや パドルと こうかん できるよ</p>
            <div className="welcome-actions">
              <button
                className="btn btn-small"
                aria-label="よみあげる"
                onClick={() => {
                  unlockAudio()
                  speak(PHRASES.welcome)
                }}
              >
                🗣️
              </button>
              <button className="btn btn-go" onClick={() => setWelcome(false)}>
                ありがとう！
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
