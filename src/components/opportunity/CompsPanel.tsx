import L from 'leaflet'
import { MapPin, X } from 'lucide-react'
import { useState } from 'react'
import { Marker } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import type { Comp } from '@/data/types'
import { photoUrl } from '@/lib/assets'
import { hash, mlsPhotos } from '@/lib/flows'
import { gain, money } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// Opened from a row's map button: the home on a map with recent sales around it, each marked renovated or
// sold as-is, so the agent sees the case for Revive at a glance (renovated homes nearby sold for more per
// sqft). Comps come from the record when there are any, else a nearby set for the prototype; which ones
// count as renovated is illustrative.

const MI = 1 / 69
type C = Comp & { renovated: boolean }

function compsFor(o: Opportunity): C[] {
  const p = o.property
  const h = Math.abs(hash(p.address))
  const sqft = p.sqft || 1800
  const base = p.comps?.length
    ? p.comps
    : (() => {
        const pics = mlsPhotos(`${p.address}-comps`)
        const streets = ['Oak Knoll Ave', 'El Molino Ave', 'Lake Ave', 'Orange Grove Blvd', 'Mar Vista Ave', 'Allen Ave']
        return streets.map((st, i) => ({
          address: `${100 + ((h >>> (i * 2)) % 1800)} ${st}`,
          sqft: Math.round(sqft * (0.85 + ((h >>> i) % 30) / 100)),
          ppsf: Math.round((p.valueNow / sqft) * (1.02 + ((h >>> (i + 3)) % 18) / 100)),
          price: 0,
          distMi: Math.round((0.2 + ((h >>> (i + 5)) % 9) / 10) * 10) / 10,
          monthsAgo: 1 + ((h >>> (i + 1)) % 8),
          features: ['Renovated kitchen and baths'],
          photo: pics[i % pics.length],
        }))
      })()
  // alternate renovated and as-is; as-is homes sell for less per sqft
  return base.slice(0, 6).map((c, i) => {
    const renovated = i % 2 === 0
    const ppsf = renovated ? Math.round(c.ppsf * 1.06) : Math.round(c.ppsf * 0.9)
    return { ...c, renovated, ppsf, price: Math.round((c.sqft * ppsf) / 1000) * 1000, features: renovated ? c.features : ['Sold as-is'] }
  })
}

