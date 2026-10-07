// Bundled images. In the single-file preview build these are inlined as data: URIs.
const PHOTOS = import.meta.glob('/src/assets/photos/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const TILES = import.meta.glob('/src/assets/tiles/**/*.{webp,jpg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export function photoUrl(key?: string) {
  return key ? PHOTOS[`/src/assets/photos/${key}.jpg`] : undefined
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
  return Object.keys(PHOTOS)
    .map((p) => /photos\/(.+)\.jpg$/.exec(p)?.[1])
    .filter((k): k is string => !!k)
    .sort()
}
