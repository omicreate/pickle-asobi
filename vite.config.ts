import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import site from './site.config.json'

/**
 * 匿名の回数集計（src/core/counter.ts）の送り先だけを、CSP の connect-src に足す。
 * Google Apps Script の受け口は script.googleusercontent.com へ転送して返すので、そちらも足す。
 * site.config.json の counterUrl が空のあいだは、今までどおり外へは何も通さない。
 */
function counterCsp(): Plugin {
  return {
    name: 'counter-csp',
    transformIndexHtml(html) {
      if (!site.counterUrl) return html
      const origin = new URL(site.counterUrl).origin
      const extra = origin === 'https://script.google.com' ? ' https://script.googleusercontent.com' : ''
      return html.replace("connect-src 'self'", `connect-src 'self' ${origin}${extra}`)
    },
  }
}

export default defineConfig({
  // GitHub Pages（https://omicreate.github.io/pickle-asobi/）配信のためのベースパス
  base: '/pickle-asobi/',
  plugins: [react(), counterCsp()],
  test: {
    environment: 'node',
    // e2e/ は Playwright（npm run test:e2e）で動かす
    include: ['src/**/*.test.ts'],
  },
})
