import L from 'leaflet'

// Where the Flip360 basemap has tiles, and how far it zooms (see FlipMap.tsx and scripts/hd-tiles).

export const ZOOM = { min: 13.5, max: 15, native: 15 }
const lng = (x: number, z: number) => (x / 2 ** z) * 360 - 180
const lat = (y: number, z: number) => (180 / Math.PI) * Math.atan(Math.sinh(Math.PI - (2 * Math.PI * y) / 2 ** z))
/** the zoom-15 tile block (x 5622–5628, y 13071–13079) */
export const AREA = L.latLngBounds([lat(13080, 15), lng(5622, 15)], [lat(13071, 15), lng(5629, 15)])
