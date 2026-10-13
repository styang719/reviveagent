import { ArrowRight, Clock, DollarSign, LayoutGrid, MapPin, PhoneCall, Plus, Search, Signpost, SquareDashed, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { attentionRank, img, OppDrawer, OppRow } from '@/components/home/TopOpportunities'
import { CompsPanel } from '@/components/opportunity/CompsPanel'
import { ValueDrawer } from '@/components/opportunity/ValueDrawer'
import { Button } from '@/components/ui/button'
import { money, plural } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { YourBook } from '@/components/home/YourBook'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

// Prospecting: homes the agent could win more on. Three sources: their own contacts (CRM and lead form),
// their MLS listings (where Revive could add value), and the nearby market (other agents' listings that
// expired or were withdrawn, so the owner is free to talk). Reports and projects live in Homes; Revive
// referrals in Lead tracking. A side nav like Homes (views, then sources, then the numbers), status tabs per source.

const COMMISSION = 0.025 // listing side
const LIKELY = 80

type Tab = 'contacts' | 'listings' | 'market'
type View = 'go' | 'all' | Tab
const TABS: { k: Tab; label: string; hint: string }[] = [
  { k: 'contacts', label: 'Your contacts', hint: 'Homeowners in your CRM and lead form, ranked by who to call first.' },
  { k: 'listings', label: 'Your MLS listings', hint: 'Your active listings, and what Revive could add to each before it sells.' },
  { k: 'market', label: 'Nearby market', hint: 'Listings near you that expired or were withdrawn. The owner is free to talk, and Revive gives you a reason to call.' },
]
const inTab = (o: Opportunity, t: Tab) => (t === 'market' ? o.property.source === 'market' : t === 'listings' ? o.property.source === 'listings' : o.property.source === 'contacts' || o.property.source === 'leadform')

type Filter = 'all' | 'go' | 'seller' | 'reno' | 'adu' | 'expired' | 'withdrawn'
const FILTERS: Record<Tab, { k: Filter; label: string }[]> = {
  contacts: [
    { k: 'all', label: 'All' },
    { k: 'go', label: 'Worth a call' },
    { k: 'seller', label: 'Likely seller' },
    { k: 'reno', label: 'Renovation' },
    { k: 'adu', label: 'ADU room' },
  ],
  listings: [
    { k: 'all', label: 'All' },
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

const acres = (sqft: number) => (sqft >= 43_560 ? `${(sqft / 43_560).toFixed(2)} acres` : `${Math.round(sqft / 100) * 100} sq ft`)
const landOf = (o: Opportunity) => (o.tags.includes('ADU room') && o.property.lot ? o.property.lot - o.property.sqft : 0)



/** A compact stat card in the side nav; clicking it opens that slice of the list. */
function Stat({ label, icon: Icon, value, sub, hot, green, onClick, children }: { label: string; icon: typeof Users; value: string; sub: string; hot?: boolean; green?: boolean; onClick: () => void; children?: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('group flex w-full flex-col rounded-xl border p-3 text-left transition-colors', hot ? 'border-[var(--brand-primary-border)] bg-[var(--brand-primary-subtle)]' : 'border-line bg-white hover:border-[var(--brand-primary-border)]')}>
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tracking-wide text-brand uppercase">{label}</span>
        <Icon className="size-3.5 text-brand" />
      </span>
      <span className={cn('mt-1 text-[20px] leading-7 font-semibold tabular-nums', green ? 'text-[var(--green)]' : 'text-ink')}>{value}</span>
      <span className="flex items-center gap-1 text-[12px] text-ink-2">
        {sub} <ArrowRight className="size-3 shrink-0 text-brand opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
      {children}
    </button>
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
  const tab: Tab | null = view === 'contacts' || view === 'listings' || view === 'market' ? view : null
  const setView = (v: View) => {
    setViewState(v)
    setFilter(v === 'go' ? 'go' : 'all')
  }
  const [sort, setSort] = useState<Sort>('recommended')
  const [compsId, setCompsId] = useState<string | null>(null) // a row's map button: comps around that home
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [valueOpen, setValueOpen] = useState(false)

  // homes with a project are tracked under Properties
  const inProject = (o: Opportunity) => o.stage === 'project' || !!projects[o.id] || !!o.property.project
  const book = all.filter((o) => !inProject(o) && TABS.some((t) => inTab(o, t.k)))
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
  const comps = book.find((o) => o.id === compsId) ?? null
  const marketLift = book.filter((o) => inTab(o, 'market')).reduce((n, o) => n + Math.max(0, o.gain), 0)

  // nothing connected yet (or importing right now): the same connect cards as the dashboard, with examples
  if (!all.length || importing)
    return (
      <div className={PAGE}>
        <header className="border-b border-line pb-6">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Opportunities</h1>
          <p className="mt-1 text-[15px] text-ink-2">Homes you could win more on: your contacts, your listings, and listings near you that came off the market.</p>
        </header>
        <div className="mt-8">
          <YourBook opps={all} />
        </div>
      </div>
    )

  const empty = <p className="rounded-xl border border-dashed border-line px-5 py-6 text-[14px] text-muted">Nothing matches. Try another filter or search.</p>
  return (
    // wide screens: the page itself doesn't scroll; the list scrolls and the map stays put beside it
    <div className={cn(PAGE, 'xl:flex xl:h-[calc(100dvh-var(--demo-h,0px))] xl:flex-col xl:overflow-hidden')}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Opportunities</h1>
          <p className="mt-1 text-[15px] text-ink-2">Homes you could win more on: your contacts, your listings, and listings near you that came off the market.</p>
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
            <NavItem key={t.k} on={view === t.k} onClick={() => setView(t.k)} icon={t.k === 'contacts' ? Users : t.k === 'listings' ? Signpost : MapPin} label={t.label} n={book.filter((o) => inTab(o, t.k)).length} />
          ))}
          {/* the numbers, each a way into the list */}
          <p className="mt-6 px-3 pb-2 text-[11.5px] font-semibold tracking-wide text-faint uppercase">This week</p>
          <div className="flex flex-col gap-2">
            <Stat label="Call this week" icon={Clock} hot onClick={() => setView('go')} value={String(stats.now.length)} sub={`${stats.now.length === 1 ? 'person' : 'people'} to reach first`}>
              {stats.now.length > 0 && (
                <span className="mt-2 flex -space-x-2">
                  {stats.now.slice(0, 5).map((o) => (
                    <img key={o.id} src={img(o)} alt="" title={o.person?.name} className="size-6 rounded-full border-2 border-white object-cover" />
                  ))}
                </span>
              )}
            </Stat>
            <Stat label="Likely sellers" icon={Users} onClick={() => (setViewState('contacts'), setFilter('seller'))} value={String(stats.sellers)} sub={`of ${plural(stats.contacts, 'contact')}`} />
            <Stat label="Value to unlock" icon={DollarSign} onClick={() => setValueOpen(true)} value={money(stats.lift + marketLift)} green sub={`+${money(Math.round((stats.lift + marketLift) * COMMISSION))} your commission`} />
            <Stat label="Unused land" icon={SquareDashed} onClick={() => (setViewState('contacts'), setFilter('adu'))} value={acres(stats.land)} sub={`across ${plural(stats.lots, 'lot')}, room for an ADU`} />
          </div>
        </nav>

        <div className="flex min-w-0 flex-col xl:min-h-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-ink">{view === 'go' ? 'Worth a call' : view === 'all' ? 'All opportunities' : TABS.find((t) => t.k === view)!.label}</h2>
              <p className="mt-0.5 text-[13.5px] text-muted">
                {view === 'go'
                  ? 'Who to reach out to this week, across your contacts, your listings and the nearby market.'
                  : view === 'all'
                    ? 'Your contacts, your listings and the nearby market, ranked by who to call first.'
                    : TABS.find((t) => t.k === view)!.hint}
              </p>
            </div>
            <div className="flex items-center gap-2">
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

      <div className="mt-4 min-w-0 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
        {shown.length ? (
          <ul className="@container flex flex-col gap-3">
            {shown.map((o) => (
              <OppRow key={o.id} o={o} check={false} onOpen={() => setOpenId(o.id)} onComps={() => setCompsId(o.id)} />
            ))}
          </ul>
        ) : (
          empty
        )}
      </div>
        </div>
      </div>

      {comps && <CompsPanel o={comps} onClose={() => setCompsId(null)} onContact={() => (setCompsId(null), setOpenId(comps.id))} />}

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
