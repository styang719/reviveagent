import L from 'leaflet'
import { ChevronRight, List, LocateFixed, Map as MapIcon, MapPin, Navigation, Search, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Marker, useMap, useMapEvents } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { BaseMap, TILE_BOUNDS } from '@/components/map/BaseMap'
import { cn } from '@/lib/utils'
import { miles } from '../areaHomes'
import { DEMO_HERE, LISTINGS, PLACES, profitOf, type Listing, type Place } from './data'
import { detailAt, hereIcon, pinIcon, pinZ, short, type Detail } from './pins'
import { activeFilters, DEFAULT_FILTERS, passes, type Filters } from './filters'
import { FilterSheet, SubmitSheet } from './Sheets'
import { ReviveMark, SummaryActions, SummaryBody, SummaryHeader, TierBadge } from './Summary'
import './flip360.css'

// Revive Flip360 opportunity map (mobile). Every active MLS listing in view stays on the map as a quiet price
// tag; Revive's intelligence layer marks the few that are worth pursuing (green) and the ones that might be
// (outlined green). Tapping any pin answers "is this worth pursuing, and why?" in a bottom sheet: a peek with
// three numbers, then the full case (reasons, deal math, open questions, comps) and Submit to Flip360.

type View = { b: L.LatLngBounds; z: number }
const ll = (l: { lat: number; lng: number }) => [l.lat, l.lng] as [number, number]
const world = L.latLngBounds(TILE_BOUNDS)
const rank = { qualified: 0, potential: 1, standard: 2 } as const
const TOP = 132 // the search bar and the count row

