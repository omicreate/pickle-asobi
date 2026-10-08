// 英語の表をまとめる（日本語の文 → 英語の文）。データの文は scripts/i18n-dump.mjs、画面の文は ui.ts（もれは scripts/i18n-keys.mjs で さがす）
import games from './games'
import howto from './howto'
import quiz from './quiz'
import nise from './nise'
import gesture from './gesture'
import ishin from './ishin'
import misc from './misc'
import ui from './ui'

export const EN: Record<string, string> = { ...games, ...howto, ...quiz, ...nise, ...gesture, ...ishin, ...misc, ...ui }
