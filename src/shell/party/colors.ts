import { t } from '../../i18n'
/** じゅんばんモードの人の色と名前（名前は色。文字が読めなくても色で分かる） */
export const PARTY_COLORS = [
  { name: t('オレンジ'), color: '#ff8a3d' },
  { name: t('あお'), color: '#3d9be9' },
  { name: t('ピンク'), color: '#ff6fae' },
  { name: t('みどり'), color: '#4caf50' },
  { name: t('むらさき'), color: '#9b6bff' },
  { name: t('きいろ'), color: '#f5c400' },
] as const

export const MAX_PLAYERS = PARTY_COLORS.length

export const turnLine = (name: string) => t('{0}の ばん！', [name])
export const champLine = (name: string) => t('{0}の ゆうしょう！', [name])
export const nextGameLine = (title: string) => t('つぎは {0}！', [title])
export const teamWinLine = (name: string) => t('{0} チームの かち！', [name])
