import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, useMap } from 'react-leaflet'
import { AREA, ZOOM } from './area'

// The Flip360 basemap: 512px (retina) tiles for zoom 14–15 over Eagle Rock and Highland Park, rendered from
// OpenFreeMap (Liberty style, OpenStreetMap data) by scripts/hd-tiles and bundled with the app, because hosted
// previews block images from other sites. The map is held to that area, between zoom 13.5 (the zoom-14 tiles
// drawn smaller) and 15. VITE_FLIP360_TILES_URL (any XYZ template) switches to a live tile API instead.

const TILES = import.meta.glob('/src/assets/tiles-hd/**/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const INDEX: Record<string, string> = {}
for (const [path, url] of Object.entries(TILES)) {
  const m = /tiles-hd\/(\d+)\/(\d+)\/(\d+)\./.exec(path)
  if (m) INDEX[`${m[1]}/${m[2]}/${m[3]}`] = url
}

const LIVE = import.meta.env.VITE_FLIP360_TILES_URL as string | undefined
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://openfreemap.org">OpenFreeMap</a> · <a href="https://www.openmaptiles.org/">OpenMapTiles</a>'
const PAPER = '#f2f3f0'

const Bundled = L.GridLayer.extend({
  createTile(c: L.Coords) {
    const el = document.createElement('div')
    el.style.width = el.style.height = '256px'
    el.style.background = PAPER
    const url = INDEX[`${c.z}/${c.x}/${c.y}`]
    if (url) {
      el.style.backgroundImage = `url("${url}")`
      el.style.backgroundSize = '256px 256px'
    }
    return el
  },
})

function Tiles() {
  const map = useMap()
  useEffect(() => {
    const layer: L.Layer = LIVE
      ? L.tileLayer(LIVE, { maxZoom: ZOOM.max, attribution: ATTRIBUTION })
      : new (Bundled as unknown as new (o: L.GridLayerOptions) => L.GridLayer)({ minZoom: ZOOM.min, maxZoom: ZOOM.max, maxNativeZoom: ZOOM.native, attribution: ATTRIBUTION })
    layer.addTo(map)
    return () => {
      layer.remove()
    }
  }, [map])
  return null
}

export function FlipMap({ center, zoom, children }: { center: [number, number]; zoom: number; children?: React.ReactNode }) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={ZOOM.min}
      maxZoom={ZOOM.max}
      zoomSnap={0.25}
      maxBounds={AREA}
      maxBoundsViscosity={1}
      zoomControl={false}
      attributionControl
      className="h-full w-full"
      style={{ background: PAPER }}
    >
      <Tiles />
      {children}
    </MapContainer>
  )
}
