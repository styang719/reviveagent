import { ArrowRight, Bell, Check, FileText, Hammer, ImageIcon, Plus, Sparkles, Tag, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { HomesList, ProjectCards, type Home, type HomeSort } from './HomesList'

// Three page layouts for Homes, to compare. They share the same three section views (each with its own
// filters) and the same section labels; what changes is how you move between sections. An empty section
// never takes up the page: it shrinks to a small "start" action.

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))

export type SectionKey = 'projects' | 'reports' | 'listings'
export const SECTIONS: Record<SectionKey, { title: string; icon: typeof Hammer; hint: string }> = {
  projects: { title: 'Projects with Revive', icon: Hammer, hint: 'Homes Revive is renovating with you, from review to listing.' },
  reports: { title: 'AI reports', icon: FileText, hint: 'Homes you’ve run a Revive AI report on. Share them, follow up, start a project.' },
  listings: { title: 'Your listings', icon: Tag, hint: 'Your active MLS listings, and what Revive could add to each.' },
}

export interface Parts {
  projects: Home[]
  reports: Home[]
  listings: Home[]
  sort: HomeSort
  setSort: (s: HomeSort) => void
  empty: Record<SectionKey, React.ReactNode>
  start: Record<SectionKey, { label: string; to?: string; onClick?: () => void }> // the one action for an empty section
}

const waitingOf = (homes: Home[]) => homes.filter((h) => h.needsYou).length

export function SectionHead({ k, count, waiting, right, small }: { k: SectionKey; count: number; waiting: number; right?: React.ReactNode; small?: boolean }) {
  const s = SECTIONS[k]
  const Icon = s.icon
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className={cn('grid shrink-0 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand', small ? 'size-7' : 'size-8')}>
            <Icon className="size-4" />
          </span>
          <h2 id={`sec-${k}`} className={cn('font-semibold text-ink', small ? 'text-[16px]' : 'text-xl')}>
            {small && k === 'projects' ? 'Projects' : s.title}
          </h2>
          <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{count}</span>
          {waiting > 0 && <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap text-white">{waiting} need{waiting === 1 ? 's' : ''} you</span>}
        </div>
        {!small && <p className="mt-1 text-[13px] text-muted">{s.hint}</p>}
      </div>
      {right}
    </div>
  )
}

function SortToggle({ sort, setSort }: { sort: HomeSort; setSort: (s: HomeSort) => void }) {
  return (
    <div className="flex items-center gap-1 text-[12.5px] text-muted">
      Sort by
      {(['recent', 'upside'] as const).map((k) => (
        <button key={k} onClick={() => setSort(k)} aria-pressed={sort === k} className={cn('rounded-md px-2 py-1 font-medium', sort === k ? 'bg-line-soft text-ink' : 'hover:text-ink')}>
          {k === 'recent' ? 'Recent' : 'Biggest upside'}
        </button>
      ))}
    </div>
  )
}

const SHARE_TONE = {
  opened: 'bg-ok-soft text-[var(--green)]',
  shared: 'bg-[var(--brand-primary-subtle)] text-brand',
  leadform: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]',
  none: 'bg-white/90 text-ink-2',
} as const

const sortHomes = (homes: Home[], sort: HomeSort) =>
  [...homes].sort((a, b) => Number(!!b.needsYou) - Number(!!a.needsYou) || (sort === 'upside' ? (b.upside ?? 0) - (a.upside ?? 0) : b.at - a.at))

