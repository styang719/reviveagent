// Builds a single self-contained HTML file (JS + CSS inlined, hash routing) for hosted previews.
//   node scripts/build-preview.mjs           the agent prototype  → preview/revive-prototype.html
//   node scripts/build-preview.mjs flip360   the Flip360 map      → preview/flip360.html
import { build } from 'vite'
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'

const APPS = {
  main: { entry: 'index.html', out: 'preview/revive-prototype.html', title: 'Revive Agent Prototype' },
  flip360: { entry: 'flip360.html', out: 'preview/flip360.html', title: 'Revive Flip360 Map' },
}
const app = APPS[process.argv[2] ?? 'main']
if (!app) throw new Error(`Unknown app "${process.argv[2]}". Use one of: ${Object.keys(APPS).join(', ')}`)

process.env.VITE_ROUTER = 'hash'
await build({
  logLevel: 'warn',
  build: {
    outDir: 'preview-dist',
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rolldownOptions: { input: app.entry, output: { codeSplitting: false } },
  },
})
const dir = 'preview-dist/assets'
const files = readdirSync(dir)
const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('\n')
const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(`${dir}/${f}`, 'utf8')).join('\n')
// the stylesheet ships base64-encoded (as a data URI string) and a tiny script adds it as a <style> on load: hosted
// previews cap a page's inline code but don't count data URIs, and they block stylesheets loaded from data: links
const safeJs = js.replace(/<\/script/gi, '<\\/script')
const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${app.title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap">
<script>{const s=document.createElement('style');s.textContent=decodeURIComponent(escape(atob('data:text/css;base64,${Buffer.from(css).toString('base64')}'.slice(21))));document.head.appendChild(s)}</script>
<div id="root"></div>
<script type="module">${safeJs}</script>
`
mkdirSync('preview', { recursive: true })
writeFileSync(app.out, html)
console.log(app.out, (html.length / 1024).toFixed(0) + ' KB')

