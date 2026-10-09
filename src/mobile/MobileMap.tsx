import L from 'leaflet'
import { List, Map as MapIcon, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { img, TagPill, tagsOf } from '@/components/home/TopOpportunities'
import { BaseMap, TILE_BOUNDS } from '@/components/map/BaseMap'
import { pinIcon, pinZ } from '@/components/map/pins'
import { AGENT } from '@/data/tiers'
import { gain, money } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { URGENCY_SHORT } from '@/lib/urgency'
import { cn } from '@/lib/utils'

// Mobile map, Redfin/Zillow style: the whole book on a full-screen map. Search and filter chips float on top,
// pins carry the Revive upside, and a swipeable card row at the bottom follows the selected pin. "List" turns
// the same results into a scrolling list. A card opens the home.

type Filter = 'all' | 'go' | 'listings' | 'seller' | 'adu' | 'projects' | 'referrals'
const FILTERS: { k: Filter; label: string }[] = [
  { k: 'all', label: 'All' },
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

const [[S, W], [N, E]] = TILE_BOUNDS
const onMap = (o: Opportunity) => o.property.lat > S && o.property.lat < N && o.property.lng > W && o.property.lng < E
const pt = (o: Opportunity) => [o.property.lat, o.property.lng] as [number, number]
// room for the search bar on top and the card row below
const PAD = { paddingTopLeft: [28, 150] as L.PointTuple, paddingBottomRight: [28, 230] as L.PointTuple, maxZoom: 13 }

function Fit({ pts, k }: { pts: [number, number][]; k: string }) {
  const map = useMap()
  useEffect(() => {
    const fit = () => {
      map.invalidateSize()
      if (pts.length > 1) map.fitBounds(pts, PAD)
      else if (pts.length === 1) map.setView(pts[0], 13)
    }
    fit()
    const t = setTimeout(fit, 200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, map])
  return null
}

/** Keep the selected home in view above the card row. */
function Follow({ o }: { o?: Opportunity }) {
  const map = useMap()
  useEffect(() => {
    if (!o) return
    const p = map.latLngToContainerPoint(pt(o))
    const size = map.getSize()
    if (p.x < 40 || p.x > size.x - 40 || p.y < 150 || p.y > size.y - 240) {
      // move it to the middle of the clear band between the search bar and the cards
      const target = L.point(size.x / 2, (150 + size.y - 240) / 2)
      map.panBy(p.subtract(target), { animate: true })
    }
  }, [o, map])
  return null
}

function Card({ o, wide }: { o: Opportunity; wide?: boolean }) {
  const why = o.reasons[0]
  return (
    <Link to={`/m/property/${o.id}`} className={cn('flex gap-3 rounded-2xl bg-white p-2.5 shadow-[0_8px_24px_rgba(28,46,88,0.16)]', wide ? 'w-full shadow-card' : 'w-[300px] shrink-0 snap-center')}>
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
          {(o.urgency === 'now' || o.urgency === 'soon') && (
            <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold', o.urgency === 'now' ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--brand-primary-subtle)] text-brand')}>{URGENCY_SHORT[o.urgency]}</span>
          )}
          {tagsOf(o)
            .slice(0, 1)
            .map((t) => (
              <TagPill key={t} tag={t} />
            ))}
          {!tagsOf(o).length && why && <span className="truncate text-[11.5px] text-muted">{why}</span>}
        </span>
      </span>
    </Link>
  )
}

export default function MobileMap() {
  const all = useOpportunities()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [list, setList] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const row = useRef<HTMLDivElement>(null)
  const needle = q.trim().toLowerCase()
  const shown = useMemo(
    () =>
      all
        .filter(onMap)
        .filter((o) => passes(o, filter))
        .filter((o) => !needle || [o.property.address, o.property.city, o.person?.name].some((f) => f?.toLowerCase().includes(needle))),
    [all, filter, needle],
  )
  const activeOpp = shown.find((o) => o.id === active) ?? shown[0]

  // swiping the card row selects the card in the middle
  const onScroll = () => {
    const el = row.current
    if (!el) return
    const mid = el.scrollLeft + el.clientWidth / 2
    let best: string | null = null
    let d = Infinity
    for (const c of Array.from(el.children) as HTMLElement[]) {
      const cm = c.offsetLeft + c.offsetWidth / 2
      if (Math.abs(cm - mid) < d) {
        d = Math.abs(cm - mid)
        best = c.dataset.opp ?? null
      }
    }
    if (best && best !== active) setActive(best)
  }
  const pickPin = (id: string) => {
    setActive(id)
    const el = row.current?.querySelector<HTMLElement>(`[data-opp="${id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }
  useEffect(() => setActive(null), [filter, needle])

  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        <BaseMap center={[AGENT.office.lat, AGENT.office.lng]} zoom={11} bounds={shown.map(pt)} zoomControl={false}>
          <Fit pts={shown.map(pt)} k={`${filter}|${needle}`} />
          <Follow o={activeOpp} />
          {shown.map((o) => (
            <Marker
              key={o.id}
              position={pt(o)}
              icon={pinIcon(o, o.id === activeOpp?.id, true)}
              zIndexOffset={o.id === activeOpp?.id ? 2000 : pinZ(o)}
              eventHandlers={{ click: () => pickPin(o.id) }}
            />
          ))}
        </BaseMap>
      </div>

      {/* search and filters float over the map */}
      <div className="absolute inset-x-0 top-0 z-[500] flex flex-col gap-2.5 bg-gradient-to-b from-white via-white/85 to-transparent px-3 pt-3 pb-4">
        <label className="flex h-12 items-center gap-2.5 rounded-full border border-line bg-white px-4 shadow-[0_4px_16px_rgba(28,46,88,0.12)]">
          <Search className="size-5 shrink-0 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search an address or a name" aria-label="Search an address or a name" className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint" />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" className="text-muted">
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none]" role="radiogroup" aria-label="Filter">
          {FILTERS.map((f) => (
            <button
              key={f.k}
              role="radio"
              aria-checked={filter === f.k}
              onClick={() => setFilter(f.k)}
              className={cn('h-9 shrink-0 rounded-full border px-3.5 text-[13.5px] font-medium shadow-sm', filter === f.k ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink')}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* count and the list / map switch */}
      <div className="absolute inset-x-0 bottom-[148px] z-[500] flex items-center justify-between px-3">
        <span className="rounded-full bg-white/95 px-3 py-1.5 text-[12.5px] font-medium text-ink-2 shadow-sm">
          {shown.length} {shown.length === 1 ? 'home' : 'homes'}
        </span>
        <button onClick={() => setList(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-[14px] font-medium text-white shadow-[0_6px_18px_rgba(28,46,88,0.3)]">
          <List className="size-4" /> List
        </button>
      </div>

      {/* the card row */}
      <div
        ref={row}
        onScroll={onScroll}
        className="absolute inset-x-0 bottom-3 z-[500] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[calc(50%-150px)] pb-1 [scrollbar-width:none]"
      >
        {shown.map((o) => (
          <div key={o.id} data-opp={o.id} className={cn('transition-transform', o.id === activeOpp?.id ? 'scale-100' : 'scale-95 opacity-90')}>
            <Card o={o} />
          </div>
        ))}
        {!shown.length && (
          <div className="w-[300px] shrink-0 rounded-2xl bg-white p-4 text-[14px] text-ink-2 shadow-card">
            {all.length ? 'No homes match. Try another filter.' : 'Connect your listings and CRM to see your opportunities here.'}
            {!all.length && (
              <Link to="/m/opportunities" className="mt-2 block font-medium text-brand">
                Connect now
              </Link>
            )}
          </div>
        )}
      </div>

      {/* list view: the same results, scrolling */}
      {list && (
        <div className="absolute inset-0 z-[600] flex flex-col bg-head">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-3">
            <div>
              <p className="text-[17px] font-semibold text-ink">{shown.length} homes</p>
              <p className="text-[12.5px] text-muted">{FILTERS.find((f) => f.k === filter)?.label}{needle ? ` · “${q.trim()}”` : ''}</p>
            </div>
            <button onClick={() => setList(false)} className="inline-flex h-10 items-center gap-2 rounded-full bg-navy px-4 text-[14px] font-medium text-white">
              <MapIcon className="size-4" /> Map
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
            {shown.map((o) => (
              <Card key={o.id} o={o} wide />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
