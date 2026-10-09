import { ArrowRight, Eye, ImagePlus, Mail, MessageSquareDot, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
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
const src = (photo?: string) => (photo ? (photo.startsWith('data:') ? photo : photoUrl(photo)) : undefined)
const who = (city: string, o?: Opportunity) => `${city}${o?.person ? ` · ${o.person.name}` : ''}`

function Photo({ to, photo, badge, tone = 'dark', className }: { to: string; photo?: string; badge: React.ReactNode; tone?: 'dark' | 'brand'; className?: string }) {
  return (
    <Link to={to} tabIndex={-1} aria-hidden="true" className={cn('relative block aspect-video shrink-0 overflow-hidden bg-line-soft', className)}>
      {photo && <img src={src(photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      <span
        className={cn(
          'absolute top-2.5 left-2.5 inline-flex max-w-[calc(100%-20px)] items-center gap-1 truncate rounded-full px-2.5 py-1 text-[11.5px] font-medium backdrop-blur-sm',
          tone === 'brand' ? 'bg-[var(--brand-primary)] text-white' : 'bg-black/50 text-white',
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

function Note({ icon: Icon, children, tone }: { icon: typeof Eye; children: React.ReactNode; tone?: 'brand' }) {
  return (
    <p className="flex min-h-9 items-start gap-2 text-[12.5px] leading-[18px] text-ink-2">
      <Icon className={cn('mt-px size-3.5 shrink-0', tone === 'brand' ? 'text-brand' : 'text-muted')} />
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
        <Mail className="size-3.5" /> Follow up with {o.person.name.split(' ')[0]}
      </button>
      {msg && <MessageDialog o={o} open={msg} onOpenChange={setMsg} />}
    </>
  )
}

/** A report reads as the same card as a project: a Revive-blue badge and outline, value today -> potential, and
 * the homeowner's activity in the same gray strip as Lead activity on Top opportunities. */
function ReportCard({ o, signal }: { o: Opportunity; signal: string }) {
  const to = `/property/${o.id}?tab=report`
  return (
    <article className={cn(CARD, 'border-[var(--brand-primary-border)]')}>
      <Photo to={to} photo={o.property.photo} tone="brand" badge={<><Sparkles className="size-3" /> Revive AI report</>} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Title to={to} title={o.property.address} city={who(o.property.city, o)} />
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="flex min-w-0 items-center gap-1 truncate font-medium text-ink tabular-nums">
            {money(o.property.valueNow)} <ArrowRight className="size-3 shrink-0 text-muted" /> {money(o.property.valueNow + o.gain)}
          </span>
          <span className="shrink-0 font-semibold text-[var(--green)] tabular-nums">{gain(o.gain)}</span>
        </div>
        <p className="flex items-start gap-2 rounded-lg bg-head px-3 py-2 text-[12.5px] leading-[18px] text-ink-2">
          <Eye className="mt-px size-3.5 shrink-0 text-muted" />
          <span className="line-clamp-2">{signal}</span>
        </p>
        <FollowUp o={o} className={cn(ACTION, 'mt-auto')} />
      </div>
    </article>
  )
}

function Cards({ items }: { items: Item[] }) {
  return items.map((it) =>
    it.kind === 'build' ? <BuildCard key={it.id} o={it.o} /> : it.kind === 'review' ? <ReviewCard key={it.id} it={it} /> : <ReportCard key={it.id} o={it.o} signal={it.signal} />,
  )
}

export function ReviveHomes({ items }: { items: Item[] }) {
  if (!items.length) return null
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
        <Link to="/properties" className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-brand hover:underline">
          All homes <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid gap-4 @[400px]:grid-cols-2 @[640px]:grid-cols-3">
        <Cards items={items} />
      </div>
    </section>
  )
}