/** AI reports as photo cards (not a table): where it is with the homeowner on the photo, upside, next step. */
export function ReportCards({ homes, sort, grid = 'sm:grid-cols-2 xl:grid-cols-4', limit = 8 }: { homes: Home[]; sort: HomeSort; grid?: string; limit?: number }) {
  const [all, setAll] = useState(false)
  const sorted = sortHomes(homes, sort)
  const visible = all ? sorted : sorted.slice(0, limit)
  return (
    <div>
      <div className={cn('grid gap-4', grid)}>
        {visible.map((h) => {
          const n = h.needsYou
          const sh = h.report?.share ?? { label: 'Not shared yet', tone: 'none' as const }
          const none = sh.tone === 'none'
          return (
            <Link
              key={h.id}
              to={n?.to ?? `/property/${h.id}?tab=report`}
              className={cn(
                'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]',
                n ? 'border-[var(--brand-primary-border)] ring-1 ring-[var(--brand-primary-border)]' : 'border-line',
              )}
            >
              <span className="relative block aspect-[16/9] overflow-hidden bg-line-soft">
                {h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                <span className={cn('absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold shadow-sm', n ? 'bg-[var(--brand-primary)] text-white' : SHARE_TONE[sh.tone])}>
                  {n ? n.status : sh.label}
                </span>
                {!!h.report?.designs && (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-agent)]">
                    <Sparkles className="size-3" /> RenoVision
                  </span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-2 p-3.5">
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold text-ink">{h.address}</span>
                  <span className="block truncate text-[12.5px] text-muted">{h.city}</span>
                </span>
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-semibold text-[var(--green)] tabular-nums">{h.upside ? gain(h.upside) : '—'}</span>
                  <span className="truncate text-[12px] text-muted">{h.product ?? ''}</span>
                </span>
                <span
                  className={cn(
                    'mt-auto flex h-8 items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium',
                    n ? 'bg-[var(--brand-primary)] text-white' : 'bg-line-soft text-ink group-hover:bg-[var(--brand-primary-subtle)] group-hover:text-brand',
                  )}
                >
                  {n ? n.cta : none ? 'Share report' : 'Open report'} <ArrowRight className="size-3.5" />
                </span>
              </span>
            </Link>
          )
        })}
      </div>
      {homes.length > limit && (
        <button onClick={() => setAll((v) => !v)} className="mt-3 w-full rounded-xl border border-dashed border-line py-2.5 text-[13px] font-medium text-brand hover:bg-head">
          {all ? 'Show fewer' : `Show all ${homes.length} reports`}
        </button>
      )}
    </div>
  )
}

// ---------- filters: each section has its own ----------

type Filter = { k: string; label: string; test: (h: Home) => boolean }

export const FILTERS: Record<SectionKey, Filter[]> = {
  projects: [
    { k: 'all', label: 'All', test: () => true },
    { k: 'needs', label: 'Needs you', test: (h) => !!h.needsYou },
    { k: 'review', label: 'In review', test: (h) => h.project?.status === 'review' },
    { k: 'active', label: 'In construction', test: (h) => h.project?.status === 'active' },
    { k: 'sold', label: 'Completed', test: (h) => h.project?.status === 'sold' },
  ],
  reports: [
    { k: 'all', label: 'All', test: () => true },
    { k: 'needs', label: 'Needs you', test: (h) => !!h.needsYou },
    { k: 'none', label: 'Not shared', test: (h) => !h.report?.share || h.report.share.tone === 'none' },
    { k: 'shared', label: 'Shared', test: (h) => h.report?.share?.tone === 'shared' },
    { k: 'opened', label: 'Opened', test: (h) => h.report?.share?.tone === 'opened' || h.report?.share?.tone === 'leadform' },
  ],
  listings: [
    { k: 'all', label: 'All', test: () => true },
    { k: 'needs', label: 'Needs you', test: (h) => !!h.needsYou },
    { k: 'cut', label: 'Price cut', test: (h) => (h.listing?.property.facts.priceCutDaysAgo ?? 99) <= 14 },
    { k: 'stale', label: '30+ days', test: (h) => (h.listing?.property.facts.daysOnMarket ?? 0) >= 30 },
  ],
}
export const countFor = (k: SectionKey, f: string, homes: Home[]) => homes.filter(FILTERS[k].find((x) => x.k === f)!.test).length

function Chips({ k, homes, value, onChange }: { k: SectionKey; homes: Home[]; value: string; onChange: (f: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Filter ${SECTIONS[k].title}`}>
      {FILTERS[k].map((f) => {
        const n = homes.filter(f.test).length
        if (!n && f.k !== 'all') return null
        const on = value === f.k
        return (
          <button
            key={f.k}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(f.k)}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-line bg-white text-ink hover:border-[var(--brand-primary-border)]')}
          >
            {f.k === 'needs' && <span className={cn('size-1.5 rounded-full', on ? 'bg-white' : 'bg-[var(--brand-primary)]')} />}
            {f.label} <span className={cn('text-[12px] tabular-nums', on ? 'text-white/85' : 'text-muted')}>{n}</span>
          </button>
        )
      })}
    </div>
  )
}

// ---------- completed projects: the sold card ----------

function SoldCard({ h }: { h: Home }) {
  const p = h.project!
  const s = p.sold!
  return (
    <Link to="/case-studies" className="group flex overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]">
      <span className="relative hidden w-[34%] max-w-[220px] shrink-0 overflow-hidden bg-line-soft sm:block">
        {h.photo && <img src={img(h.photo)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <span className="absolute top-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm">{p.product}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col px-5 py-4">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-semibold text-ink">{h.address}</span>
            <span className="mt-0.5 block truncate text-[14px] text-muted">{h.city}</span>
          </span>
          <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 text-[12.5px] text-ink-2">
            <Check className="size-3.5" /> {s.when}
          </span>
        </span>
        <span className="mt-4 grid grid-cols-2 gap-4">
          <span>
            <span className="block text-[11.5px] font-medium tracking-wide text-muted uppercase">As-is price</span>
            <span className="mt-0.5 block text-[16px] font-semibold text-ink tabular-nums">{money(s.asIs)}</span>
          </span>
          <span>
            <span className="block text-[11.5px] font-medium tracking-wide text-muted uppercase">Sales price</span>
            <span className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[16px] font-semibold text-ink tabular-nums">{money(s.sale)}</span>
              <span className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-[var(--green)] tabular-nums">
                <TrendingUp className="size-3.5" /> {gain(s.sale - s.asIs)}
              </span>
            </span>
          </span>
        </span>
        <span className="mt-4 flex h-10 items-center justify-center gap-2 rounded-lg bg-line-soft text-[13.5px] font-medium text-ink group-hover:bg-[var(--brand-primary-subtle)] group-hover:text-brand">
          <ImageIcon className="size-4" /> See before &amp; afters
        </span>
      </span>
    </Link>
  )
}

// ---------- the three section views, each with its filters ----------

export function ProjectsView({ homes, filter, onFilter, chips = true, narrow }: { homes: Home[]; filter: string; onFilter: (f: string) => void; chips?: boolean; narrow?: boolean }) {
  const f = FILTERS.projects.find((x) => x.k === filter) ?? FILTERS.projects[0]
  const shown = homes.filter(f.test)
  const open = shown.filter((h) => h.project?.status !== 'sold')
  const done = shown.filter((h) => h.project?.status === 'sold')
  return (
    <div>
      {chips && <Chips k="projects" homes={homes} value={filter} onChange={onFilter} />}
      <div className={cn('flex flex-col gap-6', chips && 'mt-4')}>
        {open.length > 0 && <ProjectCards homes={open} grid={narrow ? '2xl:grid-cols-2' : undefined} />}
        {done.length > 0 && (
          <div>
            {filter === 'all' && open.length > 0 && <h3 className="mb-3 text-[13px] font-semibold tracking-wide text-muted uppercase">Completed</h3>}
            <div className={cn('grid gap-4', narrow ? '2xl:grid-cols-2' : 'xl:grid-cols-2')}>
              {done.map((h) => (
                <SoldCard key={h.id} h={h} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReportsView({ homes, filter, onFilter, sort, setSort, chips = true, grid }: { homes: Home[]; filter: string; onFilter: (f: string) => void; sort: HomeSort; setSort: (s: HomeSort) => void; chips?: boolean; grid?: string }) {
  const f = FILTERS.reports.find((x) => x.k === filter) ?? FILTERS.reports[0]
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {chips ? <Chips k="reports" homes={homes} value={filter} onChange={onFilter} /> : <span />}
        {homes.length > 1 && <SortToggle sort={sort} setSort={setSort} />}
      </div>
      <div className="mt-4">
        <ReportCards key={filter} homes={homes.filter(f.test)} sort={sort} grid={grid} />
      </div>
    </div>
  )
}

export function ListingsView({ homes, filter, onFilter, chips = true }: { homes: Home[]; filter: string; onFilter: (f: string) => void; chips?: boolean }) {
  const f = FILTERS.listings.find((x) => x.k === filter) ?? FILTERS.listings[0]
  return (
    <div>
      {chips && <Chips k="listings" homes={homes} value={filter} onChange={onFilter} />}
      <div className={chips ? 'mt-4' : undefined}>
        <HomesList homes={homes.filter(f.test)} sort="recent" kind="listing" />
      </div>
    </div>
  )
}

function StartPill({ k, start }: { k: SectionKey; start: Parts['start'][SectionKey] }) {
  const Icon = SECTIONS[k].icon
  const cls = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-dashed border-[var(--brand-primary-border)] px-3.5 text-[13px] font-medium text-brand hover:bg-[var(--brand-primary-subtle)]'
  const body = (
    <>
      <Plus className="size-3.5" /> <Icon className="size-3.5" /> {start.label}
    </>
  )
  return start.to ? (
    <Link to={start.to} className={cls}>
      {body}
    </Link>
  ) : (
    <button onClick={start.onClick} className={cls}>
      {body}
    </button>
  )
}

function useFilters() {
  const [f, setF] = useState<Record<SectionKey, string>>({ projects: 'all', reports: 'all', listings: 'all' })
  return [f, (k: SectionKey, v: string) => setF((x) => ({ ...x, [k]: v }))] as const
}

function SectionBody({ k, parts, filter, onFilter, chips = true, narrow }: { k: SectionKey; parts: Parts; filter: string; onFilter: (f: string) => void; chips?: boolean; narrow?: boolean }) {
  if (k === 'projects') return <ProjectsView homes={parts.projects} filter={filter} onFilter={onFilter} chips={chips} narrow={narrow} />
  if (k === 'reports') return <ReportsView homes={parts.reports} filter={filter} onFilter={onFilter} sort={parts.sort} setSort={parts.setSort} chips={chips} grid={narrow ? 'sm:grid-cols-2 xl:grid-cols-3' : undefined} />
  return <ListingsView homes={parts.listings} filter={filter} onFilter={onFilter} chips={chips} />
}

const KEYS: SectionKey[] = ['projects', 'reports', 'listings']

// ---------- D · Smart tabs ----------

/** Tabs only for sections that have homes; an empty section becomes a small "start" pill at the end of the bar. */
export function SmartTabsLayout(parts: Parts) {
  const map = { projects: parts.projects, reports: parts.reports, listings: parts.listings }
  const present = KEYS.filter((k) => map[k].length)
  const missing = KEYS.filter((k) => !map[k].length)
  const [tab, setTab] = useState<SectionKey>(() => present.find((k) => waitingOf(map[k])) ?? present[0] ?? 'projects')
  const [filters, setFilter] = useFilters()
  const active = present.includes(tab) ? tab : present[0]
  return (
    <>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <div role="tablist" aria-label="Homes" className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {present.map((k) => {
            const Icon = SECTIONS[k].icon
            const on = active === k
            const w = waitingOf(map[k])
            return (
              <button
                key={k}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(k)}
                className={cn('inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[15px] font-semibold whitespace-nowrap', on ? 'border-[var(--brand-primary)] text-ink' : 'border-transparent text-muted hover:text-ink')}
              >
                <Icon className={cn('size-4', on && 'text-brand')} />
                {SECTIONS[k].title}
                <span className={cn('rounded-full px-1.5 text-[12px] tabular-nums', on ? 'bg-[var(--brand-primary-subtle)] text-brand' : 'bg-line-soft text-muted')}>{map[k].length}</span>
                {w > 0 && <span className="rounded-full bg-[var(--brand-primary)] px-1.5 text-[11px] font-semibold text-white">{w} need{w === 1 ? 's' : ''} you</span>}
              </button>
            )
          })}
        </div>
        {missing.length > 0 && (
          <div className="mb-2 flex gap-2">
            {missing.map((k) => (
              <StartPill key={k} k={k} start={parts.start[k]} />
            ))}
          </div>
        )}
      </div>
      <div className="mt-5" role="tabpanel">
        {active ? <SectionBody k={active} parts={parts} filter={filters[active]} onFilter={(v) => setFilter(active, v)} /> : parts.empty.projects}
      </div>
    </>
  )
}

// ---------- E · Side nav ----------

/** A folder-style nav on the left: Needs you, then each section with its filters and counts. */
export function SideNavLayout(parts: Parts) {
  const map = { projects: parts.projects, reports: parts.reports, listings: parts.listings }
  const allNeeds = KEYS.reduce((n, k) => n + waitingOf(map[k]), 0)
  const [sel, setSel] = useState<{ k: SectionKey | 'needs'; f: string }>(() => (allNeeds ? { k: 'needs', f: 'all' } : { k: KEYS.find((k) => map[k].length) ?? 'projects', f: 'all' }))
  const item = (on: boolean) => cn('flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[13.5px]', on ? 'bg-[var(--brand-primary-subtle)] font-semibold text-brand' : 'text-ink-2 hover:bg-line-soft')
  return (
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
      <nav aria-label="Homes" className="lg:sticky lg:top-4">
        <button onClick={() => setSel({ k: 'needs', f: 'all' })} className={cn(item(sel.k === 'needs'), 'mb-3 py-2 text-[14.5px] font-semibold')}>
          <span className="inline-flex items-center gap-2">
            <Bell className="size-4" /> Needs you
          </span>
          <span className={cn('rounded-full px-2 text-[12px] tabular-nums', allNeeds ? 'bg-[var(--brand-primary)] text-white' : 'bg-line-soft text-muted')}>{allNeeds}</span>
        </button>
        {KEYS.map((k) => {
          const Icon = SECTIONS[k].icon
          const homes = map[k]
          return (
            <div key={k} className="mb-3 border-t border-line pt-3">
              <button onClick={() => homes.length && setSel({ k, f: 'all' })} className={cn(item(sel.k === k && sel.f === 'all'), 'text-[14.5px] font-semibold text-ink')}>
                <span className="inline-flex items-center gap-2">
                  <Icon className="size-4 text-brand" /> {SECTIONS[k].title}
                </span>
                <span className="text-[12px] font-normal text-muted tabular-nums">{homes.length}</span>
              </button>
              {homes.length ? (
                <div className="mt-0.5 flex flex-col pl-6">
                  {FILTERS[k].slice(1).map((f) => {
                    const n = homes.filter(f.test).length
                    if (!n) return null
                    return (
                      <button key={f.k} onClick={() => setSel({ k, f: f.k })} className={item(sel.k === k && sel.f === f.k)}>
                        <span className="inline-flex items-center gap-1.5">
                          {f.k === 'needs' && <span className="size-1.5 rounded-full bg-[var(--brand-primary)]" />}
                          {f.label}
                        </span>
                        <span className="text-[12px] text-muted tabular-nums">{n}</span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="mt-1 pl-6">
                  <StartPill k={k} start={parts.start[k]} />
                </div>
              )}
            </div>
          )
        })}
      </nav>
      <div className="min-w-0">
        {sel.k === 'needs' ? (
          <div className="flex flex-col gap-10">
            {KEYS.filter((k) => waitingOf(map[k])).map((k) => (
              <section key={k}>
                <SectionHead k={k} count={waitingOf(map[k])} waiting={0} small />
                <SectionBody k={k} parts={parts} filter="needs" onFilter={() => {}} chips={false} narrow />
              </section>
            ))}
            {!allNeeds && <p className="rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">Nothing is waiting on you right now.</p>}
          </div>
        ) : (
          <section>
            <SectionHead k={sel.k} count={map[sel.k].length} waiting={waitingOf(map[sel.k])} />
            <SectionBody k={sel.k} parts={parts} filter={sel.f} onFilter={(f) => setSel({ k: sel.k as SectionKey, f })} chips={false} narrow />
          </section>
        )}
      </div>
    </div>
  )
}

// ---------- F · Summary tiles ----------

/** Three tiles that sum up each section (and turn into a start action when empty); pick one to see it below. */
export function TilesLayout(parts: Parts) {
  const map = { projects: parts.projects, reports: parts.reports, listings: parts.listings }
  const present = KEYS.filter((k) => map[k].length)
  const [tab, setTab] = useState<SectionKey>(() => present.find((k) => waitingOf(map[k])) ?? present[0] ?? 'projects')
  const [filters, setFilter] = useFilters()
  const active = present.includes(tab) ? tab : present[0]
  const p = parts.projects
  const facts: Record<SectionKey, string[]> = {
    projects: [
      `${p.filter((h) => h.project?.status !== 'sold').length} in progress · ${p.filter((h) => h.project?.status === 'sold').length} completed`,
      (() => {
        const sold = p.filter((h) => h.project?.sold).reduce((n, h) => n + (h.project!.sold!.sale - h.project!.sold!.asIs), 0)
        return sold ? `${gain(sold)} added for your sellers` : 'Revive covers the work until it sells'
      })(),
    ],
    reports: [
      `${countFor('reports', 'opened', parts.reports)} opened · ${countFor('reports', 'none', parts.reports)} not shared yet`,
      `${gain(parts.reports.reduce((n, h) => n + (h.upside ?? 0), 0))} upside across them`,
    ],
    listings: [
      `${countFor('listings', 'cut', parts.listings)} price cuts · ${countFor('listings', 'stale', parts.listings)} at 30+ days`,
      `${gain(parts.listings.reduce((n, h) => n + (h.upside ?? 0), 0))} Revive could add`,
    ],
  }
  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {KEYS.map((k) => {
          const Icon = SECTIONS[k].icon
          const homes = map[k]
          const w = waitingOf(homes)
          const on = active === k
          if (!homes.length) {
            const st = parts.start[k]
            const inner = (
              <>
                <span className="grid size-9 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-ink">{SECTIONS[k].title}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold text-brand">
                    <Plus className="size-3.5" /> {st.label}
                  </span>
                </span>
              </>
            )
            const cls = 'flex items-center gap-3 rounded-2xl border border-dashed border-[var(--brand-primary-border)] bg-white p-4 text-left hover:bg-[var(--brand-primary-subtle)]/50'
            return st.to ? (
              <Link key={k} to={st.to} className={cls}>
                {inner}
              </Link>
            ) : (
              <button key={k} onClick={st.onClick} className={cls}>
                {inner}
              </button>
            )
          }
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              aria-pressed={on}
              className={cn('rounded-2xl border bg-white p-4 text-left shadow-card transition-colors', on ? 'border-[var(--brand-primary)] ring-1 ring-[var(--brand-primary)]' : 'border-line hover:border-[var(--brand-primary-border)]')}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <span className={cn('grid size-8 place-items-center rounded-lg', on ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--brand-primary-subtle)] text-brand')}>
                    <Icon className="size-4" />
                  </span>
                  <span className="text-[15px] font-semibold text-ink">{SECTIONS[k].title}</span>
                </span>
                {w > 0 && <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[11.5px] font-semibold text-white">{w} need{w === 1 ? 's' : ''} you</span>}
              </span>
              <span className="mt-3 block text-[28px] leading-none font-semibold text-ink tabular-nums">{homes.length}</span>
              <span className="mt-2 block text-[13px] text-ink-2">{facts[k][0]}</span>
              <span className="mt-0.5 block text-[12.5px] font-medium text-[var(--green)]">{facts[k][1]}</span>
            </button>
          )
        })}
      </div>
      {active && (
        <section className="mt-8">
          <SectionHead k={active} count={map[active].length} waiting={waitingOf(map[active])} />
          <SectionBody k={active} parts={parts} filter={filters[active]} onFilter={(v) => setFilter(active, v)} />
        </section>
      )}
    </>
  )
}

export const LAYOUTS = [
  { k: 'tabs2', label: 'D · Smart tabs', C: SmartTabsLayout },
  { k: 'side', label: 'E · Side nav', C: SideNavLayout },
  { k: 'tiles', label: 'F · Summary tiles', C: TilesLayout },
] as const
export type LayoutKey = (typeof LAYOUTS)[number]['k']
