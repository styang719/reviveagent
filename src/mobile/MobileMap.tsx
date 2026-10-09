import L from 'leaflet'
import { ArrowLeft, Bath, BedDouble, Calendar, LayoutGrid, List, LocateFixed, Map as MapIcon, Ruler, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Circle, Marker, useMap, useMapEvents } from 'react-leaflet'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AiAvatar } from '@/components/ai/Chat'
import { img, TagPill, tagsOf } from '@/components/home/TopOpportunities'
import { BaseMap, TILE_BOUNDS } from '@/components/map/BaseMap'
import { pinIcon, pinZ } from '@/components/map/pins'
import { AGENT } from '@/data/tiers'
import { gain, money } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { URGENCY_SHORT } from '@/lib/urgency'
import { cn } from '@/lib/utils'
import { areaHomes, compsFor, homeAt, miles, STATUS_LABEL, type AreaHome, type AreaStatus } from './areaHomes'

// Mobile map: what's around the agent, not only their book. It opens on where they are. Layers show their
// opportunities, recent sales, homes for sale and pending sales; tap any pin, or long-press anywhere, for a
// home's card with the numbers, and from there its comps (drawn on the map) or a question to Revive AI.
// The card row at the bottom is what's in view, nearest first.

type Layer = 'opps' | AreaStatus
const LAYERS: { k: Layer; label: string }[] = [
  { k: 'opps', label: 'My opportunities' },
  { k: 'sold', label: 'Recent sales' },
  { k: 'active', label: 'For sale' },
  { k: 'pending', label: 'Pending' },
]

type Filter = 'all' | 'go' | 'listings' | 'seller' | 'adu' | 'projects' | 'referrals'
const FILTERS: { k: Filter; label: string }[] = [
  { k: 'all', label: 'All opportunities' },
  { k: 'go', label: 'Worth a call' },
  { k: 'listings', label: 'My listings' },
  { k: 'seller', label: 'Likely sellers' },
  { k: 'adu', label: 'ADU room' },
  { k: 'projects', label: 'Projects' },
  { k: 'referrals', label: 'Revive referrals' },
]
const passes = (o: Opportunity, f: Filter) =>
  f === 'all' ||
  (f === 'go' && (o.urgency === 'now' || o.urgency === 'soon')) ||
  (f === 'listings' && o.property.source === 'listings') ||
  (f === 'seller' && (o.person?.sellScore ?? 0) >= 80) ||
  (f === 'adu' && o.tags.includes('ADU room')) ||
  (f === 'projects' && o.stage === 'project') ||
  (f === 'referrals' && !!o.referral)

type Item = { kind: 'opp'; id: string; o: Opportunity } | { kind: 'area'; id: string; h: AreaHome }
const posOf = (it: Item) => (it.kind === 'opp' ? { lat: it.o.property.lat, lng: it.o.property.lng } : { lat: it.h.lat, lng: it.h.lng })
const ll = (p: { lat: number; lng: number }) => [p.lat, p.lng] as [number, number]
const textOf = (it: Item) => (it.kind === 'opp' ? [it.o.property.address, it.o.property.city, it.o.person?.name] : [it.h.address, it.h.city])

