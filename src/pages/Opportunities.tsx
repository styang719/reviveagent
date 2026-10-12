import { ArrowRight, LayoutGrid, Map as MapIcon, MapPin, PhoneCall, Plus, Search, Users } from 'lucide-react'
import type L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { Link, useSearchParams } from 'react-router-dom'
import { attentionRank, OppDrawer } from '@/components/home/TopOpportunities'
import { OppTable } from '@/components/opportunity/OppTable'
import { ValueDrawer } from '@/components/opportunity/ValueDrawer'
import { BaseMap, TILE_BOUNDS } from '@/components/map/BaseMap'
import { pinIcon, pinZ } from '@/components/map/pins'
import { Button } from '@/components/ui/button'
import { AGENT } from '@/data/tiers'
import { photoUrl } from '@/lib/assets'
import { gain, money, plural } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { YourBook } from '@/components/home/YourBook'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

// Prospecting: homes the agent could win, not ones they already work on. Two sources, as tabs: their own
// contacts (CRM and lead form), and the nearby market (other agents' listings that expired or were
// withdrawn, so the owner is free to talk). Their own listings, reports and projects live in Homes; Revive
// referrals in Lead tracking. A side nav like Homes (views, then sources), status tabs per source, list and map.

const COMMISSION = 0.025 // listing side
const LIKELY = 80

type Tab = 'contacts' | 'market'
type View = 'go' | 'all' | Tab
const TABS: { k: Tab; label: string; hint: string }[] = [
  { k: 'contacts', label: 'Your contacts', hint: 'Homeowners in your CRM and lead form, ranked by who to call first.' },
  { k: 'market', label: 'Nearby market', hint: 'Listings near you that expired or were withdrawn. The owner is free to talk, and Revive gives you a reason to call.' },
]
const inTab = (o: Opportunity, t: Tab) => (t === 'market' ? o.property.source === 'market' : o.property.source === 'contacts' || o.property.source === 'leadform')

type Filter = 'all' | 'go' | 'seller' | 'reno' | 'adu' | 'expired' | 'withdrawn'
const FILTERS: Record<Tab, { k: Filter; label: string }[]> = {
  contacts: [
    { k: 'all', label: 'All' },
    { k: 'go', label: 'Worth a call' },
    { k: 'seller', label: 'Likely seller' },
    { k: 'reno', label: 'Renovation' },
    { k: 'adu', label: 'ADU room' },
  ],
  market: [
    { k: 'all', label: 'All' },
    { k: 'expired', label: 'Expired' },
    { k: 'withdrawn', label: 'Withdrawn' },
  ],
}
const worth = (o: Opportunity) => o.urgency === 'now' || o.urgency === 'soon'
const passes = (o: Opportunity, f: Filter) =>
  f === 'all' ||
  (f === 'go' && worth(o)) ||
  (f === 'seller' && (o.person?.sellScore ?? 0) >= LIKELY) ||
  (f === 'reno' && o.tags.includes('Renovation')) ||
  (f === 'adu' && o.tags.includes('ADU room')) ||
  (f === 'expired' && o.property.facts.expiredDaysAgo !== undefined) ||
  (f === 'withdrawn' && o.property.facts.withdrawnDaysAgo !== undefined)

type Sort = 'recommended' | 'score' | 'value' | 'upside'
const SORTS: { k: Sort; label: string }[] = [
  { k: 'recommended', label: 'Recommended' },
  { k: 'score', label: 'Selling score' },
  { k: 'upside', label: 'Revive upside' },
  { k: 'value', label: 'Value' },
]

const landOf = (o: Opportunity) => (o.tags.includes('ADU room') && o.property.lot ? o.property.lot - o.property.sqft : 0)
// the map covers the agent's market; a home outside it stays in the list but off the map
const [[S, W], [N, E]] = TILE_BOUNDS
const onMap = (o: Opportunity) => o.property.lat > S && o.property.lat < N && o.property.lng > W && o.property.lng < E

