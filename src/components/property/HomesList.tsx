import { ArrowRight, Eye, FileText, Hammer, ImagePlus, Send, Sparkles, Tag, TrendingDown } from 'lucide-react'
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
  needsYou?: { text: string; cta: string; to: string; icon: typeof Hammer }
}

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))

/** The one thing waiting on the agent for this home, if any. */
export function needsYouOf(h: Omit<Home, 'needsYou'>): Home['needsYou'] {
  if (h.project?.next && h.project.next !== 'Offer terms arrive by email')
    return { text: h.project.next, cta: /photo/i.test(h.project.next) ? 'Upload photos' : 'Open project', to: `/property/${h.id}?tab=project`, icon: /photo/i.test(h.project.next) ? ImagePlus : Hammer }
  if (h.report?.share?.tone === 'opened') return { text: `${h.report.share.label.replace('Opened', 'Opened your report')}. A good moment to follow up.`, cta: 'Follow up', to: `/property/${h.id}?tab=report`, icon: Eye }
  if (h.report?.share?.tone === 'leadform') return { text: 'Ran a report on your lead form. Reach out while it’s fresh.', cta: 'Follow up', to: `/property/${h.id}?tab=report`, icon: Send }
  if (h.listing && !h.project) {
    const f = h.listing.property.facts
    if ((f.daysOnMarket ?? 0) >= 30 || (f.priceCutDaysAgo ?? 99) <= 7)
      return { text: `${(f.daysOnMarket ?? 0) >= 30 ? `${f.daysOnMarket} days listed` : 'Price cut this week'}. ${h.listing.product ?? 'Revive'} could add ${h.upside ? gain(h.upside) : 'value'}.`, cta: 'Propose Revive', to: `/property/${h.id}`, icon: TrendingDown }
  }
  return undefined
}

/** The "Needs you" strip: up to four homes with something waiting on the agent. */
export function NeedsYou({ homes }: { homes: Home[] }) {
  const items = homes.filter((h) => h.needsYou).slice(0, 4)
  if (!items.length) return null
  return (
    <section className="mt-8" aria-labelledby="needs-you">
      <h2 id="needs-you" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        Needs you
        <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[12px] font-semibold text-white tabular-nums">{items.length}</span>
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((h) => {
          const n = h.needsYou!
          const Icon = n.icon
          return (
            <Link key={h.id} to={n.to} className="group flex flex-col gap-2 rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-subtle)] p-3 transition-colors hover:bg-white">
              <span className="flex items-center gap-2.5">
                <span className="block size-9 shrink-0 overflow-hidden rounded-md bg-line-soft">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{h.address}</span>
                  <span className="block truncate text-[12px] text-muted">{h.city}</span>
                </span>
              </span>
              <span className="line-clamp-2 min-h-9 text-[12.5px] leading-[18px] text-ink-2">{n.text}</span>
              <span className="mt-auto inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand">
                <Icon className="size-3.5" /> {n.cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function Tags({ h }: { h: Home }) {
  const t = 'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap'
  return (
    <span className="flex flex-wrap gap-1">
      {h.project && (
        <span className={cn(t, 'bg-[var(--brand-primary)] text-white')}>
          <Hammer className="size-3" /> Project
        </span>
      )}
      {h.report && (
        <span className={cn(t, 'bg-[var(--brand-primary-subtle)] text-brand')}>
          <FileText className="size-3" /> AI report
        </span>
      )}
      {h.listing && (
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

const SHARE_TONE = {
  opened: 'bg-ok-soft text-[var(--green)]',
  shared: 'bg-[var(--brand-primary-subtle)] text-brand',
  leadform: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]',
  none: 'bg-line-soft text-ink-2',
} as const

/** Where this home stands: the project's progress, else the report's share status, else the MLS status. */
function Status({ h }: { h: Home }) {
  if (h.project) {
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
  if (h.report) {
    const sh = h.report.share ?? { label: 'Not shared yet', tone: 'none' as const }
    return <span className={cn('inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-[12px] font-semibold', SHARE_TONE[sh.tone])}>{sh.label}</span>
  }
  if (h.listing) {
    const st = listingStatus(h.listing)
    const dom = h.listing.property.facts.daysOnMarket
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap', st.warn ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-[var(--green)]')}>{st.label}</span>
        {dom !== undefined && <span className={cn('text-[12px] tabular-nums', dom >= 30 ? 'font-semibold text-warn' : 'text-muted')}>{dom} days</span>}
      </span>
    )
  }
  return null
}

function action(h: Home) {
  if (h.project) return { label: h.project.status === 'active' ? 'View updates' : 'Open project', to: `/property/${h.id}?tab=project`, primary: false }
  if (h.report) {
    const none = !h.report.share || h.report.share.tone === 'none'
    return { label: none ? 'Share report' : 'Follow up', to: `/property/${h.id}?tab=report`, primary: none }
  }
  return { label: 'See options', to: `/property/${h.id}`, primary: false }
}

export type HomeSort = 'recent' | 'upside'
const SHOW = 8

/** One row per home. */
export function HomesList({ homes, sort }: { homes: Home[]; sort: HomeSort }) {
  const [all, setAll] = useState(false)
  const sorted = [...homes].sort((a, b) => (sort === 'upside' ? (b.upside ?? 0) - (a.upside ?? 0) : b.at - a.at))
  const visible = all ? sorted : sorted.slice(0, SHOW)
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_150px_150px] gap-5 border-b border-line bg-head px-4 py-2 text-[11.5px] font-medium tracking-wide text-muted uppercase lg:grid">
        <span>Home</span>
        <span>Where it stands</span>
        <span>Revive upside</span>
        <span />
      </div>
      <ul>
        {visible.map((h, i) => {
          const a = action(h)
          return (
            <li key={h.id} className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 px-4 py-3 hover:bg-head/50 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_150px_150px]', i > 0 && 'border-t border-line-soft')}>
              <Link to={a.to} className="flex min-w-0 items-center gap-3">
                <span className="block size-12 shrink-0 overflow-hidden rounded-lg bg-line-soft">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14.5px] font-semibold text-ink hover:text-brand">{h.address}</span>
                  </span>
                  <span className="mt-0.5 flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-[12.5px] text-muted">{h.city}</span>
                    <Tags h={h} />
                  </span>
                </span>
              </Link>
              <span className="hidden min-w-0 lg:block">
                <Status h={h} />
              </span>
              <span className="hidden lg:block">
                <span className="block text-[14.5px] font-semibold text-[var(--green)] tabular-nums">{h.upside ? gain(h.upside) : '—'}</span>
                <span className="block truncate text-[12px] text-muted">{h.product ?? (h.valueNow ? `Value ${money(h.valueNow)}` : '')}</span>
              </span>
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
          {all ? 'Show fewer' : `Show all ${homes.length} homes`}
        </button>
      )}
    </div>
  )
}
