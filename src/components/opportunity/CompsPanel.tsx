import L from 'leaflet'
import { ArrowLeft, Bath, BedDouble, Check, Mail, Ruler, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import { reviveProjects } from '@/data/reviveProjects'
import { photoUrl } from '@/lib/assets'
import { hash, mlsPhotos } from '@/lib/flows'
import { gain, money } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// Opened from a row's map button: a full-screen, home-search style map (think Redfin or Zillow) centered
// on the home, with what's around it: recent sales marked renovated or sold as-is, homes for sale now, and
// Revive projects nearby. A list on the left mirrors the map; picking either side selects the other and
// shows a card. The point is the case for Revive: renovated homes here sell for more per sqft.
// Sales, listings and which ones count as renovated are illustrative for the prototype; Revive projects
// come from the sample case studies.

const MI = 1 / 69
type Kind = 'reno' | 'asis' | 'sale' | 'revive'
interface Place {
  id: string
  kind: Kind
  address: string
  price: number
  ppsf: number
  sqft: number
  beds: number
  baths: number
  distMi: number
  when: string
  photo?: string
  pos: [number, number]
  note?: string
  added?: number // Revive projects: value added
}

const LAYERS: { k: Kind; label: string; dot: string }[] = [
  { k: 'reno', label: 'Sold renovated', dot: 'bg-[var(--green)]' },
  { k: 'asis', label: 'Sold as-is', dot: 'border-2 border-[#c4cad6] bg-white' },
  { k: 'sale', label: 'For sale', dot: 'border-2 border-navy bg-white' },
  { k: 'revive', label: 'Revive projects', dot: 'bg-[var(--teal)]' },
]
const BADGE: Record<Kind, { label: string; cls: string }> = {
  reno: { label: 'Sold · renovated', cls: 'bg-ok-soft text-[var(--green)]' },
  asis: { label: 'Sold · as-is', cls: 'bg-line-soft text-ink-2' },
  sale: { label: 'For sale', cls: 'bg-[var(--brand-primary-subtle)] text-brand' },
  revive: { label: 'Revive project', cls: 'bg-[var(--teal-soft)] text-navy' },
}
const STREETS = ['Oak Knoll Ave', 'El Molino Ave', 'Lake Ave', 'Orange Grove Blvd', 'Mar Vista Ave', 'Allen Ave', 'Hill Ave', 'Michigan Ave', 'Catalina Ave', 'Wilson Ave', 'Holliston Ave', 'Craig Ave']

function at(home: [number, number], angleDeg: number, mi: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180
  return [home[0] + Math.sin(a) * mi * MI, home[1] + (Math.cos(a) * mi * MI) / Math.cos((home[0] * Math.PI) / 180)]
}
const miles = (a: [number, number], b: [number, number]) => {
  const dy = (a[0] - b[0]) * 69
  const dx = (a[1] - b[1]) * 69 * Math.cos((a[0] * Math.PI) / 180)
  return Math.round(Math.hypot(dx, dy) * 10) / 10
}

function placesFor(o: Opportunity): Place[] {
  const p = o.property
  const home: [number, number] = [p.lat, p.lng]
  const h = hash(p.address)
  const pics = mlsPhotos(`${p.address}-nearby`)
  const ppsf0 = p.valueNow / (p.sqft || 1800)
  const out: Place[] = []
  // twelve homes around it: sales (renovated, as-is) and current listings
  for (let i = 0; i < 12; i++) {
    const kind: Kind = i % 4 === 3 ? 'sale' : i % 2 === 0 ? 'reno' : 'asis'
    const sqft = Math.round((p.sqft || 1800) * (0.8 + ((h >>> i) % 40) / 100))
    const ppsf = Math.round(ppsf0 * (kind === 'reno' ? 1.12 : kind === 'asis' ? 0.93 : 1.04) * (0.97 + ((h >>> (i + 3)) % 7) / 100))
    const dist = Math.round((0.15 + ((h >>> (i + 5)) % 11) / 10) * 10) / 10
    out.push({
      id: `n${i}`,
      kind,
      address: `${100 + ((h >>> (i * 2)) % 1800)} ${STREETS[i]}`,
      price: Math.round((sqft * ppsf) / 1000) * 1000,
      ppsf,
      sqft,
      beds: 2 + ((h >>> i) % 3),
      baths: 1 + ((h >>> (i + 2)) % 3),
      distMi: dist,
      when: kind === 'sale' ? `Listed ${3 + ((h >>> i) % 40)} days ago` : `Sold ${1 + ((h >>> (i + 1)) % 8)} mo ago`,
      photo: pics[i % pics.length],
      pos: at(home, (h % 360) + i * 30 + ((h >>> i) % 12), dist),
      note: kind === 'reno' ? 'Renovated kitchen and baths' : kind === 'asis' ? 'Original finishes' : undefined,
    })
  }
  // Revive projects: the case studies close by, plus two in this neighborhood
  const real = reviveProjects
    .map((r) => ({ r, d: miles(home, [r.lat, r.lng]) }))
    .filter((x) => x.d <= 3)
  const synth = [0, 1].map((i) => {
    const r = reviveProjects[(h + i) % reviveProjects.length]
    const dist = 0.5 + i * 0.6
    return { r, d: dist, pos: at(home, (h % 360) + 75 + i * 140, dist), address: `${200 + ((h >>> (i + 7)) % 900)} ${STREETS[(i + 4) % STREETS.length]}` }
  })
  for (const x of [...synth, ...real.map((x) => ({ ...x, pos: [x.r.lat, x.r.lng] as [number, number], address: x.r.block }))]) {
    const r = x.r
    const price = r.after ?? r.est ?? (r.before ?? p.valueNow) + (r.added ?? 0)
    out.push({
      id: `r-${r.id}-${x.address}`,
      kind: 'revive',
      address: x.address,
      price,
      ppsf: Math.round(price / ((p.sqft || 1800) * 1.05)),
      sqft: Math.round((p.sqft || 1800) * 1.05),
      beds: 3,
      baths: 2,
      distMi: x.d,
      when: r.when,
      photo: r.cover ?? photoUrl(r.photo),
      pos: x.pos,
      note: `${r.product} · ${r.scope.slice(0, 3).join(', ')}`,
      added: r.before && r.after ? r.after - r.before : r.added,
    })
  }
  return out
}

/** Fit the map to what's showing; fly to a pick. */
function View({ pts, pick }: { pts: [number, number][]; pick?: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    if (pts.length > 1) map.fitBounds(pts, { padding: [70, 70], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pts.length, map])
  useEffect(() => {
    if (pick) map.panTo(pick, { animate: true })
  }, [pick, map])
  return null
}

function PlaceCard({ pl, compact }: { pl: Place; compact?: boolean }) {
  const b = BADGE[pl.kind]
  return (
    <div className={cn('flex gap-3', compact ? '' : 'p-3')}>
      <img src={pl.photo} alt="" className={cn('shrink-0 rounded-lg bg-line-soft object-cover', compact ? 'h-[72px] w-24' : 'h-20 w-28')} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[16px] font-semibold text-ink tabular-nums">{money(pl.price)}</p>
          <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', b.cls)}>{b.label}</span>
        </div>
        <p className="truncate text-[13px] font-medium text-ink">{pl.address}</p>
        <p className="mt-0.5 flex items-center gap-2.5 text-[12px] text-muted tabular-nums">
          <span className="inline-flex items-center gap-1"><BedDouble className="size-3.5" />{pl.beds}</span>
          <span className="inline-flex items-center gap-1"><Bath className="size-3.5" />{pl.baths}</span>
          <span className="inline-flex items-center gap-1"><Ruler className="size-3.5" />{pl.sqft.toLocaleString()} sqft</span>
          <span>${pl.ppsf}/sqft</span>
        </p>
        <p className="mt-0.5 truncate text-[12px] text-ink-2">
          {pl.when} · {pl.distMi} mi{pl.added ? <b className="ml-1 font-semibold text-[var(--green)]">{gain(pl.added)} added</b> : pl.note ? ` · ${pl.note}` : ''}
        </p>
      </div>
    </div>
  )
}

export function CompsPanel({ o, onClose, onContact }: { o: Opportunity; onClose: () => void; onContact?: () => void }) {
  const p = o.property
  const home: [number, number] = [p.lat, p.lng]
  const places = useMemo(() => placesFor(o), [o])
  const [layers, setLayers] = useState<Set<Kind>>(() => new Set(['reno', 'asis', 'sale', 'revive']))
  const [sel, setSel] = useState<string | null>(null)
  const [hover, setHover] = useState<string | null>(null)
  const shown = places.filter((pl) => layers.has(pl.kind))
  const picked = places.find((pl) => pl.id === sel)
  const avg = (k: Kind) => {
    const xs = places.filter((pl) => pl.kind === k)
    return xs.length ? Math.round(xs.reduce((n, pl) => n + pl.ppsf, 0) / xs.length) : 0
  }
  const reno = avg('reno')
  const asis = avg('asis')
  const premium = asis ? Math.round(((reno - asis) / asis) * 100) : 0
  const revives = places.filter((pl) => pl.kind === 'revive').length
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  const toggle = (k: Kind) =>
    setLayers((s) => {
      const n = new Set(s)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })
  const homeIcon = L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-home"><span></span></span>', iconAnchor: [0, 0] })
  const pin = (pl: Place) => {
    const label = pl.kind === 'revive' ? `Revive ${pl.added ? gain(pl.added) : ''}` : money(pl.price)
    const on = sel === pl.id ? ' sel' : hover === pl.id ? ' on' : ''
    return L.divIcon({ className: 'rv-pinwrap', html: `<span class="rv-pill k-${pl.kind}${on}">${label}</span>`, iconAnchor: [0, 0] })
  }

  return (
    <div className="fixed inset-0 z-[80] grid grid-rows-[auto_minmax(0,1fr)] bg-white lg:grid-cols-[400px_minmax(0,1fr)] lg:grid-rows-1" role="dialog" aria-label={`Map around ${p.address}`}>
      {/* left: the home, the case for Revive, and what's around it */}
      <aside className="flex min-h-0 flex-col border-r border-line">
        <div className="border-b border-line p-4">
          <button onClick={onClose} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
            <ArrowLeft className="size-4" /> Back to opportunities
          </button>
          <div className="flex gap-3">
            <img src={o.photo ?? photoUrl(p.photo)} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold text-ink">{p.address}</p>
              <p className="truncate text-[13px] text-muted">
                {p.city}
                {o.person && ` · ${o.person.name}`}
              </p>
              <p className="mt-1 text-[13px] text-ink-2">
                <b className="font-semibold text-ink">{money(p.valueNow)}</b> today
                {o.gain > 0 && (
                  <>
                    {' '}
                    · <b className="font-semibold text-[var(--green)]">{gain(o.gain)}</b> with {o.product ?? 'Revive'}
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-xl bg-ok-soft/70 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
              <Sparkles className="size-4 text-[var(--green)]" /> Renovated homes here sell for <span className="text-[var(--green)]">+{premium}%</span> per sqft
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-2 tabular-nums">
              ${reno}/sqft renovated vs ${asis}/sqft as-is{revives ? ` · ${revives} Revive projects nearby` : ''}
            </p>
          </div>
          {onContact && (
            <button onClick={onContact} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] text-[13.5px] font-medium text-white hover:opacity-90">
              <Mail className="size-4" /> {o.person ? `Share this with ${o.person.name.split(' ')[0]}` : 'Reach out to the owner'}
            </button>
          )}
        </div>
        <p className="px-4 pt-3 pb-1 text-[12px] font-semibold tracking-wide text-muted uppercase">{shown.length} homes nearby</p>
        <ul className="min-h-0 flex-1 divide-y divide-line-soft overflow-y-auto">
          {[...shown]
            .sort((a, b) => a.distMi - b.distMi)
            .map((pl) => (
              <li key={pl.id}>
                <button
                  onClick={() => setSel(pl.id)}
                  onMouseEnter={() => setHover(pl.id)}
                  onMouseLeave={() => setHover(null)}
                  className={cn('w-full text-left transition-colors', sel === pl.id ? 'bg-[var(--brand-primary-subtle)]' : 'hover:bg-head/70')}
                >
                  <PlaceCard pl={pl} />
                </button>
              </li>
            ))}
        </ul>
      </aside>

      {/* right: the map, full bleed, with layer chips on top and the picked home's card at the bottom */}
      <div className="relative isolate min-h-[60vh]">
        <BaseMap center={home} zoom={14} wheelZoom zoomPosition="bottomright">
          <View pts={[home, ...shown.filter((pl) => pl.distMi <= 1.5).map((pl) => pl.pos)]} pick={picked?.pos} />
          <Marker position={home} icon={homeIcon} zIndexOffset={2000} title={p.address} />
          {shown.map((pl) => (
            <Marker
              key={pl.id}
              position={pl.pos}
              icon={pin(pl)}
              zIndexOffset={sel === pl.id ? 1500 : hover === pl.id ? 1200 : pl.kind === 'revive' ? 800 : 0}
              eventHandlers={{ click: () => setSel(pl.id), mouseover: () => setHover(pl.id), mouseout: () => setHover(null) }}
            />
          ))}
        </BaseMap>
        <div className="absolute top-4 left-4 z-[500] flex flex-wrap gap-2">
          {LAYERS.map((l) => {
            const on = layers.has(l.k)
            const n = places.filter((pl) => pl.kind === l.k).length
            return (
              <button
                key={l.k}
                onClick={() => toggle(l.k)}
                aria-pressed={on}
                className={cn('inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium shadow-card', on ? 'border-white bg-white text-ink' : 'border-line bg-white/80 text-muted')}
              >
                <span className={cn('size-3 rounded-full', l.dot, !on && 'opacity-40')} />
                {l.label} <span className="text-[12px] text-muted tabular-nums">{n}</span>
                {on && <Check className="size-3.5 text-brand" />}
              </button>
            )
          })}
        </div>
        {picked && (
          <div className="absolute bottom-6 left-1/2 z-[500] w-[min(440px,90%)] -translate-x-1/2 rounded-2xl bg-white p-3 shadow-[0_16px_40px_rgba(28,46,88,0.25)]">
            <button onClick={() => setSel(null)} aria-label="Close card" className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-white text-[13px] text-muted shadow">
              ×
            </button>
            <PlaceCard pl={picked} compact />
          </div>
        )}
      </div>
    </div>
  )
}
