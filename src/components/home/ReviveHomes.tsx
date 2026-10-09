import { ArrowRight, Eye, FileText, ImagePlus, MessageSquareDot } from 'lucide-react'
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

function Shell({ to, photo, badge, title, city, children }: { to: string; photo?: string; badge: React.ReactNode; title: string; city: string; children: React.ReactNode }) {
  return (
    <article className="group flex overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <Link to={to} tabIndex={-1} aria-hidden="true" className="relative w-32 shrink-0 overflow-hidden bg-line-soft sm:w-44">
        {photo && <img src={photo.startsWith('data:') ? photo : photoUrl(photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <span className="absolute top-2.5 left-2.5 inline-flex max-w-[calc(100%-20px)] items-center gap-1 truncate rounded-full bg-black/50 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">{badge}</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Link to={to} className="block truncate text-[15px] font-semibold text-ink hover:text-brand">
            {title}
          </Link>
          <p className="truncate text-[13px] text-muted">{city}</p>
        </div>
        {children}
      </div>
    </article>
  )
}

function Note({ icon: Icon, children, tone }: { icon: typeof Eye; children: React.ReactNode; tone?: 'brand' }) {
  return (
    <p className="flex items-start gap-2 text-[12.5px] leading-[18px] text-ink-2">
      <Icon className={cn('mt-px size-3.5 shrink-0', tone === 'brand' ? 'text-brand' : 'text-muted')} />
      <span className="line-clamp-2">{children}</span>
    </p>
  )
}

function BuildCard({ o }: { o: Opportunity }) {
  const pr = o.property.project!
  const to = `/property/${o.id}?tab=project`
  return (
    <Shell to={to} photo={o.property.photo} badge={pr.product} title={o.property.address} city={`${o.property.city}${o.person ? ` · ${o.person.name}` : ''}`}>
      <div>
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="font-medium text-ink">Construction progress</span>
          <span className="text-muted tabular-nums">{pr.progressPct}%</span>
        </div>
        <Progress value={pr.progressPct} label="Construction progress" className="mt-1.5" barClassName="bg-ok" />
        <p className="mt-1.5 text-[12px] text-muted">{pr.stageLabel} · on schedule</p>
      </div>
      {pr.nextFromAgent && (
        <Note icon={MessageSquareDot} tone="brand">
          <span className="font-medium text-ink">Next from you:</span> {pr.nextFromAgent}
        </Note>
      )}
      <Link to={to} className={cn(ACTION, 'mt-auto')}>
        Review selections
      </Link>
    </Shell>
  )
}

function ReviewCard({ it }: { it: Extract<Item, { kind: 'review' }> }) {
  const to = `/property/${it.id}?tab=project`
  return (
    <Shell to={to} photo={it.photo} badge={it.product} title={it.address} city={`${it.city}${it.o?.person ? ` · ${it.o.person.name}` : ''}`}>
      <div>
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="font-medium text-ink">In review with Revive</span>
          <span className="shrink-0 text-muted tabular-nums">
            Step {it.step + 1} of {it.steps}
          </span>
        </div>
        <div className="mt-1.5 flex gap-1" role="progressbar" aria-label="Project steps" aria-valuenow={it.step + 1} aria-valuemin={1} aria-valuemax={it.steps}>
          {Array.from({ length: it.steps }, (_, i) => (
            <span key={i} className={cn('h-2 flex-1 rounded-full', i <= it.step ? 'bg-[var(--brand-primary)]' : 'bg-line-soft')} />
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-muted">{it.label}</p>
      </div>
      <Note icon={/photo/i.test(it.next) ? ImagePlus : MessageSquareDot} tone="brand">
        {it.next}
      </Note>
      {/photo/i.test(it.next) ? (
        <button type="button" className={cn(ACTION, 'mt-auto')} onClick={() => toast.success('Photos added', { description: `Revive will have them before the site visit at ${it.address}.` })}>
          <ImagePlus className="size-3.5" /> Upload home photos
        </button>
      ) : (
        <Link to={to} className={cn(ACTION, 'mt-auto')}>
          Open project
        </Link>
      )}
    </Shell>
  )
}

function ReportCard({ o, signal }: { o: Opportunity; signal: string }) {
  const [msg, setMsg] = useState(false)
  const first = o.person?.name.split(' ')[0]
  return (
    <Shell
      to={`/property/${o.id}?tab=report`}
      photo={o.property.photo}
      badge={
        <>
          <FileText className="size-3" /> Revive AI report
        </>
      }
      title={o.property.address}
      city={`${o.property.city}${o.person ? ` · ${o.person.name}` : ''}`}
    >
      <dl className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 min-[480px]:gap-3">
        <div>
          <dt className="text-[12px] text-muted">Value today</dt>
          <dd className="text-[15px] font-semibold text-ink tabular-nums">{money(o.property.valueNow)}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-muted">Potential value</dt>
          <dd className="text-[15px] font-semibold text-ink tabular-nums">
            {money(o.property.valueNow + o.gain)} {o.gain > 0 && <span className="text-[12px] font-semibold text-[var(--green)]">{gain(o.gain)}</span>}
          </dd>
        </div>
      </dl>
      <Note icon={Eye} tone="brand">
        {signal}
      </Note>
      {o.person ? (
        <button type="button" className={cn(ACTION, 'mt-auto')} onClick={() => setMsg(true)}>
          Follow up with {first}
        </button>
      ) : (
        <Link to={`/property/${o.id}?tab=report`} className={cn(ACTION, 'mt-auto')}>
          View report
        </Link>
      )}
      {o.person && msg && <MessageDialog o={o} open={msg} onOpenChange={setMsg} />}
    </Shell>
  )
}

export function ReviveHomes({ items }: { items: Item[] }) {
  if (!items.length) return null
  return (
    <section aria-labelledby="revive-homes">
      <div className="mb-4 flex items-end justify-between gap-3">
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
      <div className="grid gap-4 2xl:grid-cols-2">
        {items.map((it) =>
          it.kind === 'build' ? <BuildCard key={it.id} o={it.o} /> : it.kind === 'review' ? <ReviewCard key={it.id} it={it} /> : <ReportCard key={it.id} o={it.o} signal={it.signal} />,
        )}
      </div>
    </section>
  )
}