const bounds = L.latLngBounds(TILE_BOUNDS)
const short = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace(/\.?0+$/, '')}M` : `$${Math.round(n / 1000)}K`)
const ME_DEMO = { lat: AGENT.office.lat + 0.004, lng: AGENT.office.lng - 0.006 }
// room for the search bar on top and the card row below
const PAD = { paddingTopLeft: [28, 150] as L.PointTuple, paddingBottomRight: [28, 260] as L.PointTuple }

function areaIcon(h: AreaHome, zoom: number, on: boolean, comp: boolean) {
  const cls = `s-${h.status}${on ? ' on' : ''}${comp ? ' comp' : ''}`
  const html = zoom >= 14 || on || comp ? `<span class="rv-apin ${cls}">${short(h.price)}</span>` : `<span class="rv-adot ${cls}"></span>`
  return L.divIcon({ className: 'rv-pinwrap', html, iconAnchor: [0, 0] })
}
const meIcon = L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-me" title="You"></span>', iconAnchor: [0, 0] })
const subjectIcon = L.divIcon({
  className: 'rv-pinwrap',
  html: '<span class="rv-subject"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg></span>',
  iconAnchor: [0, 0],
})

/** Hands the Leaflet map out, and reports what's in view. */
function Watch({ onMap, onView, onHold }: { onMap: (m: L.Map) => void; onView: (b: L.LatLngBounds, z: number) => void; onHold: (p: L.LatLng) => void }) {
  const map = useMap()
  useEffect(() => {
    onMap(map)
    const t = setTimeout(() => (map.invalidateSize(), onView(map.getBounds(), map.getZoom())), 150)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  useMapEvents({
    moveend: () => onView(map.getBounds(), map.getZoom()),
    // long-press on a phone (and right-click on a computer): any spot becomes a home to look at
    contextmenu: (e) => {
      if (Number.isFinite(e.latlng?.lat)) onHold(e.latlng)
    },
  })
  return null
}

function Status({ s }: { s: AreaStatus }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
        s === 'sold' ? 'bg-[#eef0f4] text-ink-2' : s === 'active' ? 'bg-[#e7f7f0] text-[#0b6b4c]' : 'bg-[#fff4e5] text-[#94540a]',
      )}
    >
      {STATUS_LABEL[s]}
    </span>
  )
}

const when = (h: AreaHome) => (h.status === 'sold' ? `sold ${h.monthsAgo} mo ago` : `${h.daysOnMarket} days on market`)

function Card({ it, wide, onOpen, distMi }: { it: Item; wide?: boolean; onOpen: () => void; distMi?: number }) {
  const cls = cn('flex gap-3 rounded-2xl bg-white p-2.5 text-left shadow-[0_8px_24px_rgba(28,46,88,0.16)]', wide ? 'w-full shadow-card' : 'w-[300px] shrink-0 snap-center')
  if (it.kind === 'area') {
    const h = it.h
    return (
      <button onClick={onOpen} className={cls}>
        <span className="size-24 shrink-0 overflow-hidden rounded-xl bg-line-soft">{h.photo && <img src={h.photo} alt="" className="size-full object-cover" />}</span>
        <span className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <span className="min-w-0">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[17px] font-semibold text-ink tabular-nums">{money(h.price)}</span>
              <span className="text-[12px] text-muted tabular-nums">${h.ppsf}/sqft</span>
            </span>
            <span className="block truncate text-[13.5px] font-medium text-ink">{h.address}</span>
            <span className="block truncate text-[12.5px] text-muted tabular-nums">
              {h.beds} bd · {h.baths} ba · {h.sqft.toLocaleString()} sqft
            </span>
          </span>
          <span className="flex items-center gap-1.5 overflow-hidden text-[11.5px] text-muted">
            <Status s={h.status} />
            <span className="truncate">{distMi != null ? `${distMi} mi · ${when(h)}` : when(h)}</span>
          </span>
        </span>
      </button>
    )
  }
  const o = it.o
  const why = o.reasons[0]
  return (
    <button onClick={onOpen} className={cls}>
      <span className="size-24 shrink-0 overflow-hidden rounded-xl bg-line-soft">{img(o) && <img src={img(o)} alt="" className="size-full object-cover" />}</span>
      <span className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <span className="min-w-0">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-[17px] font-semibold text-ink tabular-nums">{money(o.property.valueNow)}</span>
            {o.gain > 0 && <span className="text-[13px] font-semibold text-[var(--green)] tabular-nums">{gain(o.gain)}</span>}
          </span>
          <span className="block truncate text-[13.5px] font-medium text-ink">{o.property.address}</span>
          <span className="block truncate text-[12.5px] text-muted">{o.person?.name ?? o.property.city}</span>
        </span>
        <span className="flex items-center gap-1.5 overflow-hidden">
          <span className="shrink-0 rounded-md bg-navy px-1.5 py-0.5 text-[11px] font-semibold text-white">Your book</span>
          {(o.urgency === 'now' || o.urgency === 'soon') && <span className="shrink-0 rounded-md bg-[var(--brand-primary-subtle)] px-1.5 py-0.5 text-[11px] font-semibold text-brand">{URGENCY_SHORT[o.urgency]}</span>}
          {tagsOf(o)
            .slice(0, 1)
            .map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          {!tagsOf(o).length && why && <span className="truncate text-[11.5px] text-muted">{why}</span>}
        </span>
      </span>
    </button>
  )
}

/** A home's card: the numbers, then comps, Revive AI, or (for the agent's own homes) the home's page. */
function HomeSheet({ it, onClose, onComps }: { it: Item; onClose: () => void; onComps: () => void }) {
  const navigate = useNavigate()
  const o = it.kind === 'opp' ? it.o : null
  const h = it.kind === 'area' ? it.h : null
  const address = o ? o.property.address : h!.address
  const city = o ? o.property.city : h!.city
  const photo = o ? img(o) : h!.photo
  const facts = o
    ? { beds: o.property.beds, baths: o.property.baths, sqft: o.property.sqft, built: o.property.yearBuilt }
    : { beds: h!.beds, baths: h!.baths, sqft: h!.sqft, built: h!.yearBuilt }
  const ask = () => navigate(`/m/ai?q=${encodeURIComponent(o ? `What should I know about ${address}?` : `What is ${address}, ${city} worth?`)}`)
  return (
    <>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 z-[740] bg-[rgba(16,24,40,0.18)]" />
      <section role="dialog" aria-label={address} className="absolute inset-x-0 bottom-0 z-[750] max-h-[78%] overflow-y-auto rounded-t-[28px] bg-white px-4 pt-2.5 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(28,46,88,0.18)]">
        <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
        <div className="relative h-40 overflow-hidden rounded-2xl bg-line-soft">
          {photo && <img src={photo} alt="" className="size-full object-cover" />}
          <button onClick={onClose} aria-label="Close" className="absolute top-2.5 right-2.5 grid size-9 place-items-center rounded-full bg-white/90 text-ink shadow">
            <X className="size-4.5" />
          </button>
          {h?.dropped && <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-medium text-ink">Dropped pin · sample photo</span>}
        </div>

        <div className="mt-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[22px] leading-7 font-semibold text-ink tabular-nums">{money(o ? o.property.valueNow : h!.price)}</p>
            <p className="truncate text-[15px] font-medium text-ink">{address}</p>
            <p className="text-[13px] text-muted">{city}</p>
          </div>
          {o ? (
            <span className="shrink-0 rounded-md bg-navy px-2 py-1 text-[12px] font-semibold text-white">Your book</span>
          ) : h!.dropped ? (
            <span className="shrink-0 rounded-md bg-[var(--brand-primary-subtle)] px-2 py-1 text-[12px] font-semibold text-brand">Revive estimate</span>
          ) : (
            <Status s={h!.status} />
          )}
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13.5px] text-ink-2 tabular-nums">
          {facts.beds != null && (
            <li className="flex items-center gap-1.5">
              <BedDouble className="size-4 text-muted" /> {facts.beds} bd
            </li>
          )}
          {facts.baths != null && (
            <li className="flex items-center gap-1.5">
              <Bath className="size-4 text-muted" /> {facts.baths} ba
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <Ruler className="size-4 text-muted" /> {facts.sqft.toLocaleString()} sqft
          </li>
          <li className="flex items-center gap-1.5">
            <Calendar className="size-4 text-muted" /> built {facts.built}
          </li>
        </ul>

        <dl className="mt-3.5 grid grid-cols-2 gap-2.5">
          {o ? (
            <>
              <div className="rounded-xl bg-head p-3">
                <dt className="text-[12px] text-muted">Owner</dt>
                <dd className="truncate text-[14.5px] font-semibold text-ink">{o.person?.name ?? 'Not on record'}</dd>
              </div>
              <div className="rounded-xl bg-[#f1faf6] p-3">
                <dt className="text-[12px] text-muted">Est. upside with Revive</dt>
                <dd className="text-[14.5px] font-semibold text-[var(--green)] tabular-nums">{o.gain > 0 ? gain(o.gain) : '—'}</dd>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-head p-3">
                <dt className="text-[12px] text-muted">{h!.dropped ? 'Last sold' : h!.status === 'sold' ? 'Sold' : 'Listed'}</dt>
                <dd className="text-[14.5px] font-semibold text-ink">{h!.dropped ? `${Math.round(h!.monthsAgo! / 12)} years ago` : when(h!)}</dd>
              </div>
              <div className="rounded-xl bg-head p-3">
                <dt className="text-[12px] text-muted">Price per sqft</dt>
                <dd className="text-[14.5px] font-semibold text-ink tabular-nums">${h!.ppsf}</dd>
              </div>
              <div className="col-span-2 rounded-xl bg-head p-3">
                <dt className="text-[12px] text-muted">Owner</dt>
                <dd className="text-[14.5px] text-ink">Not in your book</dd>
              </div>
            </>
          )}
        </dl>

        <div className="mt-4 flex flex-col gap-2.5">
          <button onClick={onComps} className="flex h-12 items-center justify-center gap-2 rounded-full bg-navy text-[15px] font-semibold text-white">
            <LayoutGrid className="size-[18px]" /> See comps nearby
          </button>
          <button onClick={ask} className="flex h-12 items-center justify-center gap-2 rounded-full border border-line text-[15px] font-semibold text-ink">
            <AiAvatar className="size-6 drop-shadow-none" /> Ask Revive AI about this home
          </button>
          {o && (
            <Link to={`/m/property/${o.id}`} className="flex h-12 items-center justify-center rounded-full text-[15px] font-semibold text-brand">
              Open the home’s page
            </Link>
          )}
        </div>
      </section>
    </>
  )
}

export default function MobileMap() {
  const all = useOpportunities()
  const market = useMemo(() => areaHomes(), [])
  const [layers, setLayers] = useState<Set<Layer>>(() => new Set<Layer>(['opps', 'sold', 'active', 'pending']))
  const [filter, setFilter] = useState<Filter>('all')
  const [filters, setFilters] = useState(false)
  const [q, setQ] = useState('')
  const [list, setList] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const [sheet, setSheet] = useState<Item | null>(null)
  const [dropped, setDropped] = useState<AreaHome | null>(null)
  const [comps, setComps] = useState<{ subject: Item; list: (AreaHome & { distMi: number })[] } | null>(null)
  const [me, setMe] = useState(ME_DEMO)
  const [map, setMap] = useState<L.Map | null>(null)
  const [view, setView] = useState<{ b: L.LatLngBounds; z: number } | null>(null)
  const row = useRef<HTMLDivElement>(null)
  const needle = q.trim().toLowerCase()

  // once per session: how to look up a home that isn't on the map
  useEffect(() => {
    try {
      if (sessionStorage.getItem('rv-map-tip')) return
      sessionStorage.setItem('rv-map-tip', '1')
    } catch {
      /* storage blocked: show the tip anyway */
    }
    const t = setTimeout(() => toast('Tip: press and hold anywhere on the map to look up that home.'), 900)
    return () => clearTimeout(t)
  }, [])

  // everything the layers turn on (and the search matches)
  const items = useMemo<Item[]>(() => {
    const out: Item[] = []
    if (layers.has('opps')) for (const o of all) if (passes(o, filter) && bounds.contains([o.property.lat, o.property.lng])) out.push({ kind: 'opp', id: o.id, o })
    for (const h of market) if (layers.has(h.status)) out.push({ kind: 'area', id: h.id, h })
    if (dropped) out.push({ kind: 'area', id: dropped.id, h: dropped })
    return needle ? out.filter((it) => textOf(it).some((f) => f?.toLowerCase().includes(needle))) : out
  }, [all, market, layers, filter, needle, dropped])

  // the card row: what's in view, nearest the middle of the map first
  const inView = useMemo(() => {
    if (!view) return []
    const c = view.b.getCenter()
    return items
      .filter((it) => view.b.contains(ll(posOf(it))))
      .map((it) => ({ it, d: miles(posOf(it), { lat: c.lat, lng: c.lng }) }))
      .sort((a, b) => (a.it.kind === b.it.kind ? a.d - b.d : a.it.kind === 'opp' ? -1 : 1) || a.d - b.d)
      .slice(0, 30)
      .map((x) => x.it)
  }, [items, view])

  const rowItems: Item[] = comps ? comps.list.map((h) => ({ kind: 'area', id: h.id, h })) : inView
  const compIds = new Set(comps?.list.map((h) => h.id))

  // a search jumps to what it found
  useEffect(() => {
    if (!map || !needle || !items.length) return
    const pts = items.map((it) => ll(posOf(it)))
    if (pts.length === 1) map.setView(pts[0], 14)
    else map.fitBounds(pts, { ...PAD, maxZoom: 14 })
  }, [map, needle]) // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = row.current
    if (!el) return
    const mid = el.scrollLeft + el.clientWidth / 2
    let best: string | null = null
    let d = Infinity
    for (const c of Array.from(el.children) as HTMLElement[]) {
      const cm = c.offsetLeft + c.offsetWidth / 2
      if (c.dataset.item && Math.abs(cm - mid) < d) {
        d = Math.abs(cm - mid)
        best = c.dataset.item
      }
    }
    if (best && best !== active) setActive(best)
  }
  const pick = (id: string) => {
    setActive(id)
    const el = row.current?.querySelector<HTMLElement>(`[data-item="${CSS.escape(id)}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    else {
      // a pin outside the row (e.g. far from the middle): open its card straight away
      const it = items.find((x) => x.id === id)
      if (it) setSheet(it)
    }
  }

  const locate = () => {
    const fallback = (why: string) => {
      setMe(ME_DEMO)
      map?.setView(ll(ME_DEMO), 14)
      toast(why, { description: 'Showing the demo location in Pasadena.' })
    }
    if (!navigator.geolocation) return fallback('Location isn’t available here')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude }
        if (!bounds.contains(ll(here))) return fallback('You’re outside the sample map area')
        setMe(here)
        map?.setView(ll(here), 14)
      },
      () => fallback('Location is off for this page'),
      { timeout: 6000 },
    )
  }

  const showComps = (it: Item) => {
    const p = posOf(it)
    const sqft = it.kind === 'opp' ? it.o.property.sqft : it.h.sqft
    const list = compsFor({ ...p, sqft, id: it.id })
    setSheet(null)
    setComps({ subject: it, list })
    setActive(list[0]?.id ?? null)
    row.current?.scrollTo({ left: 0 })
    if (map) map.fitBounds([ll(p), ...list.map((h) => ll(h))], { ...PAD, maxZoom: 14 })
  }
  const subjectAddr = comps ? (comps.subject.kind === 'opp' ? comps.subject.o.property.address : comps.subject.h.address) : ''
  const avgPpsf = comps?.list.length ? Math.round(comps.list.reduce((n, h) => n + h.ppsf, 0) / comps.list.length) : 0

  const toggle = (k: Layer) =>
    setLayers((s) => {
      const n = new Set(s)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })

  const zoom = view?.z ?? 14
  const selected = active ?? rowItems[0]?.id

  return (
    <div className="relative h-full [&_.leaflet-bottom]:mb-[var(--tab-h)]">
      <div className="absolute inset-0">
        <BaseMap center={ll(ME_DEMO)} zoom={14} zoomControl={false}>
          <Watch onMap={setMap} onView={(b, z) => setView({ b, z })} onHold={(p) => {
            const h = homeAt(p.lat, p.lng)
            setDropped(h)
            setComps(null)
            setSheet({ kind: 'area', id: h.id, h })
          }} />
          {comps && <Circle center={ll(posOf(comps.subject))} radius={1931} pathOptions={{ color: '#5b4bc4', weight: 1.5, dashArray: '5 6', fillColor: '#5b4bc4', fillOpacity: 0.05 }} />}
          {items.map((it) => {
            const on = it.id === selected
            const comp = compIds.has(it.id)
            const dim = !!comps && !comp && it.id !== comps.subject.id
            return it.kind === 'opp' ? (
              <Marker key={it.id} position={ll(posOf(it))} icon={pinIcon(it.o, on, true)} opacity={dim ? 0.3 : 1} zIndexOffset={on ? 3000 : pinZ(it.o) + 1000} eventHandlers={{ click: () => pick(it.id) }} />
            ) : (
              <Marker key={it.id} position={ll(posOf(it))} icon={areaIcon(it.h, zoom, on, comp)} opacity={dim ? 0.3 : 1} zIndexOffset={on ? 3000 : comp ? 2000 : 0} eventHandlers={{ click: () => pick(it.id) }} />
            )
          })}
          {comps && <Marker position={ll(posOf(comps.subject))} icon={subjectIcon} zIndexOffset={4000} />}
          <Marker position={ll(me)} icon={meIcon} zIndexOffset={2500} interactive={false} />
        </BaseMap>
      </div>

      {/* top: search and layers, or the comps you're looking at */}
      <div className="absolute inset-x-0 top-0 z-[500] flex flex-col gap-2.5 bg-gradient-to-b from-white via-white/85 to-transparent px-3 pt-3 pb-4">
        {comps ? (
          <div className="flex items-center gap-2.5 rounded-[22px] border border-line bg-white p-2 pr-3 shadow-[0_4px_16px_rgba(28,46,88,0.12)]">
            <button onClick={() => setComps(null)} aria-label="Back to the map" className="grid size-9 shrink-0 place-items-center rounded-full bg-head text-ink">
              <ArrowLeft className="size-[18px]" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-ink">Comps for {subjectAddr}</p>
              <p className="text-[12.5px] text-muted tabular-nums">
                {comps.list.length ? `${comps.list.length} recent sales within a mile · avg $${avgPpsf}/sqft` : 'No recent sales within a mile'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <label className="flex h-12 items-center gap-2.5 rounded-full border border-line bg-white px-4 shadow-[0_4px_16px_rgba(28,46,88,0.12)]">
              <Search className="size-5 shrink-0 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search an address or a name" aria-label="Search an address or a name" className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint" />
              {q && (
                <button onClick={() => setQ('')} aria-label="Clear search" className="text-muted">
                  <X className="size-4" />
                </button>
              )}
            </label>
            <div className="-mx-3 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none]" role="group" aria-label="Map layers">
              {LAYERS.map((l) => {
                const on = layers.has(l.k)
                return (
                  <button
                    key={l.k}
                    aria-pressed={on}
                    onClick={() => toggle(l.k)}
                    className={cn('flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium shadow-sm', on ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink')}
                  >
                    {l.k !== 'opps' && <span className={cn('size-2 rounded-full', l.k === 'sold' ? 'bg-[#aab1bf]' : l.k === 'active' ? 'bg-[#10a374]' : 'bg-[#e28a12]')} />}
                    {l.label}
                  </button>
                )
              })}
              <button onClick={() => setFilters(true)} aria-label="Filter opportunities" className={cn('flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-white px-3 text-[13.5px] font-medium shadow-sm', filter !== 'all' ? 'border-brand text-brand' : 'border-line text-ink')}>
                <SlidersHorizontal className="size-4" />
                {filter !== 'all' ? FILTERS.find((f) => f.k === filter)?.label : 'Filters'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* count, near me, and the list / map switch */}
      <div className="absolute inset-x-0 bottom-[calc(148px+var(--tab-h))] z-[500] flex items-center justify-between gap-2 px-3">
        <span className="rounded-full bg-white/95 px-3 py-1.5 text-[12.5px] font-medium text-ink-2 shadow-sm">
          {comps ? `${comps.list.length} comps` : `${inView.length}${inView.length === 30 ? '+' : ''} in view`}
        </span>
        <span className="flex items-center gap-2">
          <button onClick={locate} aria-label="Near me" className="grid size-10 place-items-center rounded-full bg-white text-[#2f7cf6] shadow-[0_6px_18px_rgba(28,46,88,0.2)]">
            <LocateFixed className="size-5" />
          </button>
          <button onClick={() => setList(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-[14px] font-medium text-white shadow-[0_6px_18px_rgba(28,46,88,0.3)]">
            <List className="size-4" /> List
          </button>
        </span>
      </div>

      {/* the card row */}
      <div
        ref={row}
        onScroll={onScroll}
        className="absolute inset-x-0 bottom-[calc(12px+var(--tab-h))] z-[500] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[calc(50%-150px)] pb-1 [scrollbar-width:none]"
      >
        {rowItems.map((it) => (
          <div key={it.id} data-item={it.id} className={cn('transition-transform', it.id === selected ? 'scale-100' : 'scale-95 opacity-90')}>
            <Card it={it} onOpen={() => setSheet(it)} distMi={comps && it.kind === 'area' ? (it.h as AreaHome & { distMi?: number }).distMi : undefined} />
          </div>
        ))}
        {!rowItems.length && (
          <div className="w-[300px] shrink-0 rounded-2xl bg-white p-4 text-[14px] text-ink-2 shadow-card">
            {comps ? 'No recent sales within a mile of this home.' : needle ? 'Nothing matches. Try another search.' : 'Nothing in view. Zoom out, or turn on more layers.'}
          </div>
        )}
      </div>

      {/* list view: the same homes, scrolling */}
      {list && (
        <div className="absolute inset-0 z-[600] flex flex-col bg-head">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
            <div>
              <p className="text-[17px] font-semibold text-ink">{comps ? `Comps for ${subjectAddr}` : `${inView.length} homes in view`}</p>
              <p className="text-[12.5px] text-muted">{comps ? `avg $${avgPpsf}/sqft` : LAYERS.filter((l) => layers.has(l.k)).map((l) => l.label).join(' · ') || 'No layers on'}</p>
            </div>
            <button onClick={() => setList(false)} className="inline-flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-[14px] font-medium text-white">
              <MapIcon className="size-4" /> Map
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 pb-[calc(12px+var(--tab-h))]">
            {rowItems.map((it) => (
              <Card key={it.id} it={it} wide onOpen={() => setSheet(it)} distMi={comps && it.kind === 'area' ? (it.h as AreaHome & { distMi?: number }).distMi : undefined} />
            ))}
          </div>
        </div>
      )}

      {/* opportunity filters */}
      {filters && (
        <>
          <button aria-label="Close" onClick={() => setFilters(false)} className="absolute inset-0 z-[740] bg-[rgba(16,24,40,0.18)]" />
          <section role="dialog" aria-label="Filter opportunities" className="absolute inset-x-0 bottom-0 z-[750] rounded-t-[28px] bg-white px-4 pt-2.5 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(28,46,88,0.18)]">
            <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />
            <p className="px-1 pb-2 text-[17px] font-semibold text-ink">Show my opportunities</p>
            <ul role="radiogroup" className="flex flex-col">
              {FILTERS.map((f) => (
                <li key={f.k}>
                  <button
                    role="radio"
                    aria-checked={filter === f.k}
                    onClick={() => {
                      setFilter(f.k)
                      setLayers((s) => new Set(s).add('opps'))
                      setFilters(false)
                    }}
                    className={cn('flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15.5px]', filter === f.k ? 'bg-[var(--brand-primary-subtle)] font-semibold text-brand' : 'text-ink')}
                  >
                    {f.label}
                    {filter === f.k && <span className="size-2.5 rounded-full bg-brand" />}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {sheet && <HomeSheet it={sheet} onClose={() => setSheet(null)} onComps={() => showComps(sheet)} />}
    </div>
  )
}
