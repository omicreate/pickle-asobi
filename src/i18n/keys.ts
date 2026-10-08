/**
 * ソースの文字から、t('…') / tr('…')（i18n から読みこんだ t）の 1つめの文を集める。
 * 英語の表の もれさがし（scripts/i18n-keys.mjs）と、そのテスト（en.test.ts）で使う。
 */
export function keysIn(code: string): string[] {
  const names: string[] = []
  for (const m of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][./]*i18n['"]/g))
    for (const part of m[1].split(',')) {
      const [a, b] = part.trim().split(/\s+as\s+/)
      if (a === 't') names.push(b ?? a)
    }
  if (!names.length) return []
  const bq = '`'
  const re = new RegExp(
    String.raw`(?<![\w.$])(?:${names.join('|')})\(\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|` + bq + String.raw`((?:\\.|[^` + bq + String.raw`\\$])*)` + bq + ')',
    'g',
  )
  const un = (x: string) => x.replace(/\\(.)/g, (_, c: string) => (c === 'n' ? '\n' : c))
  return [...code.matchAll(re)].map((m) => un(m[1] ?? m[2] ?? m[3]))
}

/** 文の中の {0}・{name} を並べたもの（日本語と英語で そろっているかを見る） */
export const holes = (s: string) => [...s.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort()