export function CompsPanel({ o, onClose }: { o: Opportunity; onClose: () => void }) {
  const [hover, setHover] = useState<number | null>(null)
  const [show, setShow] = useState<'all' | 'reno' | 'asis'>('all')
  const p = o.property
  const list = compsFor(o)
  const h = Math.abs(hash(p.address))
  const home: [number, number] = [p.lat, p.lng]
  const pts = list.map((c, i) => {
    const a = ((h % 360) + i * (360 / list.length)) * (Math.PI / 180)
    return [home[0] + Math.sin(a) * c.distMi * MI, home[1] + (Math.cos(a) * c.distMi * MI) / Math.cos((home[0] * Math.PI) / 180)] as [number, number]
  })
  const avg = (xs: C[]) => (xs.length ? Math.round(xs.reduce((n, c) => n + c.ppsf, 0) / xs.length) : 0)
  const reno = avg(list.filter((c) => c.renovated))
  const asis = avg(list.filter((c) => !c.renovated))
  const lift = asis ? Math.round(((reno - asis) / asis) * 100) : 0
  const visible = list.map((c, i) => ({ c, i })).filter(({ c }) => show === 'all' || (show === 'reno') === c.renovated)
  const homeIcon = L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-office" title="This home"></span>', iconAnchor: [0, 0] })

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-ink/20" onClick={onClose}>
      <aside aria-label={`Comps near ${p.address}`} className="flex h-full w-[min(720px,94vw)] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-muted uppercase">
              <MapPin className="size-3.5" /> Comps nearby
            </p>
            <h2 className="mt-0.5 truncate text-[18px] font-semibold text-ink">
              {p.address} <span className="font-normal text-muted">· {p.city}</span>
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-2">
              Value today <b className="font-semibold text-ink">{money(p.valueNow)}</b>
              {o.gain > 0 && (
                <>
                  {' '}
                  · with {o.product ?? 'Revive'} <b className="font-semibold text-[var(--green)]">{gain(o.gain)}</b>
                </>
              )}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-line-soft hover:text-ink">
            <X className="size-5" />
          </button>
        </header>

        {/* the case in one line: renovated vs as-is, per sqft */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
          <div className="px-5 py-3">
            <p className="text-[11.5px] font-medium tracking-wide text-muted uppercase">Renovated sold</p>
            <p className="text-[18px] font-semibold text-[var(--green)] tabular-nums">${reno}/sqft</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11.5px] font-medium tracking-wide text-muted uppercase">Sold as-is</p>
            <p className="text-[18px] font-semibold text-ink tabular-nums">${asis}/sqft</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11.5px] font-medium tracking-wide text-muted uppercase">Renovation premium</p>
            <p className="text-[18px] font-semibold text-[var(--green)] tabular-nums">+{lift}%</p>
          </div>
        </div>

        <div className="relative isolate h-[300px] shrink-0 border-b border-line">
          <BaseMap center={home} zoom={14} bounds={[home, ...pts]} wheelZoom>
            <Marker position={home} icon={homeIcon} zIndexOffset={1000} title={p.address} />
            {visible.map(({ c, i }) => (
              <Marker
                key={c.address}
                position={pts[i]}
                zIndexOffset={hover === i ? 900 : 0}
                icon={L.divIcon({ className: 'rv-pinwrap', html: `<span class="rv-pill ${c.renovated ? 'k-reno' : 'k-asis'}${hover === i ? ' on' : ''}">${money(c.price)}</span>`, iconAnchor: [0, 0] })}
                eventHandlers={{ mouseover: () => setHover(i), mouseout: () => setHover(null) }}
              />
            ))}
          </BaseMap>
          <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-3 rounded-lg bg-white/95 px-3 py-1.5 text-[12px] text-ink-2 shadow-card">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-2 border-white bg-[var(--brand-primary)] shadow" /> This home
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-[var(--green)]" /> Renovated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-2 border-[#c4cad6] bg-white" /> Sold as-is
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 border-b border-line px-5 pt-2">
          {(['all', 'reno', 'asis'] as const).map((k) => (
            <button key={k} onClick={() => setShow(k)} className={cn('-mb-px border-b-2 px-3 py-2 text-[13.5px] font-medium', show === k ? 'border-[var(--brand-primary)] text-ink' : 'border-transparent text-muted hover:text-ink')}>
              {k === 'all' ? `All ${list.length}` : k === 'reno' ? 'Renovated' : 'Sold as-is'}
            </button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-line-soft overflow-y-auto">
          {visible.map(({ c, i }) => (
            <li key={c.address} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={cn('flex items-center gap-3 px-5 py-3', hover === i && 'bg-[var(--brand-primary-subtle)]')}>
              <img src={c.photo?.startsWith('data:') || c.photo?.includes('/') ? c.photo : (photoUrl(c.photo) ?? '')} alt="" className="h-12 w-16 shrink-0 rounded-lg bg-line-soft object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">{c.address}</p>
                <p className="text-[12.5px] text-muted tabular-nums">
                  {c.sqft.toLocaleString()} sqft · {c.distMi} mi · sold {c.monthsAgo} mo ago
                </p>
              </div>
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold', c.renovated ? 'bg-ok-soft text-[var(--green)]' : 'bg-line-soft text-ink-2')}>{c.renovated ? 'Renovated' : 'As-is'}</span>
              <div className="w-24 shrink-0 text-right">
                <p className="text-[14px] font-semibold text-ink tabular-nums">{money(c.price)}</p>
                <p className="text-[12px] text-muted tabular-nums">${c.ppsf}/sqft</p>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
