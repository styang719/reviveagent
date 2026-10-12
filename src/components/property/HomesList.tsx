import { ArrowRight, Check, Eye, FileText, Hammer, ImagePlus, Send, Sparkles, Tag, TrendingDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { listingStatus, type ReportRow } from './homeRows'

// Homes as one list: each home once, tagged with what it is (Revive project, AI report, your listing),
// with the one status and the one next step that matter most for it.

export interface ProjectLite {
  id: string
  address: string
  city: string
  photo?: string
  product: string
  status: 'review' | 'active'
  stage: string
  steps: number
  step: number
  next?: string
  pct?: number
}

export interface Home {
  id: string
  address: string
  city: string
  photo?: string
  project?: ProjectLite
  report?: ReportRow
  listing?: Opportunity
  upside?: number
  valueNow?: number
  product?: string
  at: number // for "recent"
  person?: string // homeowner or seller, when known
  facts?: Opportunity['property']['facts']
  needsYou?: NeedsYouItem
}

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))

interface Stat {
  label: string
  value: string
  tone?: 'green' | 'warn'
}

export interface NeedsYouItem {
  kind: 'project' | 'report' | 'listing'
  pill: string // on the photo: the Revive product, or what the home is
  status: string // top right: why it's here, short
  tone: 'blue' | 'green' | 'purple' | 'warn'
  stats: [Stat, Stat]
  cta: string // the next step, on the gray button
  to: string
  icon: typeof Hammer
}

/** The one thing waiting on the agent for this home: why, two numbers and the next step. */
export function needsYouOf(h: Omit<Home, 'needsYou'>): NeedsYouItem | undefined {
  const who = h.person?.split(' ')[0]
  const upside: Stat = { label: 'With Revive', value: h.upside ? gain(h.upside) : '—', tone: 'green' }
  const p = h.project
  if (p?.next && p.next !== 'Offer terms arrive by email') {
    const photos = /photo/i.test(p.next)
    const pct = p.pct ?? Math.round(((p.step + 0.5) / p.steps) * 100)
    return {
      kind: 'project',
      pill: p.product,
      status: 'Waiting on you',
      tone: 'blue',
      stats: [p.status === 'active' ? { label: 'Construction', value: `${pct}% done` } : { label: 'Project step', value: `${p.step + 1} of ${p.steps}` }, upside],
      cta: p.next.replace(/ before .*$/, ''),
      to: `/property/${h.id}?tab=project`,
      icon: photos ? ImagePlus : Hammer,
    }
  }
  const r = h.report
  if (r?.share?.tone === 'opened' || r?.share?.tone === 'leadform') {
    const opened = r.share.tone === 'opened'
    const f = h.listing?.property.facts ?? h.facts
    const days = opened ? f?.reportOpenedDaysAgo : f?.leadFormDaysAgo
    const when = days === undefined ? '' : days === 0 ? ' today' : ` ${days}d ago`
    return {
      kind: 'report',
      pill: 'AI report',
      status: opened ? `Opened report${when}` : `Ran a report${when}`,
      tone: opened ? 'green' : 'purple',
      stats: [{ label: 'Value today', value: money(r.valueNow) }, upside],
      cta: who ? `Follow up with ${who}` : 'Follow up',
      to: `/property/${h.id}?tab=report`,
      icon: opened ? Eye : Send,
    }
  }
  if (h.listing && !p) {
    const f = h.listing.property.facts
    const stale = (f.daysOnMarket ?? 0) >= 30
    const cut = (f.priceCutDaysAgo ?? 99) <= 7
    if (stale || cut)
      return {
        kind: 'listing',
        pill: 'Your listing',
        status: stale ? `${f.daysOnMarket} days on market` : 'Price cut this week',
        tone: 'warn',
        stats: [{ label: 'List price', value: money(h.listing.property.valueNow) }, upside],
        cta: 'Propose Revive to your seller',
        to: `/property/${h.id}`,
        icon: TrendingDown,
      }
  }
  return undefined
}