/** Refit the map to what's listed whenever the filter or search changes. */
function Fit({ pts, k }: { pts: [number, number][]; k: string }) {
  const map = useMap()
  useEffect(() => {
    const fit = () => {
      map.invalidateSize()
      if (pts.length > 1) map.fitBounds(pts, { padding: [48, 48], maxZoom: 13 })
      else if (pts.length === 1) map.setView(pts[0], 13)
    }
    fit()
    const t = setTimeout(fit, 250) // the sticky panel settles its height after the first paint
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k, map])
  return null
}


type MapLayout = 'split' | 'strip' | 'panel'
const MAP_LAYOUTS: { k: MapLayout; label: string }[] = [
  { k: 'split', label: 'A · List + map' },
  { k: 'strip', label: 'B · Map strip' },
  { k: 'panel', label: 'C · Table, map on demand' },
]

/** A · the list as compact cards for the split view: photo, who, why now, value and upside. */
function CompactList({ opps, onOpen, hover, onHover }: { opps: Opportunity[]; onOpen: (id: string) => void; hover: string | null; onHover: (id: string | null) => void }) {
  return (
    <ul className="flex flex-col gap-2">
      {opps.map((o) => (
        <li key={o.id} id={`opp-${o.id}`}>
          <button
            onClick={() => onOpen(o.id)}
            onMouseEnter={() => onHover(o.id)}
            onMouseLeave={() => onHover(null)}
            className={cn('flex w-full items-center gap-3 rounded-xl border bg-white p-2.5 text-left shadow-card transition-colors', hover === o.id ? 'border-[var(--brand-primary)]' : 'border-line hover:border-[var(--brand-primary-border)]')}
          >
            <img src={o.photo ?? photoUrl(o.property.photo)} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[14px] font-semibold text-ink">{o.person?.name ?? o.property.address}</span>
                <span className="shrink-0 text-[14px] font-semibold text-ink tabular-nums">{money(o.property.valueNow)}</span>
              </span>
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px] text-muted">{o.person ? o.property.address : o.property.city}</span>
                {o.gain > 0 && <span className="shrink-0 text-[12.5px] font-semibold text-[var(--green)] tabular-nums">{gain(o.gain)}</span>}
              </span>
              <span className={cn('mt-0.5 block truncate text-[12.5px] font-medium', o.urgency === 'now' ? 'text-brand' : 'text-ink-2')}>{o.reasons[0]}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function NavItem({ on, onClick, icon: Icon, label, n, blue }: { on: boolean; onClick: () => void; icon: typeof Users; label: string; n: number; blue?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-current={on || undefined}
      className={cn('relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] transition-colors', on ? 'bg-[var(--brand-primary-subtle)] font-semibold text-ink' : 'font-medium text-ink-2 hover:bg-line-soft hover:text-ink')}
    >
      {on && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--brand-primary)]" aria-hidden="true" />}
      <Icon className="size-4 shrink-0 text-brand" />
      <span className="truncate">{label}</span>
      <span className={cn('ml-auto rounded-full px-1.5 text-[12px] tabular-nums', blue && n ? 'bg-[var(--brand-primary)] font-semibold text-white' : 'text-muted')}>{n}</span>
    </button>
  )
}

export default function Opportunities() {
  const all = useOpportunities()
  const projects = useDemo((s) => s.projects)
  const outreach = useDemo((s) => s.outreach)
  const activity = useDemo((s) => s.activity)
  const openCrm = useUi((s) => s.openCrm)
  const importing = useUi((s) => s.importing)
  const [params] = useSearchParams()
  // the side nav, as on Homes: two views across everything, then one item per source
  const [view, setViewState] = useState<View>(() => (params.get('tab') === 'market' ? 'market' : 'go'))
  const [filter, setFilter] = useState<Filter>(() => (params.get('tab') === 'market' ? 'all' : 'go'))
  const tab: Tab | null = view === 'contacts' || view === 'market' ? view : null
  const setView = (v: View) => {
    setViewState(v)
    setFilter(v === 'go' ? 'go' : 'all')
  }
  const [sort, setSort] = useState<Sort>('recommended')
  // three ways to lay out the list and the map, to compare
  const [layout, setLayoutState] = useState<MapLayout>(() => {
    try {
      return (localStorage.getItem('rv-opps-map') as MapLayout) || 'split'
    } catch {
      return 'split'
    }
  })
  const setLayout = (k: MapLayout) => {
    setLayoutState(k)
    try {
      localStorage.setItem('rv-opps-map', k)
    } catch {
      /* private window */
    }
  }
  const [mapOpen, setMapOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hover, setHover] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [valueOpen, setValueOpen] = useState(false)
  // pins are built once per home; hovering only toggles a class, so Leaflet never swaps the element under the cursor
  const icons = useRef(new Map<string, L.DivIcon>())
  const markers = useRef(new Map<string, { m: L.Marker; z: number }>())
  const iconFor = (o: Opportunity) => {
    let i = icons.current.get(o.id)
    if (!i) icons.current.set(o.id, (i = pinIcon(o, false, true, false, true))) // name pills, no photos: calmer
    return i
  }
  useEffect(() => {
    for (const [id, { m, z }] of markers.current) {
      m.setZIndexOffset(id === hover ? 3000 : z)
    }
  }, [hover])

  // homes with a project are tracked under Properties
  const inProject = (o: Opportunity) => o.stage === 'project' || !!projects[o.id] || !!o.property.project
  const book = all.filter((o) => !inProject(o) && (inTab(o, 'contacts') || inTab(o, 'market')))
  const ownListings = all.filter((o) => o.property.source === 'listings').length
  const tabBook = tab ? book.filter((o) => inTab(o, tab)) : book

  const stats = useMemo(() => {
    const book = all.filter((o) => !inProject(o) && inTab(o, 'contacts'))
    const now = book.filter((o) => o.urgency === 'now')
    const contacts = book.filter((o) => o.person && o.property.source === 'contacts')
    const lift = book.reduce((n, o) => n + (o.gain > 0 ? o.gain : 0), 0)
    const lots = book.filter((o) => landOf(o) > 0)
    return {
      now,
      worth: book.filter(worth).length,
      sellers: book.filter((o) => (o.person?.sellScore ?? 0) >= LIKELY).length,
      contacts: contacts.length,
      lift,
      liftN: book.filter((o) => o.gain > 0).length,
      land: lots.reduce((n, o) => n + landOf(o), 0),
      lots: lots.length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, projects])

  const needle = q.trim().toLowerCase()
  const searched = tabBook.filter((o) => !needle || o.property.address.toLowerCase().includes(needle) || o.person?.name.toLowerCase().includes(needle))
  // recommended: anything that needs the agent today (a reply, fresh lead activity) comes first
  const sorted = [...searched].sort((a, b) =>
    sort === 'recommended'
      ? attentionRank(b, outreach[b.id], activity[b.id]) - attentionRank(a, outreach[a.id], activity[a.id])
      : sort === 'score' ? (b.person?.sellScore ?? -1) - (a.person?.sellScore ?? -1) : sort === 'value' ? b.property.valueNow - a.property.valueNow : sort === 'upside' ? b.gain - a.gain : 0,
  )
  const shown = sorted.filter((o) => passes(o, filter))
  const open = book.find((o) => o.id === openId) ?? null
  const pinned = shown.filter(onMap)
  const marketLift = book.filter((o) => inTab(o, 'market')).reduce((n, o) => n + Math.max(0, o.gain), 0)

  // nothing connected yet (or importing right now): the same connect cards as the dashboard, with examples
  if (!all.length || importing)
    return (
      <div className={PAGE}>
        <header className="border-b border-line pb-6">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Opportunities</h1>
          <p className="mt-1 text-[15px] text-ink-2">Homes you could win: your contacts, and listings near you that came off the market.</p>
        </header>
        <div className="mt-8">
          <YourBook opps={all} />
        </div>
      </div>
    )

  const empty = <p className="rounded-xl border border-dashed border-line px-5 py-6 text-[14px] text-muted">Nothing matches. Try another filter or search.</p>
  const mapEl = (
    <>
          <BaseMap
            center={[AGENT.office.lat, AGENT.office.lng]}
            zoom={11}
            bounds={pinned.map((o) => [o.property.lat, o.property.lng] as [number, number])}
            wheelZoom
          >
            <Fit pts={pinned.map((o) => [o.property.lat, o.property.lng] as [number, number])} k={`${view}|${filter}|${needle}|${layout}|${mapOpen}`} />
            {pinned.map((o) => (
              <Marker
                key={o.id}
                position={[o.property.lat, o.property.lng]}
                ref={(m) => {
                  if (m) markers.current.set(o.id, { m, z: pinZ(o) })
                  else markers.current.delete(o.id)
                }}
                icon={iconFor(o)}
                zIndexOffset={pinZ(o)}
                title={o.person?.name ?? o.property.address}
                eventHandlers={{
                  click: () => setOpenId(o.id),
                  mouseover: () => {
                    setHover(o.id)
                    document.getElementById(`opp-${o.id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                  },
                  mouseout: () => setHover(null),
                }}
              />
            ))}
          </BaseMap>
          <div className={cn('pointer-events-none absolute inset-x-3 bottom-6 z-[500] flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-white/95 px-3 py-2 text-[12px] text-ink-2 shadow-card', layout === 'strip' ? 'hidden' : 'flex')}>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] bg-[var(--brand-primary)]" /> Call this week
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-5 rounded-full bg-navy" /> This month
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full border-2 border-[#9aa3b4] bg-white" /> Keep warm
            </span>
          </div>
    </>
  )

  return (
    // wide screens: the page itself doesn't scroll; the list scrolls and the map stays put beside it
    <div className={cn(PAGE, 'max-w-none xl:flex xl:h-[calc(100dvh-var(--demo-h,0px))] xl:flex-col xl:overflow-hidden')}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Opportunities</h1>
          <p className="mt-1 text-[15px] text-ink-2">Homes you could win: your contacts, and listings near you that came off the market.</p>
          <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-line-soft p-0.5" role="radiogroup" aria-label="Map layout">
            {MAP_LAYOUTS.map((l) => (
              <button key={l.k} role="radio" aria-checked={layout === l.k} onClick={() => setLayout(l.k)} className={cn('h-7 rounded-md px-2.5 text-[12px] font-medium', layout === l.k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or address"
              aria-label="Search name or address"
              className="h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[14px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
            />
          </label>
          <Button className="h-10" onClick={() => openCrm('')}>
            <Plus /> Import contacts
          </Button>
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:min-h-0 xl:flex-1 lg:grid-cols-[216px_minmax(0,1fr)]">
        <nav aria-label="Opportunities" className="lg:pt-1">
          <p className="px-3 pb-1.5 text-[11.5px] font-semibold tracking-wide text-faint uppercase">Views</p>
          <NavItem on={view === 'go'} onClick={() => setView('go')} icon={PhoneCall} label="Worth a call" n={book.filter(worth).length} blue />
          <NavItem on={view === 'all'} onClick={() => setView('all')} icon={LayoutGrid} label="All opportunities" n={book.length} />
          <p className="mt-5 px-3 pb-1.5 text-[11.5px] font-semibold tracking-wide text-faint uppercase">By source</p>
          {TABS.map((t) => (
            <NavItem key={t.k} on={view === t.k} onClick={() => setView(t.k)} icon={t.k === 'contacts' ? Users : MapPin} label={t.label} n={book.filter((o) => inTab(o, t.k)).length} />
          ))}
          <div className="mt-5 border-t border-line pt-4">
            <button onClick={() => setValueOpen(true)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-line-soft">
              <span className="block text-[18px] font-semibold text-[var(--green)] tabular-nums">{money(stats.lift + marketLift)}</span>
              <span className="flex items-center gap-1 text-[12.5px] text-muted">
                Value to unlock <ArrowRight className="size-3 text-brand" />
              </span>
            </button>
            {ownListings > 0 && (
              <Link to="/properties" className="mt-1 flex items-center gap-1 px-3 py-1 text-[12.5px] font-medium text-brand hover:underline">
                Your {plural(ownListings, 'listing')} are in Homes <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        </nav>

        <div className="flex min-w-0 flex-col xl:min-h-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-ink">{view === 'go' ? 'Worth a call' : view === 'all' ? 'All opportunities' : TABS.find((t) => t.k === view)!.label}</h2>
              <p className="mt-0.5 text-[13.5px] text-muted">
                {view === 'go'
                  ? 'Who to reach out to this week, across your contacts and the nearby market.'
                  : view === 'all'
                    ? 'Your contacts and the nearby market, ranked by who to call first.'
                    : TABS.find((t) => t.k === view)!.hint}
              </p>
            </div>
            <div className="flex items-center gap-2">
            {layout === 'panel' && (
              <Button size="sm" variant="outline" className="h-8" onClick={() => setMapOpen(true)}>
                <MapIcon /> Map
              </Button>
            )}
            <label className="flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white pr-2 pl-3 text-[13px] text-muted">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent font-semibold text-ink outline-none">
                {SORTS.map((s) => (
                  <option key={s.k} value={s.k}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            </div>
          </div>
          {tab && (
            <div className="mt-3 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]" role="tablist" aria-label="Filter">
              {FILTERS[tab].map((f) => {
                const n = sorted.filter((o) => passes(o, f.k)).length
                if (!n && f.k !== 'all') return null
                const on = filter === f.k
                return (
                  <button key={f.k} role="tab" aria-selected={on} onClick={() => setFilter(f.k)} className={cn('-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13.5px] font-medium whitespace-nowrap', on ? 'border-[var(--brand-primary)] text-ink' : 'border-transparent text-muted hover:text-ink')}>
                    {f.label} <span className={cn('rounded-full px-1.5 text-[12px] tabular-nums', on ? 'bg-[var(--brand-primary-subtle)] text-brand' : 'bg-line-soft text-muted')}>{n}</span>
                  </button>
                )
              })}
            </div>
          )}

      {layout === 'split' && (
        // A · Split: a compact card list beside a big map, like a home search
        <div className="mt-4 grid gap-4 xl:min-h-0 xl:flex-1 lg:grid-cols-[minmax(340px,0.85fr)_minmax(0,1.15fr)]">
          <div className="min-w-0 xl:min-h-0 xl:overflow-y-auto xl:pr-1">{shown.length ? <CompactList opps={shown} onOpen={setOpenId} hover={hover} onHover={setHover} /> : empty}</div>
          <div className="relative isolate h-[520px] overflow-hidden rounded-xl border border-line shadow-card xl:h-full">{mapEl}</div>
        </div>
      )}
      {layout === 'strip' && (
        // B · Map strip: a short, wide map on top, the full table below
        <div className="mt-4 flex flex-col gap-4 xl:min-h-0 xl:flex-1">
          <div className="relative isolate h-[220px] shrink-0 overflow-hidden rounded-xl border border-line shadow-card">{mapEl}</div>
          <div className="min-w-0 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">{shown.length ? <OppTable opps={shown} onOpen={setOpenId} hover={hover} onHover={setHover} /> : empty}</div>
        </div>
      )}
      {layout === 'panel' && (
        // C · Table first: the full table; the map opens as a panel from the right when asked
        <div className="mt-4 min-w-0 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">{shown.length ? <OppTable opps={shown} onOpen={setOpenId} hover={hover} onHover={setHover} /> : empty}</div>
      )}
        </div>
      </div>

      {layout === 'panel' && mapOpen && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-ink/20" onClick={() => setMapOpen(false)}>
          <div className="relative isolate flex h-full w-[min(640px,92vw)] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-[15px] font-semibold text-ink">
                Map · {plural(pinned.length, 'home')}
              </p>
              <button onClick={() => setMapOpen(false)} className="rounded-md px-2 py-1 text-[13px] font-medium text-muted hover:bg-line-soft hover:text-ink">
                Close
              </button>
            </div>
            <div className="relative isolate min-h-0 flex-1">{mapEl}</div>
          </div>
        </div>
      )}

      <ValueDrawer
        opps={book}
        open={valueOpen}
        commission={COMMISSION}
        onClose={() => setValueOpen(false)}
        onOpenRow={(id) => {
          setValueOpen(false)
          setOpenId(id)
        }}
      />
      <OppDrawer o={open} onClose={() => setOpenId(null)} />
    </div>
  )
}
