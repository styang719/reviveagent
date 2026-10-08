import { ArrowRight, Clock, DollarSign, Plus, Search, SquareDashed, Users } from 'lucide-react'
import type L from 'leaflet'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { Link, useSearchParams } from 'react-router-dom'
import { needsAttention, OppDrawer } from '@/components/home/TopOpportunities'
import { OppTable } from '@/components/opportunity/OppTable'
import { BaseMap, TILE_BOUNDS } from '@/components/map/BaseMap'
import { pinIcon, pinZ } from '@/components/map/pins'
import { Button } from '@/components/ui/button'
import { AGENT } from '@/data/tiers'
import { photoUrl } from '@/lib/assets'
import { money, plural } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

// The whole book, laid out like the Contacts page: four stat cards that each end in one action,
// filter chips, the ranked list (the same cards as Home's Top opportunities) and the map beside it.
// A home leaves this list once a project is submitted; from then on it lives under Properties.

const COMMISSION = 0.025 // listing side
const LIKELY = 80

type Filter = 'all' | 'go' | 'listings' | 'seller' | 'reno' | 'adu' | 'build'
const FILTERS: { k: Filter; label: string }[] = [
  { k: 'all', label: 'All' },
  { k: 'go', label: 'Worth a conversation' },
  { k: 'listings', label: 'MLS listings' },
  { k: 'seller', label: 'Likely seller' },
  { k: 'reno', label: 'Renovation' },
  { k: 'adu', label: 'ADU room' },
  { k: 'build', label: 'Build' },
]
/** Build: Revive would add new space, an ADU with upside or a Flip 360 rebuild. */
const canBuild = (o: Opportunity) => o.property.scenarios.some((s) => (s.gain ?? 0) > 0 && (s.product.includes('ADU') || s.product.startsWith('Flip')))
const worth = (o: Opportunity) => o.urgency === 'now' || o.urgency === 'soon'
const passes = (o: Opportunity, f: Filter) =>
  f === 'all' ||
  (f === 'go' && worth(o)) ||
  (f === 'listings' && o.property.source === 'listings') ||
  (f === 'seller' && (o.person?.sellScore ?? 0) >= LIKELY) ||
  (f === 'reno' && o.tags.includes('Renovation')) ||
  (f === 'adu' && o.tags.includes('ADU room')) ||
  (f === 'build' && canBuild(o))

type Sort = 'recommended' | 'score' | 'value' | 'upside'
const SORTS: { k: Sort; label: string }[] = [
  { k: 'recommended', label: 'Recommended' },
  { k: 'score', label: 'Selling score' },
  { k: 'upside', label: 'Revive upside' },
  { k: 'value', label: 'Value' },
]

const landOf = (o: Opportunity) => (o.tags.includes('ADU room') && o.property.lot ? o.property.lot - o.property.sqft : 0)
const acres = (sqft: number) => (sqft >= 43_560 ? `${(sqft / 43_560).toFixed(2)} acres` : `${Math.round(sqft / 100) * 100} sq ft`)
// the map covers the agent's market; a home outside it stays in the list but off the map
const [[S, W], [N, E]] = TILE_BOUNDS
const onMap = (o: Opportunity) => o.property.lat > S && o.property.lat < N && o.property.lng > W && o.property.lng < E
const img = (o: Opportunity) => o.photo ?? photoUrl(o.property.photo)

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

function Stat({ icon: Icon, label, hot, children }: { icon: typeof Clock; label: string; hot?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-col rounded-xl border p-4 shadow-card', hot ? 'border-[var(--brand-primary-border)] bg-[var(--brand-primary-subtle)]' : 'border-line bg-white')}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-[12px] font-semibold tracking-wide uppercase', 'text-brand')}>{label}</p>
        <Icon className="size-4 text-brand" />
      </div>
      {children}
    </div>
  )
}
const big = 'mt-1.5 flex items-baseline gap-2 text-[26px] leading-8 font-semibold text-ink tabular-nums'
const small = 'text-[13px] font-normal text-ink-2'
const cta = 'mt-auto self-start pt-3'

