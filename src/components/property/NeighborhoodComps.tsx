import L from 'leaflet'
import { useState } from 'react'
import { Marker } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import { AGENT } from '@/data/tiers'
import type { Comp } from '@/data/types'
import { photoUrl } from '@/lib/assets'
import { hash, mlsPhotos } from '@/lib/flows'
import { money } from '@/lib/format'
import { properties } from '@/data/properties'
import { cn } from '@/lib/utils'

// Comps in the neighborhood: recent sales near the home, as a list beside a map. Hovering one highlights
// the other. Homes without comps on record get a nearby set built from their value, for the prototype.

const MI = 1 / 69 // degrees of latitude per mile

function synth(address: string, valueNow: number, sqft = 1800): Comp[] {
  const h = hash(address)
  const pics = mlsPhotos(`${address}-comps`)
  const streets = ['Oak Knoll Ave', 'El Molino Ave', 'Lake Ave', 'Orange Grove Blvd', 'Mar Vista Ave', 'Allen Ave']
  return streets.slice(0, 5).map((st, i) => {
    const sq = Math.round(sqft * (0.85 + ((h >> i) % 30) / 100))
    const ppsf = Math.round((valueNow / sqft) * (1.02 + ((h >> (i + 3)) % 18) / 100))
    return {
      address: `${100 + ((h >> (i * 2)) % 1800)} ${st}`,
      sqft: sq,
      ppsf,
      price: Math.round((sq * ppsf) / 1000) * 1000,
      distMi: Math.round((0.2 + ((h >> (i + 5)) % 9) / 10) * 10) / 10,
      monthsAgo: 1 + ((h >> (i + 1)) % 8),
      features: i % 2 ? ['Renovated kitchen', 'New baths'] : ['Updated finishes'],
      photo: pics[i % pics.length],
    }
  })
}

export function NeighborhoodComps({ id, address, city, valueNow, sqft, comps }: { id: string; address: string; city: string; valueNow: number; sqft?: number; comps: Comp[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const list = comps.length ? comps : synth(address, valueNow, sqft)
  const known = properties.find((p) => p.id === id)
  const h = hash(address)
  const home: [number, number] = known ? [known.lat, known.lng] : [AGENT.office.lat + (((h % 40) - 20) / 1000), AGENT.office.lng + ((((h >> 6) % 40) - 20) / 1000)]
  // place each comp at its distance, spread around the home
  const pts = list.map((c, i) => {
    const a = ((h % 360) + i * (360 / list.length)) * (Math.PI / 180)
    return [home[0] + Math.sin(a) * c.distMi * MI, home[1] + (Math.cos(a) * c.distMi * MI) / Math.cos((home[0] * Math.PI) / 180)] as [number, number]
  })
  const homeIcon = L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-office" title="This home"></span>', iconAnchor: [0, 0] })
  const avg = Math.round(list.reduce((n, c) => n + c.ppsf, 0) / list.length)

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-ink">Comps in the neighborhood</h2>
        <p className="text-[12.5px] text-muted">
          {list.length} recent sales near {address}, {city} · avg ${avg}/sqft
        </p>
      </div>
      <div className="mt-3 grid overflow-hidden rounded-2xl border border-line bg-white shadow-card lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ul className="max-h-[420px] divide-y divide-line-soft overflow-y-auto">
          {list.map((c, i) => (
            <li key={c.address} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={cn('flex gap-3 p-3 transition-colors', hover === i && 'bg-[var(--brand-primary-subtle)]')}>
              <img src={c.photo?.startsWith('data:') || c.photo?.includes('/') ? c.photo : (photoUrl(c.photo) ?? '')} alt="" className="h-16 w-20 shrink-0 rounded-lg bg-line-soft object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-[14px] font-semibold text-ink">{c.address}</p>
                  <p className="shrink-0 text-[14px] font-semibold text-ink tabular-nums">{money(c.price)}</p>
                </div>
                <p className="text-[12.5px] text-muted tabular-nums">
                  ${c.ppsf}/sqft · {c.sqft.toLocaleString()} sqft · {c.distMi} mi · sold {c.monthsAgo} mo ago
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.features.slice(0, 2).map((f) => (
                    <span key={f} className="rounded-md bg-head px-1.5 py-0.5 text-[11px] text-ink-2">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="relative isolate h-[320px] border-t border-line lg:h-auto lg:min-h-[420px] lg:border-t-0 lg:border-l">
          <BaseMap center={home} zoom={13} bounds={[home, ...pts]} wheelZoom={false}>
            <Marker position={home} icon={homeIcon} zIndexOffset={1000} title={address} />
            {list.map((c, i) => (
              <Marker
                key={c.address}
                position={pts[i]}
                zIndexOffset={hover === i ? 900 : 0}
                icon={L.divIcon({ className: 'rv-pinwrap', html: `<span class="rv-pill${hover === i ? ' on' : ''}">${money(c.price)}</span>`, iconAnchor: [0, 0] })}
                eventHandlers={{ mouseover: () => setHover(i), mouseout: () => setHover(null) }}
              />
            ))}
          </BaseMap>
        </div>
      </div>
    </section>
  )
}
