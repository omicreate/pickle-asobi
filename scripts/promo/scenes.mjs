// SNS の紹介（リール動画・画像）の台本。日本語版と英語版。
// say は読み上げ用（日本語はかなで読みを固定）、title・sub は画面の文字。phones は scripts/promo/shots.mjs で撮った画面の名前。
// 数や説明は アプリの中身と合わせる（ミニゲームの数は src/shell/games.ts の GAMES から数える）。
import { readFileSync } from 'node:fs'

// games.ts は i18n を読むので node から import できない。GAMES の中の id: を数える（src/shell/promo.test.ts で GAMES.length と合わせて確かめる）
const gamesSrc = readFileSync(new URL('../../src/shell/games.ts', import.meta.url), 'utf8')
export const GAME_COUNT = gamesSrc.slice(gamesSrc.indexOf('export const GAMES')).match(/^ {4}id: '/gm)?.length ?? 0
if (!GAME_COUNT) throw new Error('src/shell/games.ts の GAMES が 読めない')

// 読み上げ用の本数（10〜99）。日本語は「にじゅう さんぼん」と区切る（続けると声が かすれる）
const JA_TENS = ['', 'じゅう', 'にじゅう', 'さんじゅう', 'よんじゅう', 'ごじゅう', 'ろくじゅう', 'ななじゅう', 'はちじゅう', 'きゅうじゅう']
const JA_HON = ['', 'いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん']
const EN_TENS = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const EN_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const EN_TEENS = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
function split(n) {
  if (!Number.isInteger(n) || n < 10 || n > 99) throw new Error(`読み上げの本数は 10〜99 まで（${n}）`)
  return [Math.floor(n / 10), n % 10]
}
export function jaHon(n) {
  const [t, o] = split(n)
  return o ? `${JA_TENS[t]} ${JA_HON[o]}` : `${JA_TENS[t].replace(/う$/, '')}っぽん`
}
export function enCount(n) {
  const [t, o] = split(n)
  return t === 1 ? EN_TEENS[o] : o ? `${EN_TENS[t]}-${EN_ONES[o]}` : EN_TENS[t]
}

export const PROMO = {
  ja: {
    brand: 'ピクルくんとあそぼ',
    handle: '@pickleballiq_jp',
    near: 'むこうの人',
    far: 'てまえの人',
    scenes: [
      {
        id: 'hook',
        layout: 'one',
        title: 'スマホ1台で\n親子ピックルボール！',
        sub: 'ピクルくんとあそぼ',
        phones: ['home'],
        say: 'スマホ いちだいで、おやこで ピックルボール！',
        min: 2.8,
      },
      {
        id: 'face',
        layout: 'face',
        title: '机に置いて 向かい合い\n同時タッチで たいけつ',
        phones: ['tug'],
        say: 'つくえに おいて、むかいあって たいけつ！',
        min: 2.8,
      },
      {
        id: 'level',
        layout: 'one',
        title: 'レベルは 1人ずつ',
        sub: '子どもは 球がゆっくり・パドルが大きい\n親子でも 本気で勝負できる',
        phones: ['setup'],
        say: 'レベルは ひとりずつ。おやこでも ほんきで しょうぶ！',
        min: 3,
      },
      {
        id: 'solo',
        layout: 'two',
        title: 'ひとりでも みんなでも',
        sub: 'ピクルくん さがし・にせピクルくんは だれだ？ など',
        phones: ['sagasu', 'nise'],
        say: 'ひとりでも、みんなでも あそべるよ。',
        min: 2.8,
      },
      {
        id: 'rules',
        layout: 'two',
        title: 'ルールも 遊びながら',
        sub: '公式ルールにもとづいた クイズ・ラインジャッジ',
        phones: ['quiz', 'line'],
        say: 'こうしきルールの クイズも あるよ。',
        min: 2.8,
      },
      {
        id: 'grid',
        layout: 'grid',
        title: `ミニゲーム ${GAME_COUNT}本`,
        chips: ['無料', 'インストール不要', '電波がなくてもOK', '広告なし', '英語版も！'],
        say: `ミニゲームが ${jaHon(GAME_COUNT)}。むりょうで、えいごばんも できたよ！`,
        min: 3.6,
      },
      {
        id: 'outro',
        layout: 'end',
        title: 'ピクルくんとあそぼ',
        sub: 'プロフィールの リンクから',
        say: 'プロフィールの リンクから あそぼう！',
        min: 3,
      },
    ],
    // 画像（1080×1350）
    stills: {
      hero: {
        kicker: '親子・なかまで 1台を かこんで',
        title: 'スマホ1台で\n親子ピックルボール',
        chips: ['無料', 'インストール不要', '電波がなくてもOK', '日本語 / English'],
        foot: 'プロフィールの リンクから',
      },
      ways: {
        title: '遊び方は 3つ',
        items: [
          { shot: 'tug', head: 'むかいあう', body: '机に置いて 2人で\n上と下から 同時に' },
          { shot: 'sagasu', head: 'ひとりで', body: 'ジャンプ・さがし・\nピクルくんとラリー' },
          { shot: 'nise', head: 'みんなで', body: '1台を てわたしして\n2〜6人で' },
        ],
        foot: 'ゲームによって 遊び方を 選べます',
      },
      levels: {
        title: 'レベルは 1人ずつ',
        sub: 'ちびっこ・キッズ・おとな・せんしゅ\n子どもは 球がゆっくり・パドルが大きい',
        grid: `ミニゲーム ${GAME_COUNT}本`,
        rule: 'ルールは USA Pickleball 公式ルールブックにもとづいています',
        foot: '英語の端末なら 英語で ひらきます',
      },
    },
  },
  en: {
    brand: 'Play with Pikuru',
    handle: '@pickleballiq_jp',
    near: 'Player 2',
    far: 'Player 1',
    scenes: [
      {
        id: 'hook',
        layout: 'one',
        title: 'One phone.\nPickleball fun\nfor the whole family!',
        sub: 'Play with Pikuru',
        phones: ['home'],
        say: 'One phone. Pickleball fun for the whole family!',
        min: 2.8,
      },
      {
        id: 'face',
        layout: 'face',
        title: 'Set it on the table.\nFace off and tap together!',
        phones: ['tug'],
        say: 'Set it on the table and face off!',
        min: 2.8,
      },
      {
        id: 'level',
        layout: 'one',
        title: 'Everyone picks\ntheir own level',
        sub: 'Slower balls and bigger paddles for kids,\nso parents and kids can play for real',
        phones: ['setup'],
        say: 'Everyone picks their own level. Kids versus grown-ups, for real!',
        min: 3,
      },
      {
        id: 'solo',
        layout: 'two',
        title: 'Play solo or with everyone',
        sub: "Find Pikuru, Who's the Fake Pikuru? and more",
        phones: ['sagasu', 'nise'],
        say: 'Play solo, or pass it around with friends.',
        min: 2.8,
      },
      {
        id: 'rules',
        layout: 'two',
        title: 'Learn the rules\nas you play',
        sub: 'Quizzes and line calls based on the official rulebook',
        phones: ['quiz', 'line'],
        say: 'Rules quizzes, based on the official rulebook.',
        min: 2.8,
      },
      {
        id: 'grid',
        layout: 'grid',
        title: `${GAME_COUNT} mini-games`,
        chips: ['Free', 'No install', 'Works offline', 'No ads', 'English & Japanese'],
        say: `${enCount(GAME_COUNT)} mini-games. Free, no ads, works offline.`,
        min: 3.6,
      },
      {
        id: 'outro',
        layout: 'end',
        title: 'Play with Pikuru',
        sub: 'Link in bio',
        say: "Link in bio. Let's play!",
        min: 3,
      },
    ],
    stills: {
      hero: {
        kicker: 'Gather around one phone',
        title: 'Pickleball fun\nfor the whole family',
        chips: ['Free', 'No install', 'Works offline', 'English & Japanese'],
        foot: 'Link in bio',
      },
      ways: {
        title: '3 ways to play',
        items: [
          { shot: 'tug', head: 'Face to face', body: 'Two players tap from\nboth ends at once' },
          { shot: 'sagasu', head: 'Solo', body: 'Jump, Find Pikuru,\nrally with Pikuru' },
          { shot: 'nise', head: 'Together', body: 'Pass one phone around,\n2 to 6 players' },
        ],
        foot: 'Some games let you pick how to play',
      },
      levels: {
        title: 'Everyone picks\ntheir own level',
        sub: 'Tiny, Kids, Adult, Player\nSlower balls and bigger paddles for kids',
        grid: `${GAME_COUNT} mini-games`,
        rule: 'Rules based on the USA Pickleball Official Rulebook',
        foot: 'Opens in English on English-language phones',
      },
    },
  },
}
