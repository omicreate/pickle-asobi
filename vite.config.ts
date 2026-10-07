import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import site from './site.config.json'

/**
 * 匿名の回数集計（src/core/counter.ts）の送り先だけを、CSP の connect-src に足す。
 * site.config.json の counterOrigin が空のあいだは、今までどおり外へは何も通さない。
 */
function counterCsp(): Plugin {
  return {
    name: 'counter-csp',
    transformIndexHtml(html) {
      if (!site.counterOrigin) return html
      const origin = new URL(site.counterOrigin).origin
      return html.replace("connect-src 'self'", `connect-src 'self' ${origin}`)
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
