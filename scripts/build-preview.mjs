// Builds a single self-contained HTML file (JS + CSS inlined, hash routing) for hosted previews.
import { build } from 'vite'
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'

process.env.VITE_ROUTER = 'hash'
await build({
  logLevel: 'warn',
  build: {
    outDir: 'preview-dist',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
})
const dir = 'preview-dist/assets'
const files = readdirSync(dir)
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('\n')
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('\n')
const safeJs = js.replace(/<\/script/gi, '<\\/script')
const html = `<meta charset="utf-8">
<title>Revive Agent Prototype</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap">
<style>${css}</style>
<div id="root"></div>
<script type="module">${safeJs}</script>
`
mkdirSync('preview', { recursive: true })
writeFileSync('preview/revive-prototype.html', html)
console.log('preview/revive-prototype.html', (html.length / 1024).toFixed(0) + ' KB')

// The mobile prototype: the same app, opened on /m and kept there (src/mobile/mode.ts reads the flag).
const mobile = html
  .replace('<title>Revive Agent Prototype</title>', '<title>Revive Mobile Prototype</title>')
  .replace('<div id="root"></div>', `<script>window.reviveMobileApp = true; if (!location.hash.startsWith('#/m')) location.hash = '#/m'</script>\n<div id="root"></div>`)
writeFileSync('preview/revive-mobile.html', mobile)
console.log('preview/revive-mobile.html', (mobile.length / 1024).toFixed(0) + ' KB')
