import { ArrowRight, MapPin, Plus, Search, Users } from 'lucide-react'
import type L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { Link, useSearchParams } from 'react-router-dom'
import { attentionRank, OppDrawer } from '@/components/home/TopOpportunities'
import { OppTable } from '@/components/opportunity/OppTable'
import { ValueDrawer } from '@/components/opportunity/ValueDrawer'
import { BAR_STYLES, SummaryBar, type BarStyle } from '@/components/opportunity/SummaryBar'
import { BaseMap, TILE_BOUNDS } from '@/components/map/BaseMap'
import { pinIcon, pinZ } from '@/components/map/pins'
import { Button } from '@/components/ui/button'
import { AGENT } from '@/data/tiers'
import { money, plural } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { YourBook } from '@/components/home/YourBook'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

// Prospecting: homes the agent could win, not ones they already work on. Two sources, as tabs: their own
// contacts (CRM and lead form), and the nearby market (other agents' listings that expired or were
// withdrawn, so the owner is free to talk). Their own listings, reports and projects live in Homes; Revive
// referrals in Lead tracking. One summary line, a few filters per tab, the ranked list and the map.

const COMMISSION = 0.025 // listing side
const LIKELY = 80

type Tab = 'contacts' | 'market'
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


export default function Opportunities() {
  const all = useOpportunities()
  const projects = useDemo((s) => s.projects)
  const outreach = useDemo((s) => s.outreach)
  const activity = useDemo((s) => s.activity)
  const openCrm = useUi((s) => s.openCrm)
  const importing = useUi((s) => s.importing)
  const [params] = useSearchParams()
  const [tab, setTabState] = useState<Tab>(() => (params.get('tab') === 'market' ? 'market' : 'contacts'))
  const [filter, setFilter] = useState<Filter>(() => (FILTERS.contacts.some((f) => f.k === params.get('filter')) ? (params.get('filter') as Filter) : 'all'))
  const setTab = (t: Tab) => {
    setTabState(t)
    setFilter('all')
  }
  const [sort, setSort] = useState<Sort>('recommended')
  const [barStyle, setBarStyleState] = useState<BarStyle>(() => {
    try {
      return (localStorage.getItem('rv-opps-bar') as BarStyle) || 'stats'
    } catch {
      return 'stats'
    }
  })
  const setBarStyle = (k: BarStyle) => {
    setBarStyleState(k)
    try {
      localStorage.setItem('rv-opps-bar', k)
    } catch {
      /* private window */
    }
  }
  const [q, setQ] = useState('')
  const [hover, setHover] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [valueOpen, setValueOpen] = useState(false)
  // pins are built once per home; hovering only toggles a class, so Leaflet never swaps the element under the cursor
  const icons = useRef(new Map<string, L.DivIcon>())
  const markers = useRef(new Map<string, { m: L.Marker; z: number }>())
  const iconFor = (o: Opportunity) => {
    let i = icons.current.get(o.id)
    if (!i) icons.current.set(o.id, (i = pinIcon(o, false, false, false, true)))
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
  const tabBook = book.filter((o) => inTab(o, tab))

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

  return (
    // wide screens: the page itself doesn't scroll; the list scrolls and the map stays put beside it
    <div className={cn(PAGE, 'max-w-none xl:flex xl:h-[calc(100dvh-var(--demo-h,0px))] xl:flex-col xl:overflow-hidden')}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Opportunities</h1>
          <p className="mt-1 text-[15px] text-ink-2">Homes you could win: your contacts, and listings near you that came off the market.</p>
          <div className="mt-3 inline-flex items-center gap-1 rounded-lg bg-line-soft p-0.5" role="radiogroup" aria-label="Summary layout">
            {BAR_STYLES.map((b) => (
              <button key={b.k} role="radio" aria-checked={barStyle === b.k} onClick={() => setBarStyle(b.k)} className={cn('h-7 rounded-md px-2.5 text-[12px] font-medium', barStyle === b.k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}>
                {b.label}
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

      {/* the two sources as tabs; their own listings live in Homes */}
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <div role="tablist" aria-label="Where opportunities come from" className="-mb-px flex gap-1">
          {TABS.map((t) => {
            const on = tab === t.k
            const n = book.filter((o) => inTab(o, t.k)).length
            const Icon = t.k === 'contacts' ? Users : MapPin
            return (
              <button
                key={t.k}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.k)}
                className={cn('inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-semibold whitespace-nowrap', on ? 'border-[var(--brand-primary)] text-ink' : 'border-transparent text-muted hover:text-ink')}
              >
                <Icon className={cn('size-4', on && 'text-brand')} /> {t.label}
                <span className={cn('rounded-full px-1.5 text-[12px] tabular-nums', on ? 'bg-[var(--brand-primary-subtle)] text-brand' : 'bg-line-soft text-muted')}>{n}</span>
              </button>
            )
          })}
        </div>
        {ownListings > 0 && (
          <Link to="/properties" className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
            Your {plural(ownListings, 'listing')} are in Homes <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      {/* the numbers and the filters; three treatments to compare */}
      <div className="mt-4">
        <SummaryBar
          style={barStyle}
          filters={FILTERS[tab].map((f) => ({ k: f.k, label: f.label, n: sorted.filter((o) => passes(o, f.k)).length }))}
          filter={filter}
          setFilter={(k) => setFilter(k as Filter)}
          primary={tab === 'contacts' ? 3 : 3}
          metrics={
            tab === 'contacts'
              ? [
                  { value: String(stats.now.length), label: 'To call this week', filter: 'go' },
                  { value: String(stats.sellers), label: 'Likely sellers', filter: 'seller' },
                  { value: money(stats.lift), label: 'Value to unlock', green: true, onClick: () => setValueOpen(true) },
                ]
              : [
                  { value: String(tabBook.filter((o) => o.property.facts.expiredDaysAgo !== undefined).length), label: 'Expired', filter: 'expired' },
                  { value: String(tabBook.filter((o) => o.property.facts.withdrawnDaysAgo !== undefined).length), label: 'Withdrawn', filter: 'withdrawn' },
                  { value: money(marketLift), label: 'Revive could add', green: true },
                ]
          }
          sort={
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
          }
        />
      </div>

      <div className="mt-5 grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0 xl:flex xl:min-h-0 xl:flex-col">
          <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
          {shown.length ? (
            <OppTable opps={shown} onOpen={setOpenId} hover={hover} onHover={setHover} />
          ) : (
            <p className="rounded-xl border border-dashed border-line px-5 py-6 text-[14px] text-muted">Nothing matches. Try another filter or search.</p>
          )}
          </div>
        </div>

        <div className="relative isolate h-[420px] overflow-hidden rounded-xl border border-line shadow-card xl:h-full">
          <BaseMap
            center={[AGENT.office.lat, AGENT.office.lng]}
            zoom={11}
            bounds={pinned.map((o) => [o.property.lat, o.property.lng] as [number, number])}
            wheelZoom
          >
            <Fit pts={pinned.map((o) => [o.property.lat, o.property.lng] as [number, number])} k={`${tab}|${filter}|${needle}`} />
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
          <div className="pointer-events-none absolute inset-x-3 bottom-6 z-[500] flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-white/95 px-3 py-2 text-[12px] text-ink-2 shadow-card">
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
        </div>
      </div>

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
