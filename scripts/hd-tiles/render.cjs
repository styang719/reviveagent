// renders a block of XYZ tiles (Leaflet zoom z) with MapLibre at 2x, then the caller slices it
const { chromium } = require('playwright')
const path = require('path')
const t2lng = (x, z) => (x / 2 ** z) * 360 - 180
const t2lat = (y, z) => { const n = Math.PI - (2 * Math.PI * y) / 2 ** z; return (180 / Math.PI) * Math.atan(Math.sinh(n)) }
;(async () => {
  const [style, z, x0, y0, cols, rows, out] = process.argv.slice(2)
  const Z = +z, X = +x0, Y = +y0, C = +cols, R = +rows
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY }, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
  const p = await b.newPage({ viewport: { width: C * 256, height: R * 256 }, deviceScaleFactor: 1 })
  p.on('console', (m) => console.log('page:', m.text()))
  await p.goto('file://' + path.join(__dirname, 'page.html'))
  const lng = t2lng(X + C / 2, Z), lat = t2lat(Y + R / 2, Z)
  const r = await p.evaluate(([s, w, h, lng, lat, zm]) => window.render(s, w, h, lng, lat, zm), [`https://tiles.openfreemap.org/styles/${style}`, C * 256, R * 256, lng, lat, Z - 1])
  const data = await p.evaluate(() => window.map.getCanvas().toDataURL('image/png'))
  require('fs').writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'))
  console.log('ok', r)
  await b.close()
})().catch((e) => { console.error(e); process.exit(1) })
