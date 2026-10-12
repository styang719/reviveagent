import { ArrowRight, Check, FileText, Hammer, Sparkles, Tag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { listingStatus } from './homeRows'
import { HomesList, ProjectCards, type Home, type HomeSort } from './HomesList'

// Three page layouts for Homes, to compare. All share the same section header (icon, title, count,
// how many need you), so Projects, AI reports and Your listings are always easy to spot.

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

/** A · Sections: everything on one page, full width, with a jump bar to each section. */
export function SectionsLayout({ projects, reports, listings, sort, setSort, empty }: Parts) {
  const go = (k: SectionKey) => document.getElementById(`sec-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const items: [SectionKey, Home[]][] = [
    ['projects', projects],
    ['reports', reports],
    ['listings', listings],
  ]
  return (
    <>
      <nav aria-label="Jump to section" className="sticky top-0 z-20 -mx-2 mt-6 flex gap-2 overflow-x-auto bg-[var(--page,white)]/95 px-2 py-2 backdrop-blur [scrollbar-width:none]">
        {items.map(([k, homes]) => {
          const Icon = SECTIONS[k].icon
          const w = waitingOf(homes)
          return (
            <button key={k} onClick={() => go(k)} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-[13.5px] font-medium text-ink shadow-sm hover:border-[var(--brand-primary-border)]">
              <Icon className="size-4 text-brand" /> {SECTIONS[k].title}
              <span className="text-[12px] text-muted tabular-nums">{homes.length}</span>
              {w > 0 && <span className="size-2 rounded-full bg-[var(--brand-primary)]" aria-label={`${w} need you`} />}
            </button>
          )
        })}
      </nav>
      <section className="mt-6 scroll-mt-16" aria-labelledby="sec-projects">
        <SectionHead k="projects" count={projects.length} waiting={waitingOf(projects)} />
        {projects.length ? <ProjectCards homes={projects} /> : empty.projects}
      </section>
      <section className="mt-12 scroll-mt-16" aria-labelledby="sec-reports">
        <SectionHead k="reports" count={reports.length} waiting={waitingOf(reports)} right={reports.length > 1 ? <SortToggle sort={sort} setSort={setSort} /> : undefined} />
        {reports.length ? <ReportCards homes={reports} sort={sort} /> : empty.reports}
      </section>
      <section className="mt-12 scroll-mt-16" aria-labelledby="sec-listings">
        <SectionHead k="listings" count={listings.length} waiting={waitingOf(listings)} />
        {listings.length ? <HomesList homes={listings} sort="recent" kind="listing" /> : empty.listings}
      </section>
    </>
  )
}

/** B · Tabs: one section at a time, each in its own form; every tab shows its count and what needs you. */
export function TabsLayout({ projects, reports, listings, sort, setSort, empty }: Parts) {
  const [tab, setTab] = useState<SectionKey>(() => (waitingOf(projects) ? 'projects' : waitingOf(reports) ? 'reports' : waitingOf(listings) ? 'listings' : 'projects'))
  const map = { projects, reports, listings }
  return (
    <>
      <div role="tablist" aria-label="Homes" className="mt-6 grid grid-cols-3 gap-3">
        {(Object.keys(SECTIONS) as SectionKey[]).map((k) => {
          const Icon = SECTIONS[k].icon
          const on = tab === k
          const w = waitingOf(map[k])
          return (
            <button
              key={k}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(k)}
              className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] ring-1 ring-[var(--brand-primary)]' : 'border-line bg-white hover:border-[var(--brand-primary-border)]')}
            >
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', on ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--brand-primary-subtle)] text-brand')}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold text-ink">
                  {SECTIONS[k].title} <span className="font-normal text-muted tabular-nums">{map[k].length}</span>
                </span>
                <span className={cn('block truncate text-[12.5px]', w ? 'font-semibold text-brand' : 'text-muted')}>{w ? `${w} need${w === 1 ? 's' : ''} you` : 'Nothing waiting on you'}</span>
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-6" role="tabpanel" aria-labelledby={`sec-${tab}`}>
        {/* the tab already names the section: just say what it is, and sort reports */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p id={`sec-${tab}`} className="text-[13.5px] text-muted">
            {SECTIONS[tab].hint}
          </p>
          {tab === 'reports' && reports.length > 1 && <SortToggle sort={sort} setSort={setSort} />}
        </div>
        {tab === 'projects' && (projects.length ? <ProjectCards homes={projects} /> : empty.projects)}
        {tab === 'reports' && (reports.length ? <ReportCards homes={reports} sort={sort} limit={12} /> : empty.reports)}
        {tab === 'listings' && (listings.length ? <HomesList homes={listings} sort="recent" kind="listing" /> : empty.listings)}
      </div>
    </>
  )
}

/** One compact card in a board lane: photo, address, why or where it stands, and the number that matters. */
function LaneCard({ h, k }: { h: Home; k: SectionKey }) {
  const n = h.needsYou
  const p = h.project
  const pct = p ? (p.pct ?? Math.round(((p.step + 0.5) / p.steps) * 100)) : 0
  const sh = h.report?.share
  const to = n?.to ?? `/property/${h.id}${k === 'projects' ? '?tab=project' : k === 'reports' ? '?tab=report' : ''}`
  const st = h.listing ? listingStatus(h.listing) : null
  return (
    <Link to={to} className={cn('group block rounded-xl border bg-white p-3 shadow-card transition-shadow hover:shadow-[0_8px_24px_rgba(28,46,88,0.10)]', n ? 'border-[var(--brand-primary-border)] ring-1 ring-[var(--brand-primary-border)]' : 'border-line')}>
      <span className="flex items-center gap-3">
        <span className="block size-12 shrink-0 overflow-hidden rounded-lg bg-line-soft">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[14px] font-semibold text-ink">{h.address}</span>
            <span className="shrink-0 text-[13px] font-semibold text-[var(--green)] tabular-nums">{h.upside ? gain(h.upside) : ''}</span>
          </span>
          <span className="mt-0.5 block truncate text-[12.5px] text-muted">
            {k === 'projects' && p ? `${p.product} · ${p.status === 'active' ? `${pct}% built` : `step ${p.step + 1} of ${p.steps}`}` : k === 'listings' && h.listing ? `${money(h.listing.property.valueNow)} · ${st?.label}` : (sh?.label ?? 'Not shared yet')}
          </span>
        </span>
      </span>
      {k === 'projects' && p && (
        <span className="mt-2.5 block h-1.5 overflow-hidden rounded-full bg-line-soft">
          <span className={cn('block h-full rounded-full', p.status === 'active' ? 'bg-[var(--green)]' : 'bg-[var(--brand-primary)]')} style={{ width: `${pct}%` }} />
        </span>
      )}
      {n ? (
        <span className="mt-2.5 flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] text-[12.5px] font-medium text-white">
          <n.icon className="size-3.5" /> <span className="truncate">{n.cta}</span>
        </span>
      ) : (
        k === 'projects' && (
          <span className="mt-2 flex items-center gap-1 text-[12px] font-medium text-[var(--green)]">
            <Check className="size-3.5" /> On track
          </span>
        )
      )}
    </Link>
  )
}

/** C · Board: three lanes side by side, so every kind of home is visible at a glance. */
export function BoardLayout({ projects, reports, listings, sort, empty }: Parts) {
  const lanes: [SectionKey, Home[]][] = [
    ['projects', projects],
    ['reports', sortHomes(reports, sort)],
    ['listings', listings],
  ]
  const [open, setOpen] = useState<SectionKey | null>(null)
  return (
    <div className="mt-8 grid items-start gap-5 lg:grid-cols-3">
      {lanes.map(([k, homes]) => {
        const shown = open === k ? homes : homes.slice(0, 5)
        return (
          <section key={k} aria-labelledby={`sec-${k}`} className="rounded-2xl border border-line bg-head/70 p-3">
            <div className="px-1 pt-1">
              <SectionHead k={k} count={homes.length} waiting={waitingOf(homes)} small />
            </div>
            {homes.length ? (
              <div className="flex flex-col gap-2.5">
                {shown.map((h) => (
                  <LaneCard key={h.id} h={h} k={k} />
                ))}
                {homes.length > 5 && (
                  <button onClick={() => setOpen(open === k ? null : k)} className="rounded-lg py-2 text-[13px] font-medium text-brand hover:bg-white">
                    {open === k ? 'Show fewer' : `Show all ${homes.length}`}
                  </button>
                )}
              </div>
            ) : (
              <div className="[&>*]:!shadow-none">{empty[k]}</div>
            )}
          </section>
        )
      })}
    </div>
  )
}

export const LAYOUTS = [
  { k: 'sections', label: 'A · Sections', C: SectionsLayout },
  { k: 'tabs', label: 'B · Tabs', C: TabsLayout },
  { k: 'board', label: 'C · Board', C: BoardLayout },
] as const
export type LayoutKey = (typeof LAYOUTS)[number]['k']
