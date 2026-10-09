// Bundled images. In the single-file preview build these are inlined as data: URIs.
// Home photos are 10 AI-generated exteriors (Figma AI, src/assets/homes). The prototype's 42 photo keys
// (from the Contacts page import) each map to one of them, so data keeps its keys and each image ships once.
const HOMES = import.meta.glob('/src/assets/homes/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const TILES = import.meta.glob('/src/assets/tiles/**/*.{webp,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

const HOME_URLS = Object.keys(HOMES)
  .sort()
  .map((k) => HOMES[k])

// the homes shown on cards get their own picture; the rest are spread so a home and its comps differ
const FEATURED: Record<string, number> = {
  'comp-101-1': 0, // 412 Oak Ave: Craftsman bungalow
  'comp-110-2': 1, // 301 Mission St: Spanish revival
  'comp-104-2': 2, // 87 Glen Summer Rd: mid-century ranch
  'comp-105-2': 3, // 1032 Elm Ave: colonial
  'comp-102-0': 4, // 16 Laurel Pl: modern farmhouse
  'comp-105-0': 5, // 1290 Brigden Rd: stucco cottage
  'comp-100-0': 6, // 123 Main St: split-level
  'comp-111-2': 7, // 9 Cypress Ct: two-story Craftsman
  'comp-106-2': 8, // 31 Arden Rd: California modern
  'comp-109-2': 9, // 77 Harbor View Dr: Mediterranean
}
const KEYS = [
  ...[100, 101, 102, 103, 104, 105, 106, 109, 110, 111].flatMap((n) => [0, 1, 2].map((j) => `comp-${n}-${j}`)),
  ...Array.from({ length: 12 }, (_, i) => `contact-${100 + i}`),
]
const PHOTO_INDEX: Record<string, number> = { ...FEATURED }
// each group of three comps gets three different pictures, never the featured home's own
for (let g = 0; g < KEYS.length; g += 3) {
  const group = KEYS.slice(g, g + 3).filter((k) => k.startsWith('comp-'))
  const used = new Set(group.map((k) => FEATURED[k]).filter((i) => i !== undefined))
  for (const key of group) {
    if (PHOTO_INDEX[key] !== undefined) continue
    let i = (Number(key.slice(5, 8)) * 7 + Number(key.slice(-1)) * 3) % 10
    while (used.has(i)) i = (i + 1) % 10
    used.add(i)
    PHOTO_INDEX[key] = i
  }
}
for (const key of KEYS) if (key.startsWith('contact-')) PHOTO_INDEX[key] = (Number(key.slice(8)) * 3 + 1) % 10

export function photoUrl(key?: string) {
  if (!key) return undefined
  const i = PHOTO_INDEX[key]
  return i === undefined ? undefined : HOME_URLS[i % HOME_URLS.length]
}

const TILE_INDEX: Record<string, string> = {}
for (const [path, url] of Object.entries(TILES)) {
  const m = /tiles\/(\d+)\/(\d+)\/(\d+)\./.exec(path)
  if (m) TILE_INDEX[`${m[1]}/${m[2]}/${m[3]}`] = url
}

export function tileUrl(z: number, x: number, y: number) {
  return TILE_INDEX[`${z}/${x}/${y}`]
}

/** Keys of every bundled photo (used as the prototype's 'MLS photos'). */
export function allPhotoKeys() {
  return [...KEYS].sort()
}
