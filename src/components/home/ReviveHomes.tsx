import { ArrowRight, Eye, ImagePlus, MapPin, MessageSquareDot, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { leadSignal } from '@/components/home/TopOpportunities'
import { MessageDialog } from '@/components/opportunity/MessageDialog'
import { Progress } from '@/components/ui/progress'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { PROJECT_STEPS } from '@/lib/flows'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Dashboard (Active, Partner): the homes already moving with Revive, as photo cards: projects in
// construction, projects still in review with Revive, and Revive AI reports a homeowner is reading.
// Top opportunities below is who to reach out to next; a home shown here is left out of it.

type Item =
  | { kind: 'build'; id: string; o: Opportunity }
  | { kind: 'review'; id: string; address: string; city: string; photo?: string; product: string; step: number; steps: number; label: string; next: string; o?: Opportunity }
  | { kind: 'report'; id: string; o: Opportunity; signal: string }

/** What this section shows, so the dashboard can leave these homes out of Top opportunities. */
export function useReviveHomes(opps: Opportunity[]): Item[] {
  const created = useDemo((s) => s.projects)
  const reports = useDemo((s) => s.reports)
  const activity = useDemo((s) => s.activity)
  const items: Item[] = []
  for (const o of opps) {
    const pr = o.property.project
    if (pr?.status === 'active') items.push({ kind: 'build', id: o.id, o })
    else if (pr && !created[o.id]) {
      const step = Math.max(0, pr.timeline.findIndex((t) => t.state === 'current'))
      items.push({ kind: 'review', id: o.id, address: o.property.address, city: o.property.city, photo: o.property.photo, product: pr.product, step, steps: pr.timeline.length, label: pr.timeline[step]?.label ?? 'Revive review', next: pr.nextFromAgent ?? 'Revive reviews within 48 hrs', o })
    }
  }
  for (const p of Object.values(created))
    items.push({
      kind: 'review',
      id: p.propertyId,
      address: p.address,
      city: p.city,
      photo: opps.find((o) => o.id === p.propertyId)?.property.photo ?? reports[p.propertyId]?.photos[0],
      product: p.product,
      step: 1,
      steps: PROJECT_STEPS.length,
      label: 'Revive review',
      next: 'Revive reviews it within 48 hrs, offer terms arrive by email',
      o: opps.find((o) => o.id === p.propertyId),
    })
  const shown = new Set(items.map((i) => i.id))
  for (const o of opps) {
    if (shown.has(o.id) || !o.property.reportRun) continue
    const signal = leadSignal(o, activity[o.id])
    if (signal) items.push({ kind: 'report', id: o.id, o, signal })
  }
  // construction first, then projects in review, then reports
  const order = { build: 0, review: 1, report: 2 }
  return items.sort((a, b) => order[a.kind] - order[b.kind])
}

const ACTION = 'flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-line-soft text-[12.5px] font-medium text-ink transition-colors hover:bg-line'
const AI_ACTION = 'flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-agent-subtle)] text-[12.5px] font-medium text-[var(--brand-agent)] transition-colors hover:bg-[var(--brand-agent-border-subtle)]'
const src = (photo?: string) => (photo ? (photo.startsWith('data:') ? photo : photoUrl(photo)) : undefined)
const who = (city: string, o?: Opportunity) => `${city}${o?.person ? ` · ${o.person.name}` : ''}`

/** Three treatments for report cards next to project cards, to compare (?cards=a|b|c). */
export type CardDesign = 'a' | 'b' | 'c'

function Photo({ to, photo, badge, tone = 'dark', className }: { to: string; photo?: string; badge: React.ReactNode; tone?: 'dark' | 'ai'; className?: string }) {
  return (
    <Link to={to} tabIndex={-1} aria-hidden="true" className={cn('relative block h-28 shrink-0 overflow-hidden bg-line-soft', className)}>
      {photo && <img src={src(photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      <span
        className={cn(
          'absolute top-2.5 left-2.5 inline-flex max-w-[calc(100%-20px)] items-center gap-1 truncate rounded-full px-2.5 py-1 text-[11.5px] font-medium backdrop-blur-sm',
          tone === 'ai' ? 'bg-[var(--brand-agent)]/85 text-white' : 'bg-black/50 text-white',
        )}
      >
        {badge}
      </span>
    </Link>
  )
}

function Title({ to, title, city }: { to: string; title: string; city: string }) {
  return (
    <div className="min-w-0">
      <Link to={to} className="block truncate text-[15px] font-semibold text-ink hover:text-brand">
        {title}
      </Link>
      <p className="truncate text-[12.5px] text-muted">{city}</p>
    </div>
  )
}

function Note({ icon: Icon, children, tone }: { icon: typeof Eye; children: React.ReactNode; tone?: 'brand' | 'ai' }) {
  return (
    <p className="flex items-start gap-2 text-[12.5px] leading-[18px] text-ink-2">
      <Icon className={cn('mt-px size-3.5 shrink-0', tone === 'brand' ? 'text-brand' : tone === 'ai' ? 'text-[var(--brand-agent)]' : 'text-muted')} />
      <span className="line-clamp-2">{children}</span>
    </p>
  )
}

const CARD = 'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card'

function BuildCard({ o }: { o: Opportunity }) {
  const pr = o.property.project!
  const to = `/property/${o.id}?tab=project`
  return (
    <article className={cn(CARD, 'border-line')}>
      <Photo to={to} photo={o.property.photo} badge={pr.product} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Title to={to} title={o.property.address} city={who(o.property.city, o)} />
        <div>
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="truncate font-medium text-ink">Construction</span>
            <span className="shrink-0 text-muted tabular-nums">{pr.progressPct}%</span>
          </div>
          <Progress value={pr.progressPct} label="Construction progress" className="mt-1.5" barClassName="bg-ok" />
        </div>
        {pr.nextFromAgent && (
          <Note icon={MessageSquareDot} tone="brand">
            <span className="font-medium text-ink">Next:</span> {pr.nextFromAgent}
          </Note>
        )}
        <Link to={to} className={cn(ACTION, 'mt-auto')}>
          Review selections
        </Link>
      </div>
    </article>
  )
}

function ReviewCard({ it }: { it: Extract<Item, { kind: 'review' }> }) {
  const to = `/property/${it.id}?tab=project`
  const photos = /photo/i.test(it.next)
  return (
    <article className={cn(CARD, 'border-line')}>
      <Photo to={to} photo={it.photo} badge={it.product} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Title to={to} title={it.address} city={who(it.city, it.o)} />
        <div>
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="truncate font-medium text-ink">In review</span>
            <span className="shrink-0 text-muted tabular-nums">
              {it.step + 1}/{it.steps}
            </span>
          </div>
          <div className="mt-1.5 flex gap-1" role="progressbar" aria-label="Project steps" aria-valuenow={it.step + 1} aria-valuemin={1} aria-valuemax={it.steps}>
            {Array.from({ length: it.steps }, (_, i) => (
              <span key={i} className={cn('h-2 flex-1 rounded-full', i <= it.step ? 'bg-[var(--brand-primary)]' : 'bg-line-soft')} />
            ))}
          </div>
        </div>
        <Note icon={photos ? ImagePlus : MessageSquareDot} tone="brand">
          {it.next}
        </Note>
        {photos ? (
          <button type="button" className={cn(ACTION, 'mt-auto')} onClick={() => toast.success('Photos added', { description: `Revive will have them before the site visit at ${it.address}.` })}>
            <ImagePlus className="size-3.5" /> Upload photos
          </button>
        ) : (
          <Link to={to} className={cn(ACTION, 'mt-auto')}>
            Open project
          </Link>
        )}
      </div>
    </article>
  )
}

function FollowUp({ o, className }: { o: Opportunity; className: string }) {
  const [msg, setMsg] = useState(false)
  if (!o.person)
    return (
      <Link to={`/property/${o.id}?tab=report`} className={className}>
        View report
      </Link>
    )
  return (
    <>
      <button type="button" className={className} onClick={() => setMsg(true)}>
        Follow up with {o.person.name.split(' ')[0]}
      </button>
      {msg && <MessageDialog o={o} open={msg} onOpenChange={setMsg} />}
    </>
  )
}

/** A: the same card as a project, in Revive AI purple: purple badge and outline, value tiles instead of progress. */
function ReportA({ o, signal }: { o: Opportunity; signal: string }) {
  const to = `/property/${o.id}?tab=report`
  return (
    <article className={cn(CARD, 'border-[var(--brand-agent-border)]')}>
      <Photo to={to} photo={o.property.photo} tone="ai" badge={<><Sparkles className="size-3" /> Revive AI report</>} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Title to={to} title={o.property.address} city={who(o.property.city, o)} />
        <dl className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-head px-2.5 py-1.5">
            <dt className="text-[11px] text-muted">Today</dt>
            <dd className="text-[14px] font-semibold text-ink tabular-nums">{money(o.property.valueNow)}</dd>
          </div>
          <div className="rounded-lg bg-ok-soft px-2.5 py-1.5">
            <dt className="text-[11px] text-muted">Upside</dt>
            <dd className="text-[14px] font-semibold text-[var(--green)] tabular-nums">{gain(o.gain)}</dd>
          </div>
        </dl>
        <Note icon={Eye} tone="ai">
          {signal}
        </Note>
        <FollowUp o={o} className={cn(AI_ACTION, 'mt-auto')} />
      </div>
    </article>
  )
}

/** B: no photo; the report's own cover: a purple panel with the value today and after, like the report's first page. */
function ReportB({ o, signal }: { o: Opportunity; signal: string }) {
  const to = `/property/${o.id}?tab=report`
  const after = o.property.valueNow + o.gain
  const pct = Math.round((o.property.valueNow / after) * 100)
  return (
    <article className={cn(CARD, 'border-[var(--brand-agent-border-subtle)]')}>
      <Link to={to} className="flex h-28 shrink-0 flex-col justify-between bg-[radial-gradient(120%_120%_at_100%_0%,var(--brand-agent-border-subtle)_0%,var(--brand-agent-subtle)_45%,#fff_100%)] p-3.5">
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--brand-agent)]">
          <Sparkles className="size-3.5" /> Revive AI report
        </span>
        <div>
          <p className="flex items-baseline gap-1.5 text-[13px] text-ink-2 tabular-nums">
            {money(o.property.valueNow)} <ArrowRight className="size-3 self-center text-muted" />
            <span className="text-[17px] font-semibold text-ink">{money(after)}</span>
          </p>
          <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-white">
            <span className="bg-[var(--brand-agent)]/40" style={{ width: `${pct}%` }} />
            <span className="flex-1 bg-[var(--green)]" />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-[var(--green)]">{gain(o.gain)} upside</p>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Title to={to} title={o.property.address} city={who(o.property.city, o)} />
        <Note icon={Eye} tone="ai">
          {signal}
        </Note>
        <FollowUp o={o} className={cn(AI_ACTION, 'mt-auto')} />
      </div>
    </article>
  )
}

/** C: the Figma report card: photo, address with a pin, a rule, then current and potential value with grade badges. */
function ReportC({ o, signal }: { o: Opportunity; signal: string }) {
  const to = `/property/${o.id}?tab=report`
  return (
    <article className={cn(CARD, 'border-line')}>
      <Photo to={to} photo={o.property.photo} badge={<><Sparkles className="size-3" /> Revive AI report</>} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Link to={to} className="block truncate text-[15px] font-semibold text-ink hover:text-brand">
            {o.property.address}
          </Link>
          <p className="flex items-center gap-1 truncate text-[12.5px] text-muted">
            <MapPin className="size-3.5 shrink-0 text-brand" /> {who(o.property.city, o)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3">
          <div className="min-w-0">
            <dt className="text-[11px] text-muted">Current value</dt>
            <dd className="flex flex-wrap items-center gap-1 text-[14px] font-semibold text-ink tabular-nums">
              {money(o.property.valueNow)} <span className="rounded bg-[#fbbf24] px-1.5 py-px text-[10.5px] font-semibold text-white">Good</span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] text-muted">Potential value</dt>
            <dd className="flex flex-wrap items-center gap-1 text-[14px] font-semibold text-ink tabular-nums">
              {money(o.property.valueNow + o.gain)} <span className="rounded bg-[#00a18c] px-1.5 py-px text-[10.5px] font-semibold text-white">Excellent</span>
            </dd>
          </div>
        </dl>
        <Note icon={Eye} tone="brand">
          {signal}
        </Note>
        <FollowUp o={o} className={cn(ACTION, 'mt-auto')} />
      </div>
    </article>
  )
}

function Cards({ items, design }: { items: Item[]; design: CardDesign }) {
  const Report = design === 'a' ? ReportA : design === 'b' ? ReportB : ReportC
  return items.map((it) =>
    it.kind === 'build' ? <BuildCard key={it.id} o={it.o} /> : it.kind === 'review' ? <ReviewCard key={it.id} it={it} /> : <Report key={it.id} o={it.o} signal={it.signal} />,
  )
}

const GROUP_LABEL = 'mb-2 flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-muted uppercase'

export function ReviveHomes({ items }: { items: Item[] }) {
  const [params, setParams] = useSearchParams()
  const design = (['a', 'b', 'c'].includes(params.get('cards') ?? '') ? params.get('cards') : 'a') as CardDesign
  if (!items.length) return null
  const projects = items.filter((i) => i.kind !== 'report')
  const reports = items.filter((i) => i.kind === 'report')
  return (
    <section aria-labelledby="revive-homes" className="@container">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="revive-homes" className="flex items-center gap-2.5 text-xl font-semibold text-ink">
            Your homes with Revive
            <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{items.length}</span>
          </h2>
          <p className="mt-1 text-[13px] text-muted">Projects underway and reports homeowners are reading.</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {/* prototype only: compare the three report-card treatments */}
          <div className="flex rounded-lg bg-line-soft p-0.5 text-[12px]" role="radiogroup" aria-label="Card design">
            {(['a', 'b', 'c'] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={design === d}
                onClick={() => {
                  const next = new URLSearchParams(params)
                  next.set('cards', d)
                  setParams(next, { replace: true })
                }}
                className={cn('rounded-md px-2.5 py-1 font-medium', design === d ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
              >
                Design {d.toUpperCase()}
              </button>
            ))}
          </div>
          <Link to="/properties" className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-brand hover:underline">
            All homes <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      {design === 'c' && reports.length && projects.length ? (
        // C: two labelled groups side by side, reports on a soft purple panel
        <div className="grid gap-4 @[640px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <p className={cn(GROUP_LABEL, 'pt-2.5')}>Projects · {projects.length}</p>
            <div className="grid gap-4 @[400px]:grid-cols-2">
              <Cards items={projects} design={design} />
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--brand-agent-subtle)]/60 p-2.5">
            <p className={cn(GROUP_LABEL, 'text-[var(--brand-agent)]')}>
              <Sparkles className="size-3.5" /> Revive AI reports · {reports.length}
            </p>
            <div className="grid gap-4">
              <Cards items={reports} design={design} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 @[400px]:grid-cols-2 @[640px]:grid-cols-3">
          <Cards items={items} design={design} />
        </div>
      )}
    </section>
  )
}