export default function Opportunities() {
  const all = useOpportunities()
  const projects = useDemo((s) => s.projects)
  const outreach = useDemo((s) => s.outreach)
  const activity = useDemo((s) => s.activity)
  const openCrm = useUi((s) => s.openCrm)
  const [params] = useSearchParams()
  const [filter, setFilter] = useState<Filter>(() => (FILTERS.some((f) => f.k === params.get('filter')) ? (params.get('filter') as Filter) : 'go'))
  const [sort, setSort] = useState<Sort>('recommended')
  const [q, setQ] = useState('')
  const [hover, setHover] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
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
      m.getElement()?.querySelector('.rv-fpin, .rv-pill, .rv-dot')?.classList.toggle('on', id === hover)
      m.setZIndexOffset(id === hover ? 3000 : z)
    }
  }, [hover])

  // homes with a project are tracked under Properties
  const inProject = (o: Opportunity) => o.stage === 'project' || !!projects[o.id] || !!o.property.project
  const book = all.filter((o) => !inProject(o))
  const moved = all.length - book.length

  const stats = useMemo(() => {
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
  }, [book])

  const needle = q.trim().toLowerCase()
  const searched = book.filter((o) => !needle || o.property.address.toLowerCase().includes(needle) || o.person?.name.toLowerCase().includes(needle))
  // recommended: anything that needs the agent today (a reply, fresh lead activity) comes first
  const sorted = [...searched].sort((a, b) =>
    sort === 'recommended'
      ? Number(needsAttention(b, outreach[b.id], activity[b.id])) - Number(needsAttention(a, outreach[a.id], activity[a.id]))
      : sort === 'score' ? (b.person?.sellScore ?? -1) - (a.person?.sellScore ?? -1) : sort === 'value' ? b.property.valueNow - a.property.valueNow : sort === 'upside' ? b.gain - a.gain : 0,
  )
  const shown = sorted.filter((o) => passes(o, filter))
  const open = book.find((o) => o.id === openId) ?? null
  const pinned = shown.filter(onMap)
  const names = stats.now.map((o) => (o.person ? o.person.name.split(' ')[0] : o.property.address))
  const nameList = names.length > 2 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names.join(' and ')

  if (!all.length)
    return (
      <div className={PAGE}>
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Opportunities</h1>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line px-5 py-4">
          <p className="text-[14px] text-ink-2">Connect your MLS listings or your CRM and Revive ranks who to call first.</p>
          <Button asChild>
            <Link to="/">Connect on your dashboard</Link>
          </Button>
        </div>
      </div>
    )

  return (
    // wide screens: the page itself doesn't scroll; the list scrolls and the map stays put beside it
    <div className={cn(PAGE, 'max-w-none xl:flex xl:h-[calc(100dvh-var(--demo-h,0px))] xl:flex-col xl:overflow-hidden')}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Opportunities</h1>
          <p className="mt-1 text-[15px] text-ink-2">Your listings and contacts, enriched with property and market data, ranked by who to call first.</p>
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Clock} label="Call this week" hot>
          <p className={big}>
            {stats.now.length} <span className={small}>{stats.now.length === 1 ? 'person' : 'people'} to reach first</span>
          </p>
          {stats.now.length > 0 && (
            <div className="mt-2 flex items-center gap-2.5">
              <span className="flex shrink-0 -space-x-2">
                {stats.now.slice(0, 4).map((o) => (
                  <img key={o.id} src={img(o)} alt="" title={o.person?.name} className="size-7 rounded-full border-2 border-white object-cover" />
                ))}
              </span>
              <span className="truncate text-[13px] font-medium text-ink-2">{nameList}</span>
            </div>
          )}
          <div className={cta}>
            <Button size="sm" className="h-9" onClick={() => setFilter('go')}>
              See all {stats.worth} worth a call <ArrowRight />
            </Button>
          </div>
        </Stat>
        <Stat icon={Users} label="Likely sellers">
          <p className={big}>
            {stats.sellers} <span className={small}>of {plural(stats.contacts, 'contact')}</span>
          </p>
          <div className={cta}>
            <Button size="sm" variant="outline" className="h-9 text-brand" onClick={() => setFilter('seller')}>
              See likely sellers <ArrowRight />
            </Button>
          </div>
        </Stat>
        <Stat icon={DollarSign} label="Value to unlock">
          <p className={big}>
            {money(stats.lift)} <span className={small}>across {plural(stats.liftN, 'home')}</span>
          </p>
          <p className="mt-1 text-[13px] text-ink-2">
            <b className="font-semibold text-[var(--green)]">+{money(Math.round(stats.lift * COMMISSION))}</b> your commission at {(COMMISSION * 100).toFixed(1)}% listing side
          </p>
          <div className={cta}>
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-brand"
              onClick={() => {
                setFilter('all')
                setSort('upside')
              }}
            >
              See the breakdown <ArrowRight />
            </Button>
          </div>
        </Stat>
        <Stat icon={SquareDashed} label="Unused land">
          <p className={big}>
            {acres(stats.land)} <span className={small}>across {plural(stats.lots, 'lot')}</span>
          </p>
          <p className="mt-1 text-[13px] text-ink-2">Room for a detached ADU</p>
          <div className={cta}>
            <Button size="sm" variant="outline" className="h-9 text-brand" onClick={() => setFilter('adu')}>
              See ADU lots <ArrowRight />
            </Button>
          </div>
        </Stat>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter opportunities">
          {FILTERS.map((f) => {
            const n = sorted.filter((o) => passes(o, f.k)).length
            const on = filter === f.k
            if (!n && f.k !== 'all' && !on) return null
            return (
              <button
                key={f.k}
                role="radio"
                aria-checked={on}
                onClick={() => setFilter(f.k)}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-medium transition-colors',
                  on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-line bg-white text-ink hover:border-[var(--brand-primary-border)]',
                )}
              >
                {on && f.k === 'go' && <span className="size-1.5 rounded-full bg-white" aria-hidden="true" />}
                {f.label}
                <span className={cn('text-[12px] tabular-nums', on ? 'text-white/85' : 'text-muted')}>{n}</span>
              </button>
            )
          })}
        </div>
        <label className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white pr-2 pl-3 text-[13px] text-muted">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent font-semibold text-ink outline-none">
            {SORTS.map((s) => (
              <option key={s.k} value={s.k}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="min-w-0 xl:flex xl:min-h-0 xl:flex-col">
          <div className="mb-3 flex items-center justify-between gap-2 text-[13px]">
            <span className="text-muted">{plural(shown.length, 'opportunity', 'opportunities')}</span>
            {moved > 0 && (
              <Link to="/properties" className="inline-flex items-center gap-1 font-medium text-brand hover:underline">
                {plural(moved, 'home')} in projects with Revive <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
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
            <Fit pts={pinned.map((o) => [o.property.lat, o.property.lng] as [number, number])} k={`${filter}|${needle}`} />
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
              <span className="size-3 rounded-[3px] bg-hot" /> Call this week
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

      <OppDrawer o={open} onClose={() => setOpenId(null)} />
    </div>
  )
}