const DONE_KEY = 'rv-f3-done'
function loadDone(): Record<string, true> {
  try {
    return JSON.parse(sessionStorage.getItem(DONE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

/** Hands the Leaflet map out and reports what's in view; a tap on the map itself clears the selection. */
function Watch({ gotMap, changed, tapped }: { gotMap: (m: L.Map) => void; changed: (v: View) => void; tapped: () => void }) {
  const map = useMap()
  useEffect(() => {
    gotMap(map)
    const t = setTimeout(() => (map.invalidateSize(), changed({ b: map.getBounds(), z: map.getZoom() })), 120)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])
  useMapEvents({
    moveend: () => changed({ b: map.getBounds(), z: map.getZoom() }),
    click: tapped,
  })
  return null
}

/** One pin. The icon is rebuilt only when its look changes; selection toggles a class so it animates. */
function Pin({ l, on, detail, done, pick }: { l: Listing; on: boolean; detail: Detail; done: boolean; pick: (l: Listing) => void }) {
  const ref = useRef<L.Marker>(null)
  const icon = useMemo(() => pinIcon(l, { detail, done }), [l, detail, done])
  useEffect(() => {
    const m = ref.current
    // after Leaflet has drawn the new icon
    const t = requestAnimationFrame(() => {
      m?.getElement()?.querySelector('[data-pin]')?.classList.toggle('on', on)
      m?.setZIndexOffset(pinZ(l, on))
    })
    return () => cancelAnimationFrame(t)
  }, [on, icon, l])
  return (
    <Marker
      ref={ref}
      position={ll(l)}
      icon={icon}
      zIndexOffset={pinZ(l, on)}
      keyboard
      title={`${l.address}, ${short(l.price)}${l.tier === 'standard' ? '' : l.tier === 'qualified' ? ', Flip360 opportunity' : ', potential opportunity'}`}
      eventHandlers={{ click: () => pick(l) }}
    />
  )
}

/** The small card for a Revive home in the bottom strip and the list. */
function OppCard({ l, done, distMi, onOpen, wide }: { l: Listing; done: boolean; distMi: number; onOpen: () => void; wide?: boolean }) {
  return (
    <button onClick={onOpen} className={cn('flex items-center gap-3 rounded-2xl bg-white p-2 pr-3 text-left', wide ? 'w-full border border-line' : 'w-[272px] shrink-0 snap-start border border-line-soft shadow-[0_1px_3px_rgba(16,24,40,0.06)]')}>
      <img src={l.photos[0]} alt="" className="size-16 shrink-0 rounded-xl object-cover" />
      <span className="min-w-0 flex-1">
        <TierBadge l={l} done={done} small />
        <span className="mt-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-[14.5px] font-semibold text-ink tabular-nums">{short(l.price)}</span>
          <span className={cn('shrink-0 text-[12.5px] font-semibold tabular-nums', l.tier === 'qualified' ? 'text-[var(--green)]' : 'text-muted')}>
            {l.tier === 'qualified' ? `+${short(profitOf(l))} est.` : 'Needs review'}
          </span>
        </span>
        <span className="block truncate text-[12.5px] text-muted">
          {l.address} · {distMi.toFixed(1)} mi
        </span>
      </span>
    </button>
  )
}

function StandardRow({ l, distMi, onOpen }: { l: Listing; distMi: number; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center gap-3 py-2.5 text-left">
      <img src={l.photos[0]} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[14px] font-medium text-ink">{l.address}</span>
          <span className="shrink-0 text-[14px] font-semibold text-ink tabular-nums">{short(l.price)}</span>
        </span>
        <span className="block truncate text-[12.5px] text-muted">
          {l.check?.verdict} · {l.beds} bd · {l.sqft.toLocaleString()} sqft · {distMi.toFixed(1)} mi
        </span>
      </span>
    </button>
  )
}

export default function OpportunityMap() {
  const navigate = useNavigate()
  const [map, setMap] = useState<L.Map | null>(null)
  const [view, setView] = useState<View | null>(null)
  const [me, setMe] = useState(DEMO_HERE)
  const [selId, setSelId] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [submitFor, setSubmitFor] = useState<Listing | null>(null)
  const [done, setDone] = useState<Record<string, true>>(loadDone)
  const [saved, setSaved] = useState<Set<string>>(() => new Set())
  const [list, setList] = useState(false)
  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const sel = LISTINGS.find((l) => l.id === selId) ?? null
  const shown = useMemo(() => LISTINGS.filter((l) => passes(l, filters) || l.id === selId), [filters, selId])
  const inView = useMemo(() => (view ? shown.filter((l) => view.b.contains(ll(l))) : []), [shown, view])
  const dist = useCallback((l: Listing) => miles(me, l), [me])
  const revive = inView.filter((l) => l.tier !== 'standard').sort((a, b) => rank[a.tier] - rank[b.tier] || dist(a) - dist(b))
  const plain = inView.filter((l) => l.tier === 'standard').sort((a, b) => dist(a) - dist(b))
  const nQual = revive.filter((l) => l.tier === 'qualified').length
  const nPot = revive.length - nQual
  // when nothing qualified is in view: the nearest qualified home outside it (else the nearest potential one)
  const nearest = useMemo(() => {
    if (!view) return null
    const c = view.b.getCenter()
    return shown.filter((l) => l.tier !== 'standard' && !view.b.contains(ll(l))).sort((a, b) => rank[a.tier] - rank[b.tier] || miles(c, a) - miles(c, b))[0] ?? null
  }, [shown, view])
  const goNearest = () => {
    if (!nearest || !map) return
    map.flyTo(ll(nearest), Math.max(14, map.getZoom()), { duration: 0.7 })
    setTimeout(() => pick(nearest), 750)
  }

  useEffect(() => {
    try {
      sessionStorage.setItem(DONE_KEY, JSON.stringify(done))
    } catch {
      /* storage blocked: submissions last until reload */
    }
  }, [done])

  // ── the sheet: peek (header + actions) or full; drag the header to move between them ──
  const page = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  const foot = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ page: 760, head: 220, foot: 76 })
  const [drag, setDrag] = useState<number | null>(null)
  const dragFrom = useRef<number | null>(null)
  useLayoutEffect(() => {
    const measure = () => setDims({ page: page.current?.clientHeight ?? 760, head: head.current?.offsetHeight ?? 220, foot: foot.current?.offsetHeight ?? 76 })
    measure()
    const ro = new ResizeObserver(measure)
    for (const el of [page.current, head.current, foot.current]) if (el) ro.observe(el)
    return () => ro.disconnect()
  }, [sel?.id])
  const sheetH = dims.page - 56
  const peek = dims.head + dims.foot
  const restY = full ? 0 : Math.max(0, sheetH - peek)
  const y = Math.min(sheetH, Math.max(0, restY + (drag ?? 0)))

  const close = useCallback(() => {
    setSelId(null)
    setFull(false)
  }, [])

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    dragFrom.current = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onMove = (e: React.PointerEvent) => {
    if (dragFrom.current != null) setDrag(e.clientY - dragFrom.current)
  }
  const onUp = () => {
    if (dragFrom.current == null) return
    const d = drag ?? 0
    dragFrom.current = null
    setDrag(null)
    if (Math.abs(d) < 6) return setFull((f) => !f) // a tap toggles
    if (d < -50) setFull(true)
    else if (d > 50) {
      if (full) setFull(false)
      else close()
    }
  }

  // keep the selected pin visible above the sheet
  const reveal = useCallback(
    (l: Listing, sheetTop: number) => {
      if (!map) return
      const size = map.getSize()
      const p = map.latLngToContainerPoint(ll(l))
      const top = TOP + 24
      const bottom = sheetTop - 36
      if (p.y > top && p.y < bottom && p.x > 30 && p.x < size.x - 30) return
      map.panBy([p.x - size.x / 2, p.y - (top + bottom) / 2], { animate: true, duration: 0.35 })
    },
    [map],
  )
  const pick = useCallback(
    (l: Listing) => {
      setSelId(l.id)
      setFull(false)
      setSearching(false)
      setList(false)
      input.current?.blur()
      // the peek is about 300px; the real height is measured once it's drawn
      requestAnimationFrame(() => reveal(l, (page.current?.clientHeight ?? 760) - (head.current?.offsetHeight ?? 230) - (foot.current?.offsetHeight ?? 76)))
    },
    [reveal],
  )

  // ── search ──
  const needle = q.trim().toLowerCase()
  const placeHits = PLACES.filter((p) => !needle || p.label.toLowerCase().includes(needle) || p.sub.toLowerCase().includes(needle))
  const homeHits = needle ? LISTINGS.filter((l) => `${l.address} ${l.area} ${l.zip}`.toLowerCase().includes(needle)).sort((a, b) => rank[a.tier] - rank[b.tier]).slice(0, 5) : []
  const goPlace = (p: Place) => {
    setQ(p.label)
    setSearching(false)
    close()
    input.current?.blur()
    map?.flyTo(ll(p), p.zoom, { duration: 0.8 })
  }
  const goHome = (l: Listing) => {
    setQ(l.address)
    map?.setView(ll(l), Math.max(map.getZoom(), 14.5), { animate: true })
    // a home the filters hide still opens: it's what the agent asked for
    setTimeout(() => pick(l), 260)
  }

  const locate = () => {
    setSearching(false)
    const fallback = (why: string) => {
      setMe(DEMO_HERE)
      map?.flyTo(ll(DEMO_HERE), 14.5, { duration: 0.6 })
      toast(why, { description: 'Showing the demo location in Eagle Rock.' })
    }
    if (!navigator.geolocation) return fallback('Location isn’t available here')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here = { lat: p.coords.latitude, lng: p.coords.longitude }
        if (!world.contains(ll(here))) return fallback('You’re outside the sample map area')
        setMe(here)
        map?.flyTo(ll(here), 14.5, { duration: 0.6 })
      },
      () => fallback('Location is off for this page'),
      { timeout: 5000 },
    )
  }

  const count = (f: Filters) => {
    const ls = LISTINGS.filter((l) => passes(l, f) && (!view || view.b.contains(ll(l))))
    return { all: ls.length, revive: ls.filter((l) => l.tier !== 'standard').length }
  }

  const submitted = useCallback(() => {
    if (!submitFor) return
    setDone((d) => ({ ...d, [submitFor.id]: true }))
    setFull(false) // back on the map, the home stays open as a peek
  }, [submitFor])
  const ask = (l: Listing) =>
    navigate(`/m/ai?q=${encodeURIComponent(l.tier === 'standard' ? `Could ${l.address} work as a flip? It's listed at ${short(l.price)}.` : `Walk me through the Flip360 numbers on ${l.address}.`)}`)
  const share = async (l: Listing) => {
    const text = `${l.address}, ${l.area}: ${short(l.price)}`
    try {
      if (navigator.share) return await navigator.share({ title: l.address, text })
      await navigator.clipboard.writeText(text)
      toast.success('Copied to share', { description: text })
    } catch {
      /* share sheet dismissed */
    }
  }
  const save = (l: Listing) =>
    setSaved((s) => {
      const n = new Set(s)
      if (n.has(l.id)) n.delete(l.id)
      else {
        n.add(l.id)
        toast.success('Saved', { description: `${l.address} is in your saved homes.` })
      }
      return n
    })

  const detail = detailAt(view?.z ?? 14)
  const nFilters = activeFilters(filters)

  return (
    <div ref={page} className="relative h-full overflow-hidden [&_.leaflet-bottom]:mb-[calc(var(--tab-h)+2px)]">
      <div className="absolute inset-0">
        <BaseMap center={ll(PLACES[0])} zoom={PLACES[0].zoom} zoomControl={false} minZoom={12} maxZoom={15.5}>
          <Watch gotMap={setMap} changed={setView} tapped={() => (setSearching(false), close())} />
          {shown.map((l) => (
            <Pin key={l.id} l={l} on={l.id === selId} detail={detail} done={!!done[l.id]} pick={pick} />
          ))}
          <Marker position={ll(me)} icon={hereIcon} interactive={false} zIndexOffset={1000} />
        </BaseMap>
      </div>

      {/* ── top: search, current location, filters; then what's in view ── */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[600] bg-gradient-to-b from-white/90 via-white/60 to-transparent px-3 pt-3 pb-6">
        <div className="pointer-events-auto flex items-center gap-2">
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-line bg-white px-4 shadow-[0_4px_16px_rgba(28,46,88,0.12)]">
            <Search className="size-[18px] shrink-0 text-muted" />
            <input
              ref={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => (setSearching(true), close())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (homeHits[0]) goHome(homeHits[0])
                  else if (placeHits[0]) goPlace(placeHits[0])
                }
                if (e.key === 'Escape') {
                  setSearching(false)
                  input.current?.blur()
                }
              }}
              placeholder="Search neighborhood or address"
              aria-label="Search neighborhood or address"
              enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
            />
            {q && (
              <button onClick={() => (setQ(''), input.current?.focus())} aria-label="Clear search" className="-mr-1 grid size-7 place-items-center rounded-full text-muted">
                <X className="size-4" />
              </button>
            )}
          </label>
          {searching ? (
            <button onClick={() => (setSearching(false), input.current?.blur())} className="h-12 px-2 text-[15px] font-medium text-ink">
              Cancel
            </button>
          ) : (
            <>
              <button onClick={locate} aria-label="Current location" className="grid size-12 shrink-0 place-items-center rounded-full border border-line bg-white text-[#2f7cf6] shadow-[0_4px_16px_rgba(28,46,88,0.12)] active:bg-head">
                <LocateFixed className="size-5" />
              </button>
              <button onClick={() => setFilterOpen(true)} aria-label={nFilters ? `Filters, ${nFilters} on` : 'Filters'} className="relative grid size-12 shrink-0 place-items-center rounded-full border border-line bg-white text-ink shadow-[0_4px_16px_rgba(28,46,88,0.12)] active:bg-head">
                <SlidersHorizontal className="size-5" />
                {nFilters > 0 && <span className="absolute -top-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-ink text-[11px] font-semibold text-white">{nFilters}</span>}
              </button>
            </>
          )}
        </div>

        {!searching && (
          <div className="pointer-events-auto mt-2.5 flex items-center justify-between gap-2">
            <p className="flex h-8 items-center gap-2.5 rounded-full bg-white/95 px-3 text-[12.5px] text-ink-2 shadow-[0_1px_4px_rgba(16,24,40,0.12)] tabular-nums" aria-live="polite">
              <span className="flex items-center gap-1.5 font-semibold text-[var(--green)]">
                <span className="size-2.5 rounded-full bg-[var(--green)]" />
                {nQual} Flip360
              </span>
              {filters.potential && (
                <span className="flex items-center gap-1.5 font-medium text-[var(--green)]">
                  <span className="size-2.5 rounded-full border-[1.5px] border-[var(--green)] bg-white" />
                  {nPot} to review
                </span>
              )}
              {filters.show === 'all' && (
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full border border-[#c3c9d3] bg-white" />
                  {plain.length} listings
                </span>
              )}
            </p>
            <button onClick={() => setList(true)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/95 px-3 text-[12.5px] font-medium text-ink shadow-[0_1px_4px_rgba(16,24,40,0.12)]">
              <List className="size-3.5" /> List
            </button>
          </div>
        )}

        {/* search suggestions */}
        {searching && (
          <div className="pointer-events-auto mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_12px_32px_rgba(28,46,88,0.16)]">
            {!needle && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={locate} className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-head">
                <Navigation className="size-[18px] text-[#2f7cf6]" />
                <span className="text-[15px] font-medium text-ink">Current location</span>
              </button>
            )}
            {placeHits.map((p) => (
              <button key={p.id} onMouseDown={(e) => e.preventDefault()} onClick={() => goPlace(p)} className="flex w-full items-center gap-3 border-t border-line-soft px-4 py-3 text-left first:border-t-0 active:bg-head">
                <MapPin className="size-[18px] text-muted" />
                <span className="min-w-0">
                  <span className="block text-[15px] font-medium text-ink">{p.label}</span>
                  <span className="block text-[12.5px] text-muted">
                    {p.sub} · {LISTINGS.filter((l) => l.tier === 'qualified' && miles(p, l) < 1.2).length} Flip360 nearby
                  </span>
                </span>
              </button>
            ))}
            {homeHits.map((l) => (
              <button key={l.id} onMouseDown={(e) => e.preventDefault()} onClick={() => goHome(l)} className="flex w-full items-center gap-3 border-t border-line-soft px-4 py-3 text-left active:bg-head">
                {l.tier === 'standard' ? <MapPin className="size-[18px] text-muted" /> : <ReviveMark className={cn('h-[18px] w-4', 'text-[var(--green)]')} />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium text-ink">{l.address}</span>
                  <span className="block truncate text-[12.5px] text-muted">
                    {short(l.price)} · {l.area}
                    {l.tier === 'qualified' ? ' · Flip360 opportunity' : l.tier === 'potential' ? ' · Potential' : ''}
                  </span>
                </span>
              </button>
            ))}
            {needle && !placeHits.length && !homeHits.length && <p className="px-4 py-3.5 text-[14px] text-muted">No neighborhood or listing matches “{q.trim()}”.</p>}
          </div>
        )}
      </div>

      {/* ── bottom, nothing selected: Revive's read on what's in view ── */}
      {!sel && !searching && view && (
        <section aria-label="Revive opportunities in view" className="f3-rise absolute inset-x-3 bottom-[calc(var(--tab-h)+18px)] z-[500] rounded-[22px] bg-white py-3 shadow-[0_10px_32px_rgba(28,46,88,0.18)]">
          {revive.length ? (
            <>
              <div className="flex items-center justify-between gap-2 px-3.5 pb-2.5">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <ReviveMark className="h-[15px] w-[13px] text-[var(--green)]" />
                  {nQual ? `${nQual} worth pursuing here` : 'Nothing qualified here yet'}
                </p>
                <p className="text-[12px] text-muted tabular-nums">Revive checked {inView.length}</p>
              </div>
              <div className="flex snap-x snap-mandatory scroll-px-3 gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
                {revive.map((l) => (
                  <OppCard key={l.id} l={l} done={!!done[l.id]} distMi={dist(l)} onOpen={() => pick(l)} />
                ))}
              </div>
              {!nQual && nearest?.tier === 'qualified' && (
                <button onClick={goNearest} className="mx-3.5 mt-2.5 flex items-center gap-1 text-[13px] font-semibold text-[var(--green)]">
                  Nearest Flip360: {nearest.address} · {miles(view.b.getCenter(), nearest).toFixed(1)} mi <ChevronRight className="size-4" />
                </button>
              )}
            </>
          ) : (
            <div className="px-3.5">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                <ReviveMark className="h-[15px] w-[13px] text-muted" />
                No Flip360 opportunities in view
              </p>
              <p className="mt-1 text-[13px] leading-[19px] text-muted">
                {plain.length ? `Revive checked the ${plain.length} listings here. None pencil out as a flip; tap any to see why.` : 'No active listings in this part of the map.'}
              </p>
              {nearest && (
                <button onClick={goNearest} className="mt-2.5 flex w-full items-center gap-3 rounded-xl bg-head p-2 pr-3 text-left active:bg-line-soft">
                  <img src={nearest.photos[0]} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] text-muted">Nearest {nearest.tier === 'qualified' ? 'Flip360 opportunity' : 'potential'}</span>
                    <span className="block truncate text-[14px] font-semibold text-ink">
                      {nearest.address} · {miles(view.b.getCenter(), nearest).toFixed(1)} mi
                    </span>
                  </span>
                  <ChevronRight className="size-5 text-muted" />
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── bottom, a home selected: the opportunity summary ── */}
      {sel && (
        <>
          {full && <button aria-label="Collapse" onClick={() => setFull(false)} className="absolute inset-0 z-[740] bg-[rgba(16,24,40,0.2)]" />}
          <section
            role="dialog"
            aria-label={`${sel.address}: ${sel.tier === 'qualified' ? 'Flip360 opportunity' : sel.tier === 'potential' ? 'potential opportunity, needs review' : 'MLS listing'}`}
            className={cn('absolute inset-x-0 bottom-0 z-[750] flex flex-col rounded-t-[26px] bg-white shadow-[0_-10px_36px_rgba(28,46,88,0.18)]', drag == null && 'transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]')}
            style={{ height: sheetH, transform: `translateY(${y}px)` }}
          >
            <div ref={head} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} className="shrink-0 touch-none pb-3 select-none">
              <button onClick={() => setFull((f) => !f)} aria-label={full ? 'Show less' : 'Show the full case'} aria-expanded={full} className="mx-auto block px-6 pt-2.5 pb-1.5">
                <span className="block h-1.5 w-10 rounded-full bg-line" />
              </button>
              <SummaryHeader l={sel} done={!!done[sel.id]} distMi={dist(sel)} onClose={close} />
              {!full && sel.tier !== 'standard' && (
                <button onClick={() => setFull(true)} className="mx-4 mt-2.5 flex items-center gap-1 text-[13px] font-semibold text-[var(--green)]">
                  {sel.tier === 'qualified' ? 'Why it qualifies & the deal math' : 'What Revive still needs'} <ChevronRight className="size-4" />
                </button>
              )}
            </div>
            <div className={cn('min-h-0 flex-1 overscroll-contain', full ? 'overflow-y-auto' : 'overflow-hidden')} style={{ paddingBottom: dims.foot }}>
              <SummaryBody key={sel.id} l={sel} onAsk={() => ask(sel)} />
            </div>
          </section>
          <div ref={foot} className="absolute inset-x-0 bottom-0 z-[760]">
            <SummaryActions l={sel} done={!!done[sel.id]} saved={saved.has(sel.id)} onPrimary={() => setSubmitFor(sel)} onSave={() => save(sel)} onShare={() => share(sel)} onAsk={() => ask(sel)} />
          </div>
        </>
      )}

      {/* ── list: the same homes, Revive's first ── */}
      {list && (
        <div className="f3-rise absolute inset-0 z-[800] flex flex-col bg-white pt-[env(safe-area-inset-top)]">
          <header className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
            <div>
              <h2 className="text-[17px] font-semibold text-ink">In this view</h2>
              <p className="text-[12.5px] text-muted tabular-nums">
                {nQual} Flip360 · {nPot} to review · {plain.length} other listings
              </p>
            </div>
            <button onClick={() => setList(false)} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-[14px] font-medium text-white">
              <MapIcon className="size-4" /> Map
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-[calc(var(--tab-h)+16px)]">
            {revive.length > 0 ? (
              <div className="flex flex-col gap-2">
                {revive.map((l) => (
                  <OppCard key={l.id} l={l} done={!!done[l.id]} distMi={dist(l)} wide onOpen={() => pick(l)} />
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-head px-4 py-3.5 text-[13.5px] text-muted">No Revive opportunities in this view. Zoom out or move the map.</p>
            )}
            {plain.length > 0 && (
              <>
                <h3 className="mt-5 mb-1 text-[13px] font-semibold text-ink-2">Other MLS listings · not a Flip360 fit</h3>
                <div className="divide-y divide-line-soft">
                  {plain.map((l) => (
                    <StandardRow key={l.id} l={l} distMi={dist(l)} onOpen={() => pick(l)} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {filterOpen && (
        <FilterSheet
          value={filters}
          count={count}
          onClose={() => setFilterOpen(false)}
          onApply={(f) => {
            setFilters(f)
            setFilterOpen(false)
            if (sel && !passes(sel, f)) close()
          }}
        />
      )}
      {submitFor && <SubmitSheet l={submitFor} onClose={() => setSubmitFor(null)} onDone={submitted} />}
    </div>
  )
}