/** The project card's progress: a green bar while building, step segments while in review, then the stage. */
function ProjectProgress({ p, upside }: { p: ProjectLite; upside?: number }) {
  const active = p.status === 'active'
  const pct = p.pct ?? Math.round(((p.step + 0.5) / p.steps) * 100)
  return (
    <span className="mt-4 block">
      <span className="flex items-baseline justify-between gap-2 text-[13.5px]">
        <span className="truncate font-medium text-ink">{active ? 'Construction progress' : 'In review with Revive'}</span>
        <span className="shrink-0 text-muted tabular-nums">{active ? `${pct}%` : `${p.step + 1}/${p.steps}`}</span>
      </span>
      {active ? (
        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-label="Construction progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <span className="block h-full rounded-full bg-[var(--green)]" style={{ width: `${pct}%` }} />
        </span>
      ) : (
        <span className="mt-1.5 flex gap-1" role="progressbar" aria-label="Project steps" aria-valuenow={p.step + 1} aria-valuemin={1} aria-valuemax={p.steps}>
          {Array.from({ length: p.steps }, (_, i) => (
            <span key={i} className={cn('h-2 flex-1 rounded-full', i <= p.step ? 'bg-[var(--brand-primary)]' : 'bg-line-soft')} />
          ))}
        </span>
      )}
      <span className="mt-1.5 flex items-baseline justify-between gap-2 text-[12.5px]">
        <span className="truncate text-muted">{p.stage}</span>
        {upside ? <span className="shrink-0 font-semibold text-[var(--green)] tabular-nums">{gain(upside)} with Revive</span> : null}
      </span>
    </span>
  )
}

const STATUS_TONE = { blue: 'text-brand', green: 'text-[var(--green)]', purple: 'text-[var(--brand-agent)]', warn: 'text-warn' } as const

/**
 * Projects with Revive, always on top as property cards with their progress. One waiting on the agent says
 * so in blue and its button turns blue with the next step; the rest read "On track".
 */
