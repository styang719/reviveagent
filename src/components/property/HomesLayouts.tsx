import { ArrowRight, Bell, Check, FileText, Hammer, ImageIcon, LayoutGrid, Plus, Sparkles, Tag, TrendingUp } from 'lucide-react'
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


const sortHomes = (homes: Home[], sort: HomeSort) =>
  [...homes].sort((a, b) => Number(!!b.needsYou) - Number(!!a.needsYou) || (sort === 'upside' ? (b.upside ?? 0) - (a.upside ?? 0) : b.at - a.at))

/**
 * AI reports as small report "documents", quieter than project cards: a thumbnail, the report's title line,
 * today → after Revive, where it is with the homeowner, and one text action.
 */
export function ReportCards({ homes, sort, grid = 'sm:grid-cols-2 xl:grid-cols-3', limit = 9 }: { homes: Home[]; sort: HomeSort; grid?: string; limit?: number }) {
  const [all, setAll] = useState(false)
  const sorted = sortHomes(homes, sort)
  const visible = all ? sorted : sorted.slice(0, limit)
  return (
    <div>
      <div className={cn('grid gap-3', grid)}>
        {visible.map((h) => {
          const n = h.needsYou
          const sh = h.report?.share ?? { label: 'Not shared yet', tone: 'none' as const }
          const none = sh.tone === 'none'
          return (
            <Link
              key={h.id}
              to={n?.to ?? `/property/${h.id}?tab=report`}
              className={cn(
                'group flex flex-col rounded-xl border bg-white p-3.5 transition-colors hover:border-[var(--brand-primary-border)]',
                'border-line',
              )}
            >
              {/* who and how much: the address and the upside carry the card */}
              <span className="flex items-center gap-3">
                <span className="block size-11 shrink-0 overflow-hidden rounded-lg bg-line-soft">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-ink">{h.address}</span>
                  <span className="block truncate text-[12.5px] text-muted">
                    {h.city}
                    {h.product && ` · ${h.product}`}
                  </span>
                </span>
                <span className="shrink-0 text-[18px] font-semibold text-[var(--green)] tabular-nums">{h.upside ? gain(h.upside) : '—'}</span>
              </span>
              {/* where it stands, and the one next step */}
              <span className="mt-3 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
                <span className={cn('inline-flex min-w-0 items-center gap-1.5 truncate text-[12.5px]', n ? 'font-semibold text-brand' : 'text-muted')}>
                  <span className={cn('size-1.5 shrink-0 rounded-full', n ? 'bg-[var(--brand-primary)]' : sh.tone === 'opened' ? 'bg-[var(--green)]' : sh.tone === 'shared' ? 'bg-[var(--brand-primary-border)]' : 'bg-[#c4cad6]')} />
                  <span className="truncate">{n ? n.status : sh.label}</span>
                  {!!h.report?.designs && <Sparkles className="size-3 shrink-0 text-[var(--brand-agent)]" aria-label="Has RenoVision designs" />}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-brand">
                  {n ? n.cta.replace(/ with .*$/, '') : none ? 'Share' : 'Open'} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
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
    { k: 'cut', label: 'Price cut', test: (h) => (h.listing?.property.facts.priceCutDaysAgo ?? 99) <= 14 },
    { k: 'stale', label: '30+ days', test: (h) => (h.listing?.property.facts.daysOnMarket ?? 0) >= 30 },
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
      {chips && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Chips k="reports" homes={homes} value={filter} onChange={onFilter} />
          {homes.length > 1 && <SortToggle sort={sort} setSort={setSort} />}
        </div>
      )}
      <div className={chips ? 'mt-4' : undefined}>
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

function SectionBody({ k, parts, filter, onFilter, chips = true, narrow }: { k: SectionKey; parts: Parts; filter: string; onFilter: (f: string) => void; chips?: boolean; narrow?: boolean }) {
  if (k === 'projects') return <ProjectsView homes={parts.projects} filter={filter} onFilter={onFilter} chips={chips} narrow={narrow} />
  if (k === 'reports') return <ReportsView homes={parts.reports} filter={filter} onFilter={onFilter} sort={parts.sort} setSort={parts.setSort} chips={chips} grid={narrow ? 'sm:grid-cols-2 2xl:grid-cols-3' : undefined} />
  return <ListingsView homes={parts.listings} filter={filter} onFilter={onFilter} chips={chips} />
}

const KEYS: SectionKey[] = ['projects', 'reports', 'listings']

// ---------- the page: side nav ----------

type View = { kind: 'all' } | { kind: 'section'; k: SectionKey; f: string }

/**
 * Homes is the record of every home, not a to-do list (the dashboard is that): All homes, then one item per
 * type. Status filters live in the page as sub-tabs. A home that needs the agent sorts first, says why in
 * blue and has the blue action; each group's "N need you" chip filters that group in place.
 */
export function SideNavLayout(parts: Parts) {
  const map = { projects: parts.projects, reports: parts.reports, listings: parts.listings }
  const total = KEYS.reduce((n, k) => n + map[k].length, 0)
  const [view, setView] = useState<View>({ kind: 'all' })
  // "N need you" chips: show only those homes in that group, in place
  const [needsOnly, setNeedsOnly] = useState<Set<SectionKey>>(() => new Set())
  const toggleNeeds = (k: SectionKey) =>
    setNeedsOnly((s) => {
      const x = new Set(s)
      if (x.has(k)) x.delete(k)
      else x.add(k)
      return x
    })
  const pick = (k: SectionKey) => (needsOnly.has(k) ? map[k].filter((h) => h.needsYou) : map[k])
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
          <LayoutGrid className="size-4 text-brand" /> All homes {count(total)}
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
          <>
            <ViewHead title="All homes" icon={LayoutGrid} sub={`${total} homes: ${map.projects.length} projects, ${map.reports.length} AI reports, ${map.listings.length} listings.`} />
            <div className="flex flex-col gap-10">
              {KEYS.filter((k) => map[k].length).map((k) => {
                const preview = k === 'reports' ? 4 : k === 'projects' ? 2 : 5 // one row each, so every type stays near the top
                return (
                  <section key={k}>
                    <GroupHead k={k} n={map[k].length} onAll={() => setView({ kind: 'section', k, f: 'all' })} total={map[k].length} preview={map[k].length > preview} needs={waitingOf(map[k])} needsOn={needsOnly.has(k)} onNeeds={() => toggleNeeds(k)} />
                    <SectionBody k={k} parts={{ ...parts, [k]: needsOnly.has(k) ? pick(k) : topOf(map[k]).slice(0, preview) }} filter="all" onFilter={() => {}} chips={false} narrow />
                  </section>
                )
              })}
            </div>
          </>
        )}
        {view.kind === 'section' && (
          <>
            <ViewHead
              title={SECTIONS[view.k].title}
              icon={SECTIONS[view.k].icon}
              sub={SECTIONS[view.k].hint}
              right={waitingOf(map[view.k]) > 0 ? <NeedsChip n={waitingOf(map[view.k])} on={needsOnly.has(view.k)} onClick={() => toggleNeeds((view as { k: SectionKey }).k)} /> : undefined}
            />
            <SectionBody k={view.k} parts={{ ...parts, [view.k]: pick(view.k) }} filter={view.f} onFilter={(f) => setView({ kind: 'section', k: (view as { k: SectionKey }).k, f })} narrow />
          </>
        )}
      </div>
    </div>
  )
}

/** The homes to preview first: waiting on you, then still in progress, then newest. */
const topOf = (homes: Home[]) =>
  [...homes].sort((a, b) => Number(!!b.needsYou) - Number(!!a.needsYou) || Number(a.project?.status === 'sold') - Number(b.project?.status === 'sold') || b.at - a.at)

/** "N need you": a filter chip. On, the group shows only the homes waiting on the agent. */
function NeedsChip({ n, on, onClick }: { n: number; on: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold transition-colors', on ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--brand-primary-subtle)] text-brand hover:bg-[var(--brand-primary-border)]/50')}
    >
      <span className={cn('size-1.5 rounded-full', on ? 'bg-white' : 'bg-[var(--brand-primary)]')} /> {n} need{n === 1 ? 's' : ''} you
      {on && <span aria-hidden="true">×</span>}
    </button>
  )
}

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

/** A group inside Needs you / All homes: the type, its count, and a link to see that type on its own. */
function GroupHead({ k, n, total, onAll, preview, needs, needsOn, onNeeds }: { k: SectionKey; n: number; total: number; onAll: () => void; preview?: boolean; needs?: number; needsOn?: boolean; onNeeds?: () => void }) {
  const Icon = SECTIONS[k].icon
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Icon className="size-4 text-brand" /> {SECTIONS[k].title}
        <span className="text-[13px] font-normal text-muted tabular-nums">{n}</span>
        {!!needs && <NeedsChip n={needs} on={!!needsOn} onClick={onNeeds} />}
      </h3>
      <button onClick={onAll} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
        {preview ? `See all ${total}` : 'Open'} <ArrowRight className="size-3.5" />
      </button>
    </div>
  )
}
