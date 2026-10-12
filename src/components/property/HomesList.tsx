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
  kind: 'project' | 'report' | 'listing' // what the home is, for the type badge
  reason: string // short eyebrow: why it's here
  tone: 'blue' | 'green' | 'purple' | 'warn'
  title: string
  detail: string
  stats: Stat[]
  cta: string
  to: string
  icon: typeof Hammer
}

/** The one thing waiting on the agent for this home, with the context to act on it. */
export function needsYouOf(h: Omit<Home, 'needsYou'>): NeedsYouItem | undefined {
  const who = h.person?.split(' ')[0] ?? 'The homeowner'
  const upside: Stat = { label: 'Revive upside', value: h.upside ? gain(h.upside) : '—', tone: 'green' }
  const p = h.project
  if (p?.next && p.next !== 'Offer terms arrive by email') {
    const photos = /photo/i.test(p.next)
    const pct = p.pct ?? Math.round(((p.step + 0.5) / p.steps) * 100)
    return {
      kind: 'project',
      reason: 'Waiting on you',
      tone: 'blue',
      title: p.next,
      detail: `${p.stage}. ${photos ? 'Photos help Revive scope the work before the visit.' : 'Revive can’t move to the next step until you do.'}`,
      stats: [{ label: p.status === 'active' ? 'Construction' : 'Project step', value: p.status === 'active' ? `${pct}% done` : `${p.step + 1} of ${p.steps}` }, h.valueNow || h.listing ? { label: 'Value today', value: money(h.valueNow ?? h.listing!.property.valueNow) } : { label: 'Steps left', value: String(p.steps - p.step - 1) }, upside],
      cta: photos ? 'Upload photos' : 'Open project',
      to: `/property/${h.id}?tab=project`,
      icon: photos ? ImagePlus : Hammer,
    }
  }
  const r = h.report
  if (r?.share?.tone === 'opened' || r?.share?.tone === 'leadform') {
    const opened = r.share.tone === 'opened'
    const f = h.listing?.property.facts ?? h.facts
    return {
      kind: 'report',
      reason: opened ? 'Homeowner engaged' : 'New lead from your form',
      tone: opened ? 'green' : 'purple',
      title: opened ? `${who} opened your report${f?.reportOpenedDaysAgo !== undefined ? ` ${f.reportOpenedDaysAgo === 0 ? 'today' : `${f.reportOpenedDaysAgo} days ago`}` : ''}` : `${who} ran a report on your lead form`,
      detail: opened
        ? `They looked at what ${h.address} could sell for after ${r.product ?? 'a Revive project'}. A good moment to follow up.`
        : `${f?.leadFormDaysAgo !== undefined ? `${f.leadFormDaysAgo} days ago. ` : ''}Best fit is ${r.product ?? 'a Revive project'}. Reach out while it’s fresh.`,
      stats: [{ label: 'Value today', value: money(r.valueNow) }, upside, { label: 'Lift', value: r.upside ? `+${Math.round((r.upside / r.valueNow) * 100)}%` : '—', tone: 'green' }],
      cta: 'Follow up',
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
        reason: 'Your listing is going stale',
        tone: 'warn',
        title: stale ? `${f.daysOnMarket} days on market${cut ? ', price cut' : ''}` : `Price cut ${f.priceCutDaysAgo === 1 ? 'yesterday' : `${f.priceCutDaysAgo} days ago`}`,
        detail: `${h.listing.product ?? 'A Revive project'} could add ${h.upside ? gain(h.upside) : 'value'} before it sells, paid at closing. Bring it to your seller.`,
        stats: [{ label: 'List price', value: money(h.listing.property.valueNow) }, { label: 'Days listed', value: String(f.daysOnMarket ?? '—'), tone: stale ? 'warn' : undefined }, upside],
        cta: 'Propose Revive',
        to: `/property/${h.id}`,
        icon: TrendingDown,
      }
  }
  return undefined
}

const KIND = {
  project: { label: 'Revive project', icon: Hammer, cls: 'bg-[var(--brand-primary)] text-white' },
  report: { label: 'AI report', icon: FileText, cls: 'bg-white text-brand' },
  listing: { label: 'Your listing', icon: Tag, cls: 'bg-white text-ink' },
} as const

/** What the home is, pinned to the photo's corner: the same three kinds as the list's tags and tabs. */
function KindBadge({ kind }: { kind: NeedsYouItem['kind'] }) {
  const k = KIND[kind]
  const Icon = k.icon
  return (
    <span className={cn('absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-semibold shadow-sm', k.cls)}>
      <Icon className="size-3.5" /> {k.label}
    </span>
  )
}

const TONE = {
  blue: { chip: 'bg-[var(--brand-primary-subtle)] text-brand' },
  green: { chip: 'bg-ok-soft text-[var(--green)]' },
  purple: { chip: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]' },
  warn: { chip: 'bg-warn-soft text-warn' },
} as const

/** The "Needs you" cards: up to four homes with something waiting on the agent, each with the why and the numbers. */
export function NeedsYou({ homes }: { homes: Home[] }) {
  const items = homes.filter((h) => h.needsYou).slice(0, 4)
  if (!items.length) return null
  return (
    <section className="mt-8" aria-labelledby="needs-you">
      <div className="flex items-baseline gap-2">
        <h2 id="needs-you" className="text-xl font-semibold text-ink">
          Needs you
        </h2>
        <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[12px] font-semibold text-white tabular-nums">{items.length}</span>
      </div>
      <p className="mt-1 text-[13px] text-muted">The homes where your next move matters most this week.</p>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {items.map((h) => {
          const n = h.needsYou!
          const Icon = n.icon
          const t = TONE[n.tone]
          return (
            <article key={h.id} className="group relative flex overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]">
              <Link to={n.to} tabIndex={-1} aria-hidden="true" className="relative hidden w-44 shrink-0 overflow-hidden bg-line-soft sm:block">
                {h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                <KindBadge kind={n.kind} />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-2.5 text-white">
                  <span className="block truncate text-[13.5px] font-semibold">{h.address}</span>
                  <span className="block truncate text-[11.5px] text-white/80">{h.city}</span>
                </span>
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold whitespace-nowrap', t.chip)}>
                    <Icon className="size-3.5" /> {n.reason}
                  </span>
                  <Link to={`/property/${h.id}`} className="truncate text-[12.5px] text-muted hover:text-brand sm:hidden">
                    {h.address}
                  </Link>
                </div>
                <div>
                  <p className="text-[16px] leading-6 font-semibold text-ink">{n.title}</p>
                  <p className="mt-1 text-[13px] leading-5 text-ink-2">{n.detail}</p>
                </div>
                <dl className="grid grid-cols-3 gap-2">
                  {n.stats.map((st) => (
                    <div key={st.label} className="min-w-0 rounded-lg bg-head px-2.5 py-1.5">
                      <dt className="truncate text-[11px] text-muted">{st.label}</dt>
                      <dd className={cn('truncate text-[13.5px] font-semibold tabular-nums', st.tone === 'green' ? 'text-[var(--green)]' : st.tone === 'warn' ? 'text-warn' : 'text-ink')}>{st.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-auto flex items-center gap-2">
                  <Link to={n.to} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3.5 text-[13px] font-medium text-white hover:opacity-90">
                    <Icon className="size-4" /> {n.cta}
                  </Link>
                  <Link to={`/property/${h.id}`} className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] font-medium text-ink-2 hover:bg-line-soft">
                    Open home <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </article>
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