export function ProjectCards({ homes, grid = 'xl:grid-cols-2' }: { homes: Home[]; grid?: string }) {
  const sorted = [...homes].sort((a, b) => Number(!!b.needsYou) - Number(!!a.needsYou))
  return (
    <div className={cn('grid gap-4', grid)}>
      {sorted.map((h) => {
        const p = h.project!
        const n = h.needsYou
        const Icon = n?.icon ?? Check
        const to = `/property/${h.id}?tab=project`
        return (
          <Link
            key={h.id}
            to={n?.to ?? to}
            className={cn(
              'group flex overflow-hidden rounded-2xl border bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]',
              n ? 'border-[var(--brand-primary-border)] ring-1 ring-[var(--brand-primary-border)]' : 'border-line',
            )}
          >
            <span className="relative hidden w-[34%] max-w-[220px] shrink-0 overflow-hidden bg-line-soft sm:block">
              {h.photo && <img src={img(h.photo)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
              <span className="absolute top-3 left-3 inline-flex max-w-[calc(100%-24px)] items-center gap-1.5 truncate rounded-full bg-black/55 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
                <Hammer className="size-3.5 shrink-0" /> <span className="truncate">{p.product}</span>
              </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col px-5 py-4">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[17px] font-semibold text-ink">{h.address}</span>
                  <span className="mt-0.5 block truncate text-[14px] text-muted">
                    {h.city}
                    {h.listing && ' · Your listing'}
                  </span>
                </span>
                <span className={cn('mt-1 inline-flex shrink-0 items-center gap-1.5 text-[12.5px] font-medium', n ? 'text-brand' : 'text-[var(--green)]')}>
                  <Icon className="size-3.5" /> {n ? n.status : 'On track'}
                </span>
              </span>
              <ProjectProgress p={p} upside={h.upside} />
              <span
                className={cn(
                  'mt-4 flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-[13.5px] font-medium transition-colors',
                  n ? 'bg-[var(--brand-primary)] text-white group-hover:opacity-90' : 'bg-line-soft text-ink group-hover:bg-[var(--brand-primary-subtle)] group-hover:text-brand',
                )}
              >
                {n ? (
                  <>
                    <Icon className="size-4 shrink-0" /> <span className="truncate">{n.cta}</span>
                  </>
                ) : (
                  <span className="truncate">{p.status === 'active' ? 'View updates' : 'Open project'}</span>
                )}
              </span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function Tags({ h, hide }: { h: Home; hide?: ListKind }) {
  const t = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap'
  return (
    <span className="flex flex-wrap gap-1">
      {h.project && (
        <span className={cn(t, 'bg-[var(--brand-primary)] text-white')}>
          <Hammer className="size-3" /> Project
        </span>
      )}
      {h.report && hide !== 'report' && (
        <span className={cn(t, 'bg-[var(--brand-primary-subtle)] text-brand')}>
          <FileText className="size-3" /> AI report
        </span>
      )}
      {h.listing && hide !== 'listing' && (
        <span className={cn(t, 'bg-line-soft text-ink-2')}>
          <Tag className="size-3" /> Your listing
        </span>
      )}
      {!!h.report?.designs && (
        <span className={cn(t, 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]')}>
          <Sparkles className="size-3" /> RenoVision
        </span>
      )}
    </span>
  )
}

/** A row that needs the agent: why, in the reason's color. */
function NeedsStatus({ n }: { n: NeedsYouItem }) {
  const Icon = n.icon
  return (
    <span className={cn('inline-flex max-w-full items-center gap-1.5 truncate text-[13px] font-semibold', STATUS_TONE[n.tone])}>
      <Icon className="size-3.5 shrink-0" /> <span className="truncate">{n.status}</span>
    </span>
  )
}

const SHARE_TONE = {
  opened: 'bg-ok-soft text-[var(--green)]',
  shared: 'bg-[var(--brand-primary-subtle)] text-brand',
  leadform: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]',
  none: 'bg-line-soft text-ink-2',
} as const

/** Where this home stands: the project's progress, else the report's share status, else the MLS status. */
function Status({ h, kind }: { h: Home; kind?: ListKind }) {
  if (h.project && !kind) {
    const p = h.project
    const pct = p.pct ?? Math.round(((p.step + 0.5) / p.steps) * 100)
    return (
      <span className="block w-full">
        <span className="flex items-baseline justify-between gap-2 text-[12.5px]">
          <span className="truncate font-medium text-ink">{p.status === 'active' ? 'Construction' : 'In review with Revive'}</span>
          <span className="shrink-0 text-muted tabular-nums">{p.status === 'active' ? `${pct}%` : `${p.step + 1}/${p.steps}`}</span>
        </span>
        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line-soft">
          <span className={cn('block h-full rounded-full', p.status === 'active' ? 'bg-[var(--green)]' : 'bg-[var(--brand-primary)]')} style={{ width: `${pct}%` }} />
        </span>
      </span>
    )
  }
  if (h.report && kind !== 'listing') {
    const sh = h.report.share ?? { label: 'Not shared yet', tone: 'none' as const }
    return <span className={cn('inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-[12px] font-semibold', SHARE_TONE[sh.tone])}>{sh.label}</span>
  }
  if (h.listing) {
    const st = listingStatus(h.listing)
    return (
      <span className="block">
        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap', st.warn ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-[var(--green)]')}>{st.label}</span>
        {h.listing.property.facts.daysOnMarket !== undefined && (
          <span className={cn('mt-1 block text-[12px] tabular-nums', h.listing.property.facts.daysOnMarket >= 30 ? 'font-semibold text-warn' : 'text-muted')}>{h.listing.property.facts.daysOnMarket} days listed</span>
        )}
      </span>
    )
  }
  return null
}

function action(h: Home) {
  if (h.needsYou) return { label: h.needsYou.cta.replace(/ to your seller$/, ''), to: h.needsYou.to, primary: true }
  if (h.project) return { label: h.project.status === 'active' ? 'View updates' : 'Open project', to: `/property/${h.id}?tab=project`, primary: false }
  if (h.report && !h.listing) {
    const none = !h.report.share || h.report.share.tone === 'none'
    return { label: none ? 'Share report' : 'Follow up', to: `/property/${h.id}?tab=report`, primary: false } // blue is kept for rows that need you
  }
  return { label: 'See options', to: `/property/${h.id}`, primary: false }
}

export type HomeSort = 'recent' | 'upside'
const SHOW = 5

/** One row per home. */
export type ListKind = 'report' | 'listing'

export function HomesList({ homes, sort, kind }: { homes: Home[]; sort: HomeSort; kind?: ListKind }) {
  const [all, setAll] = useState(false)
  const listing = kind === 'listing'
  const cols = listing ? 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_120px_150px]' : 'lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_150px_170px]'
  // anything waiting on the agent comes first, then the chosen order
  const sorted = [...homes].sort((a, b) => Number(!!b.needsYou) - Number(!!a.needsYou) || (sort === 'upside' ? (b.upside ?? 0) - (a.upside ?? 0) : b.at - a.at))
  const visible = all ? sorted : sorted.slice(0, SHOW)
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className={cn('hidden gap-5 border-b border-line bg-head px-4 py-2 text-[11.5px] font-medium tracking-wide text-muted uppercase lg:grid', cols)}>
        <span>{listing ? 'Listing' : 'Home'}</span>
        <span>{kind === 'report' ? 'With the homeowner' : listing ? 'Status' : 'Where it stands'}</span>
        <span>{listing ? 'Price · with Revive' : 'Revive upside'}</span>
        <span />
      </div>
      <ul>
        {visible.map((h, i) => {
          const a = action(h)
          return (
            <li
              key={h.id}
              className={cn(
                'relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 px-4 py-3',
                cols,
                i > 0 && 'border-t border-line-soft',
                h.needsYou ? 'bg-[var(--brand-primary-subtle)]/60' : 'hover:bg-head/50',
              )}
            >
              {h.needsYou && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--brand-primary)]" aria-hidden="true" />}
              <Link to={a.to} className="flex min-w-0 items-center gap-3">
                <span className="block size-12 shrink-0 overflow-hidden rounded-lg bg-line-soft">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold text-ink hover:text-brand">{h.address}</span>
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-[12.5px] text-muted">{h.city}</span>
                    <Tags h={h} hide={kind} />
                  </span>
                </span>
              </Link>
              <span className="hidden min-w-0 lg:block">
                {h.needsYou && !listing ? <NeedsStatus n={h.needsYou} /> : <Status h={h} kind={kind} />}
              </span>
              {listing ? (
                <span className="hidden lg:block">
                  <span className="block text-[14.5px] font-semibold text-ink tabular-nums">{h.listing ? money(h.listing.property.valueNow) : '—'}</span>
                  <span className="block text-[12.5px] font-semibold text-[var(--green)] tabular-nums">{h.upside ? `${gain(h.upside)} with Revive` : ''}</span>
                </span>
              ) : (
                <span className="hidden lg:block">
                  <span className="block text-[14.5px] font-semibold text-[var(--green)] tabular-nums">{h.upside ? gain(h.upside) : '—'}</span>
                  <span className="block truncate text-[12px] text-muted">{h.product ?? (h.valueNow ? `Value ${money(h.valueNow)}` : '')}</span>
                </span>
              )}
              <Link
                to={a.to}
                className={cn(
                  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium whitespace-nowrap',
                  a.primary ? 'bg-[var(--brand-primary)] text-white hover:opacity-90' : 'border border-line text-ink hover:border-[var(--brand-primary-border)]',
                )}
              >
                {a.label} <ArrowRight className="size-3.5" />
              </Link>
            </li>
          )
        })}
      </ul>
      {homes.length > SHOW && (
        <button onClick={() => setAll((v) => !v)} className="w-full border-t border-line-soft py-2.5 text-[13px] font-medium text-brand hover:bg-head">
          {all ? 'Show fewer' : `Show all ${homes.length}`}
        </button>
      )}
    </div>
  )
}

/**
 * AI reports as a narrow panel for the right column: each report is a compact row (photo, address, where it is
 * with the homeowner, upside). One that needs the agent is highlighted, sorted first, with its next step.
 */
export function ReportsPanel({ homes, sort, onSort, empty }: { homes: Home[]; sort: HomeSort; onSort: (s: HomeSort) => void; empty: React.ReactNode }) {
  const [all, setAll] = useState(false)
  const sorted = [...homes].sort((a, b) => Number(!!b.needsYou) - Number(!!a.needsYou) || (sort === 'upside' ? (b.upside ?? 0) - (a.upside ?? 0) : b.at - a.at))
  const visible = all ? sorted : sorted.slice(0, 6)
  const waiting = homes.filter((h) => h.needsYou).length
  return (
    <section aria-labelledby="reports-title">
      {/* same header as the sections on the left, so the two columns line up */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 id="reports-title" className="text-xl font-semibold text-ink">
            AI reports
          </h2>
          <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{homes.length}</span>
          {waiting > 0 && <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[12px] font-semibold text-white">{waiting} need{waiting === 1 ? 's' : ''} you</span>}
        </div>
        {homes.length > 1 && (
          <button
            onClick={() => onSort(sort === 'recent' ? 'upside' : 'recent')}
            className="rounded-md px-2 py-1 text-[12.5px] font-medium text-muted hover:bg-line-soft hover:text-ink"
            title="Change the order"
          >
            {sort === 'recent' ? 'Recent' : 'Biggest upside'} ▾
          </button>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      {homes.length ? (
        <ul>
          {visible.map((h, i) => {
            const n = h.needsYou
            const sh = h.report?.share ?? { label: 'Not shared yet', tone: 'none' as const }
            const NIcon = n?.icon
            return (
              <li key={h.id} className={cn('relative', i > 0 && 'border-t border-line-soft', n && 'bg-[var(--brand-primary-subtle)]/60')}>
                {n && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--brand-primary)]" aria-hidden="true" />}
                <Link to={n?.to ?? `/property/${h.id}?tab=report`} className="flex items-center gap-3 px-4 py-3 hover:bg-head/50">
                  <span className="block size-12 shrink-0 overflow-hidden rounded-lg bg-line-soft">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14.5px] font-semibold text-ink">{h.address}</span>
                      <span className="shrink-0 text-[13.5px] font-semibold text-[var(--green)] tabular-nums">{h.upside ? gain(h.upside) : '—'}</span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      {n && NIcon ? (
                        <span className={cn('inline-flex min-w-0 items-center gap-1 truncate text-[12.5px] font-semibold', STATUS_TONE[n.tone])}>
                          <NIcon className="size-3.5 shrink-0" /> <span className="truncate">{n.status}</span>
                        </span>
                      ) : (
                        <span className={cn('inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[11.5px] font-semibold', SHARE_TONE[sh.tone])}>{sh.label}</span>
                      )}
                      {!!h.report?.designs && <Sparkles className="size-3.5 shrink-0 text-[var(--brand-agent)]" aria-label="Has RenoVision designs" />}
                    </span>
                    {n && (
                      <span className="mt-2 inline-flex h-7 items-center gap-1 rounded-md bg-[var(--brand-primary)] px-2.5 text-[12px] font-medium text-white">
                        {n.cta} <ArrowRight className="size-3" />
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="p-4">{empty}</div>
      )}
      {homes.length > 6 && (
        <button onClick={() => setAll((v) => !v)} className="w-full border-t border-line-soft py-2.5 text-[13px] font-medium text-brand hover:bg-head">
          {all ? 'Show fewer' : `Show all ${homes.length} reports`}
        </button>
      )}
      </div>
    </section>
  )
}
