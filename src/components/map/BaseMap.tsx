import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet'
import { tileUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// Basemap. Default: OpenStreetMap tiles bundled with the app (zoom 10–14 around the book), the same
// tiles the Contacts page embeds, so the map works inside a hosted preview that blocks outside images.
// Set VITE_MAP_TILES_URL (any XYZ template, e.g. MapTiler or Stadia with a key) to use a live tile API.
export const TILE_Z = { min: 10, max: 14 }
export const TILE_BOUNDS: L.LatLngTuple[] = [
  [33.8, -118.82],
  [34.54, -117.52],
]
const LIVE_TILES = import.meta.env.VITE_MAP_TILES_URL as string | undefined
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function src(z: number, x: number, y: number) {
  return tileUrl(z, x, y)
}

const EmbeddedLayer = L.GridLayer.extend({
  createTile(c: L.Coords) {
    const el = document.createElement('div')
    el.style.width = el.style.height = '256px'
    const own = src(c.z, c.x, c.y)
    if (own) {
      el.style.backgroundImage = `url("${own}")`
      el.style.backgroundSize = '256px 256px'
      return el
    }
    // no street-level tile here: stretch the nearest zoomed-out one so there is never an empty square
    for (let dz = 1; c.z - dz >= TILE_Z.min; dz++) {
      const n = 1 << dz
      const px = c.x >> dz
      const py = c.y >> dz
      const up = src(c.z - dz, px, py)
      if (up) {
        el.style.backgroundImage = `url("${up}")`
        el.style.backgroundSize = `${256 * n}px ${256 * n}px`
        el.style.backgroundPosition = `${-(c.x - px * n) * 256}px ${-(c.y - py * n) * 256}px`
        break
      }
    }
    return el
  },
})

function EmbeddedTiles() {
  const map = useMap()
  useEffect(() => {
    const layer: L.GridLayer = new (EmbeddedLayer as unknown as new (o: L.GridLayerOptions) => L.GridLayer)({
      minZoom: TILE_Z.min,
      maxZoom: TILE_Z.max,
      attribution: ATTRIBUTION,
    })
    layer.addTo(map)
    map.setMaxBounds(L.latLngBounds(TILE_BOUNDS).pad(0.25))
    return () => {
      layer.remove()
    }
  }, [map])
  return null
}

export function BaseMap({
  center,
  zoom,
  bounds,
  interactive = true,
  wheelZoom = interactive,
  zoomPosition = 'topleft',
  padTop = 24,
  zoomControl = true,
  className,
  children,
}: {
  center: [number, number]
  zoom: number
  bounds?: L.LatLngTuple[] // when given, the view fits these instead of center/zoom
  interactive?: boolean
  wheelZoom?: boolean // off on scrolling pages so the wheel scrolls the page
  zoomPosition?: L.ControlPosition
  padTop?: number // extra room at the top when something floats over the map
  zoomControl?: boolean // off on mobile, where you pinch
  className?: string
  children?: React.ReactNode
}) {
  return (
    <MapContainer
      {...(bounds && bounds.length > 1 ? { bounds, boundsOptions: { paddingTopLeft: [24, padTop] as L.PointTuple, paddingBottomRight: [24, 24] as L.PointTuple } } : { center, zoom })}
      minZoom={TILE_Z.min}
      zoomSnap={0.25}
      maxZoom={TILE_Z.max}
      zoomControl={false}
      scrollWheelZoom={wheelZoom}
      dragging={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      keyboard={interactive}
      attributionControl
      className={cn('h-full w-full bg-[#eef0f3]', className)}
    >
      {interactive && zoomControl && <ZoomControl position={zoomPosition} />}
      {LIVE_TILES ? <TileLayer url={LIVE_TILES} attribution={ATTRIBUTION} /> : <EmbeddedTiles />}
      {children}
    </MapContainer>
  )
}
