// Pulls the sample book out of reference/Your_Contacts.html (the built Contacts page):
// contact records + CRM history, real home photos, comp photos, the embedded OSM map tiles,
// the vector Revive wordmark and Michelle's avatar. Re-run after updating the reference file.
//   node scripts/import-contacts.mjs
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

const SRC = 'reference/Your_Contacts.html'
const html = readFileSync(SRC, 'utf8')

const jsonVar = (name) => JSON.parse(new RegExp(`var ${name}\\s*=\\s*(\\{.*?\\}|\\[.*?\\]);?\\n`).exec(html)[1])
// HIST is a JS object literal (unquoted keys); it holds data only.
const literalVar = (name) => {
  const start = html.indexOf(`var ${name}={`) + `var ${name}=`.length
  let depth = 0, i = start
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++
    else if (html[i] === '}' && --depth === 0) break
  }
  return new Function(`return (${html.slice(start, i + 1)})`)()
}

const DATA = jsonVar('DATA')
const HIST = literalVar('HIST')
const TILES = jsonVar('TILES')
const TILES_HI = jsonVar('TILES_HI')

const writeDataUri = (uri, path) => {
  const m = /^data:image\/(\w+);base64,(.*)$/s.exec(uri)
  writeFileSync(path, Buffer.from(m[2], 'base64'))
}

// photos
rmSync('src/assets/photos', { recursive: true, force: true })
mkdirSync('src/assets/photos', { recursive: true })
const records = DATA.map((r) => {
  writeDataUri(r.photo, `src/assets/photos/contact-${r.id}.jpg`)
  const comps = (r.dr?.comps ?? []).map((c, i) => {
    let photo = null
    if (c.photo) {
      photo = `comp-${r.id}-${i}`
      writeDataUri(c.photo, `src/assets/photos/${photo}.jpg`)
    }
    return { ...c, photo }
  })
  const { photo: _p, dr, ...rest } = r
  return { ...rest, photo: `contact-${r.id}`, dr: dr ? { ...dr, comps } : null, hist: HIST[r.id] ?? [] }
})
mkdirSync('src/data/generated', { recursive: true })
writeFileSync('src/data/generated/contacts.json', JSON.stringify(records, null, 1))

// map tiles: low zoom as WebP, street level as JPEG
rmSync('src/assets/tiles', { recursive: true, force: true })
for (const [set, ext] of [[TILES, 'webp'], [TILES_HI, 'jpg']]) {
  for (const [key, b64] of Object.entries(set)) {
    const [z, x, y] = key.split('/')
    mkdirSync(`src/assets/tiles/${z}/${x}`, { recursive: true })
    writeFileSync(`src/assets/tiles/${z}/${x}/${y}.${ext}`, Buffer.from(b64, 'base64'))
  }
}

// brand assets
const lines = html.split('\n')
const svg = /<svg[^>]*viewBox="0 0 117\.6 32".*?<\/svg>/s.exec(html)[0].replace(' aria-hidden="true"', '')
writeFileSync('src/assets/revive-wordmark.svg', svg)
const av = /class="sb-av" src="(data:image\/\w+;base64,[^"]+)"/.exec(html)[1].replace('data:image/png', 'data:image/jpeg')
writeDataUri(av, 'src/assets/avatar-michelle.jpg')

console.log(`${records.length} contacts, ${Object.keys(TILES).length + Object.keys(TILES_HI).length} tiles, ${lines.length} lines read`)
