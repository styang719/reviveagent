import { ArrowRight, Bell, Check, ChevronDown, FileText, Hammer, ImageIcon, LayoutGrid, Plus, Tag, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ProjectCards, type Home, type HomeSort } from './HomesList'
import { OwnListings } from './OwnListings'
import { REPORT_STYLES, ReportCard, type ReportStyle } from './ReportVariants'

// the report card design to compare, shared across the page and remembered per browser
let reportStyle: ReportStyle = (() => {
  try {
    return 'row' as ReportStyle // compact chosen; the other two stay in ReportVariants for reference
  } catch {
    return 'row'
  }
})()
const styleSubs = new Set<() => void>()
function setReportStyle(k: ReportStyle) {
  reportStyle = k
  try {
    localStorage.setItem('rv-report-style', k)
  } catch {
    /* private window */
  }
  styleSubs.forEach((f) => f())
}
function useReportStyle() {
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    styleSubs.add(f)
    return () => void styleSubs.delete(f)
  }, [])
  return reportStyle
}
/** The one way to add: a "+ New" button beside search that opens a short menu (a new report, or a project). */
export function NewMenu({ start }: { start: Parts['start'] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const items = [
    { k: 'reports' as const, icon: FileText, title: 'New AI report', sub: 'Any address. See what it could sell for.' },
    { k: 'projects' as const, icon: Hammer, title: 'Start a project', sub: 'Send a home to Revive for review.' },
  ]
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-4 text-[14px] font-medium text-white shadow-sm hover:opacity-90"
      >
        <Plus className="size-4" /> New <ChevronDown className="size-4 opacity-80" />
      </button>
      {open && (
        <div className={cn('absolute z-30 mt-1.5 w-72 rounded-xl border border-line bg-white p-1.5 shadow-[0_16px_40px_rgba(28,46,88,0.16)]', 'right-0')}>
          {items.map((it) => (
            <button key={it.k} onClick={() => (setOpen(false), start[it.k].onClick?.())} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-head">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
                <it.icon className="size-4" />
              </span>
              <span>
                <span className="block text-[14px] font-semibold text-ink">{it.title}</span>
                <span className="block text-[12.5px] text-muted">{it.sub}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReportStyleSwitch() {
  const style = useReportStyle()
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-line-soft p-0.5" role="radiogroup" aria-label="Report card design">
      {REPORT_STYLES.map((r) => (
        <button key={r.k} role="radio" aria-checked={style === r.k} onClick={() => setReportStyle(r.k)} className={cn('h-6 rounded-md px-2 text-[11.5px] font-medium', style === r.k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}>
          {r.label}
        </button>
      ))}
    </div>
  )
}

// Three page layouts for Homes, to compare. They share the same three section views (each with its own
// filters) and the same section labels; what changes is how you move between sections. An empty section
// never takes up the page: it shrinks to a small "start" action.

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))

export type SectionKey = 'projects' | 'reports' | 'listings'
export const SECTIONS: Record<SectionKey, { title: string; nav: string; icon: typeof Hammer; hint: string }> = {
  projects: { title: 'Projects with Revive', nav: 'Projects', icon: Hammer, hint: 'Homes Revive is renovating with you, from review to listing.' },
  reports: { title: 'AI reports', nav: 'AI reports', icon: FileText, hint: 'Homes you’ve run a Revive AI report on. Share them, follow up, start a project.' },
  listings: { title: 'Your listings', nav: 'Your listings', icon: Tag, hint: 'Your active MLS listings, and what Revive could add to each.' },
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


const sortHomes = (homes: Home[], sort: HomeSort) =>
  [...homes].sort((a, b) => Number(!!b.needsYou) - Number(!!a.needsYou) || (sort === 'upside' ? (b.upside ?? 0) - (a.upside ?? 0) : b.at - a.at))

/**
 * AI reports as small report "documents", quieter than project cards: a thumbnail, the report's title line,
 * today → after Revive, where it is with the homeowner, and one text action.
 */
export function ReportCards({ homes, sort, grid = 'sm:grid-cols-2 xl:grid-cols-3', limit = 9, add }: { homes: Home[]; sort: HomeSort; grid?: string; limit?: number; add?: React.ReactNode }) {
  const [all, setAll] = useState(false)
  const style = useReportStyle()
  const sorted = sortHomes(homes, sort)
  const visible = all ? sorted : sorted.slice(0, limit)
  return (
    <div>
      <div className={cn('grid gap-3', style === 'photo' ? 'sm:grid-cols-2 2xl:grid-cols-3' : grid)}>
        {visible.map((h) => (
          <ReportCard key={h.id} h={h} style={style} />
        ))}
        {add}
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
    { k: 'review', label: 'In review', test: (h) => h.project?.status === 'review' },
    { k: 'active', label: 'In construction', test: (h) => h.project?.status === 'active' },
    { k: 'sold', label: 'Completed', test: (h) => h.project?.status === 'sold' },
  ],
  reports: [
    { k: 'all', label: 'All', test: () => true },
    { k: 'none', label: 'Not shared', test: (h) => !h.report?.share || h.report.share.tone === 'none' },
    { k: 'shared', label: 'Shared', test: (h) => h.report?.share?.tone === 'shared' },
    { k: 'opened', label: 'Opened', test: (h) => h.report?.share?.tone === 'opened' || h.report?.share?.tone === 'leadform' },
  ],
  listings: [
    { k: 'all', label: 'All', test: () => true },
    { k: 'opp', label: 'Revive opportunity', test: (h) => (h.upside ?? 0) >= 15000 },
    { k: 'track', label: 'Selling on track', test: (h) => (h.upside ?? 0) < 15000 },
  ],
}
export const countFor = (k: SectionKey, f: string, homes: Home[]) => homes.filter(FILTERS[k].find((x) => x.k === f)!.test).length

/** Status sub-tabs under a section title: one row, mutually exclusive, with counts; empty statuses hidden. */
function Chips({ k, homes, value, onChange }: { k: SectionKey; homes: Home[]; value: string; onChange: (f: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]" role="tablist" aria-label={`${SECTIONS[k].title} by status`}>
      {FILTERS[k].map((f) => {
        const n = homes.filter(f.test).length
        if (!n && f.k !== 'all') return null
        const on = value === f.k
        return (
          <button
            key={f.k}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(f.k)}
            className={cn('-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13.5px] font-medium whitespace-nowrap', on ? 'border-[var(--brand-primary)] text-ink' : 'border-transparent text-muted hover:text-ink')}
          >
            {f.label} <span className={cn('rounded-full px-1.5 text-[12px] tabular-nums', on ? 'bg-[var(--brand-primary-subtle)] text-brand' : 'bg-line-soft text-muted')}>{n}</span>
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

export function ProjectsView({ homes, filter, onFilter, chips = true, narrow, add }: { homes: Home[]; filter: string; onFilter: (f: string) => void; chips?: boolean; narrow?: boolean; add?: React.ReactNode }) {
  const f = FILTERS.projects.find((x) => x.k === filter) ?? FILTERS.projects[0]
  const shown = homes.filter(f.test)
  const open = shown.filter((h) => h.project?.status !== 'sold')
  const done = shown.filter((h) => h.project?.status === 'sold')
  return (
    <div>
      {chips && <Chips k="projects" homes={homes} value={filter} onChange={onFilter} />}
      <div className={cn('flex flex-col gap-6', chips && 'mt-4')}>
        {open.length > 0 && <ProjectCards homes={open} grid={narrow ? '2xl:grid-cols-2' : undefined} />}
        {add}
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

export function ReportsView({ homes, filter, onFilter, sort, setSort, chips = true, grid, add }: { homes: Home[]; filter: string; onFilter: (f: string) => void; sort: HomeSort; setSort: (s: HomeSort) => void; chips?: boolean; grid?: string; add?: React.ReactNode }) {
  const f = FILTERS.reports.find((x) => x.k === filter) ?? FILTERS.reports[0]
  return (
    <div>
      {chips && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Chips k="reports" homes={homes} value={filter} onChange={onFilter} />
          {homes.length > 1 && <SortToggle sort={sort} setSort={setSort} />}
        </div>
      )}
      <div className={chips ? 'mt-4' : undefined}>
        <ReportCards key={filter} homes={homes.filter(f.test)} sort={sort} grid={grid} add={add} />
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
        <OwnListings homes={homes.filter(f.test)} />
      </div>
    </div>
  )
}

function SectionBody({ k, parts, filter, onFilter, chips = true, narrow }: { k: SectionKey; parts: Parts; filter: string; onFilter: (f: string) => void; chips?: boolean; narrow?: boolean }) {
  if (k === 'projects') return <ProjectsView homes={parts.projects} filter={filter} onFilter={onFilter} chips={chips} narrow={narrow} />
  if (k === 'reports') return <ReportsView homes={parts.reports} filter={filter} onFilter={onFilter} sort={parts.sort} setSort={parts.setSort} chips={chips} grid={narrow ? 'sm:grid-cols-2 2xl:grid-cols-3' : undefined} />
  return <ListingsView homes={parts.listings} filter={filter} onFilter={onFilter} chips={chips} />
}

const KEYS: SectionKey[] = ['projects', 'reports', 'listings']

// ---------- the page: side nav ----------

type View = { kind: 'all' } | { kind: 'section'; k: SectionKey; f: string }

/**
 * Homes is the record of every home, not a to-do list (the dashboard is that): an Overview, then one item per
 * type. Status filters live in the page as sub-tabs. A home that needs the agent sorts first, says why in
 * blue and has the blue action; each group's "N need you" chip filters that group in place.
 */
export function SideNavLayout(parts: Parts) {
  const map = { projects: parts.projects, reports: parts.reports, listings: parts.listings }
  const [view, setView] = useState<View>({ kind: 'all' })
  const isOn = (v: View) => v.kind === view.kind && (v.kind !== 'section' || (view.kind === 'section' && view.k === v.k))
  const item = (on: boolean) =>
    cn(
      'relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] transition-colors',
      on ? 'bg-[var(--brand-primary-subtle)] font-semibold text-ink' : 'font-medium text-ink-2 hover:bg-line-soft hover:text-ink',
    )
  const bar = (on: boolean) => on && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--brand-primary)]" aria-hidden="true" />
  const count = (n: number, blue?: boolean) => <span className={cn('ml-auto rounded-full px-1.5 text-[12px] tabular-nums', blue ? 'bg-[var(--brand-primary)] font-semibold text-white' : 'text-muted')}>{n}</span>

  return (
    <div className="mt-6 grid items-start gap-8 lg:grid-cols-[232px_minmax(0,1fr)]">
      <nav aria-label="Homes" className="lg:sticky lg:top-4">
        <button onClick={() => setView({ kind: 'all' })} className={item(isOn({ kind: 'all' }))} aria-current={isOn({ kind: 'all' }) || undefined}>
          {bar(isOn({ kind: 'all' }))}
          <LayoutGrid className="size-4 text-brand" /> Overview
        </button>

        <p className="mt-5 px-3 pb-1.5 text-[11.5px] font-semibold tracking-wide text-faint uppercase">By type</p>
        {KEYS.map((k) => {
          const Icon = SECTIONS[k].icon
          const homes = map[k]
          const v: View = { kind: 'section', k, f: 'all' }
          const on = isOn(v)
          if (!homes.length) {
            const st = parts.start[k]
            return (
              <div key={k} className="flex items-center gap-2.5 px-3 py-2 text-[14px] font-medium text-faint">
                <Icon className="size-4" /> {SECTIONS[k].nav}
                <button onClick={st.onClick} className="ml-auto inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-brand hover:underline" title={st.label}>
                  <Plus className="size-3.5" /> Add
                </button>
              </div>
            )
          }
          return (
            <button key={k} onClick={() => setView(v)} className={item(on)} aria-current={on || undefined}>
              {bar(on)}
              <Icon className="size-4 text-brand" />
              <span className="truncate">{SECTIONS[k].nav}</span>
              {count(homes.length)}
            </button>
          )
        })}
      </nav>

      <div className="min-w-0">
        {view.kind === 'all' && (
          // Overview: a fixed, short preview of each type (what needs the agent first), each ending in See all,
          // so every type stays near the top; the full lists live under each type
          <div className="flex flex-col gap-14">
            {KEYS.filter((k) => map[k].length).map((k) => {
              const pool = k === 'projects' ? map[k].filter((h) => h.project?.status !== 'sold') : map[k]
              const cap = k === 'projects' ? 2 : 5
              const items = topOf(pool.length ? pool : map[k]).slice(0, cap)
              return (
                <section key={k}>
                  <GroupHead k={k} n={map[k].length} onAll={() => setView({ kind: 'section', k, f: 'all' })} />
                  <SectionBody k={k} parts={{ ...parts, [k]: items }} filter="all" onFilter={() => {}} chips={false} narrow />
                </section>
              )
            })}
          </div>
        )}
        {view.kind === 'section' && (
          <>
            <ViewHead
              title={SECTIONS[view.k].title}
              icon={SECTIONS[view.k].icon}
              sub={SECTIONS[view.k].hint}
            />
            <SectionBody k={view.k} parts={{ ...parts, [view.k]: topOf(map[view.k]) }} filter={view.f} onFilter={(f) => setView({ kind: 'section', k: (view as { k: SectionKey }).k, f })} narrow />
          </>
        )}
      </div>
    </div>
  )
}

/** The homes to preview first: waiting on you, then still in progress, then newest. */
const topOf = (homes: Home[]) =>
  [...homes].sort((a, b) => Number(!!b.needsYou) - Number(!!a.needsYou) || Number(a.project?.status === 'sold') - Number(b.project?.status === 'sold') || b.at - a.at)

function ViewHead({ title, icon: Icon, sub, right }: { title: string; icon: typeof Bell; sub: string; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
      <h2 className="flex items-center gap-2.5 text-xl font-semibold text-ink">
        <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      <p className="mt-1 text-[13.5px] text-muted">{sub}</p>
      </div>
      {right}
    </div>
  )
}

/** A group in the Overview: the type, its count, and a link to see that type on its own. */
function GroupHead({ k, n, onAll }: { k: SectionKey; n: number; total?: number; onAll: () => void }) {
  const Icon = SECTIONS[k].icon
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-[18px] font-semibold text-ink">
        <Icon className="size-[18px] text-brand" /> {SECTIONS[k].title}
        <span className="text-[14px] font-normal text-muted tabular-nums">{n}</span>
      </h3>
      <span className="flex items-center gap-3">
        <button onClick={onAll} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
          See all {n} <ArrowRight className="size-3.5" />
        </button>
      </span>
    </div>
  )
}
