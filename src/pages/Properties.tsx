import { ArrowRight, Calendar, FileText, Hammer, Search, Sparkles, Tag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiLink } from '@/components/ai/AiLink'
import { LicenseForm } from '@/components/home/ConnectBook'
import { ProjectsEmpty, ReportsEmpty } from '@/components/property/HomesEmpty'
import { Button } from '@/components/ui/button'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { PROJECT_STEPS } from '@/lib/flows'
import { useConnections, useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Every home the agent is working on, in two sections. With Revive: projects and AI reports in one grid,
// told apart by a filter and by the label on each photo (a project is a filled blue "Project" tag with
// its progress; a report is a white "AI report" tag with value and upside). Your listings: the agent's
// active MLS listings, with what Revive could add to each.

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))

interface ProjectRow {
  id: string
  address: string
  city: string
  photo?: string
  product: string
  status: 'review' | 'active'
  stage: string
  steps: number
  step: number // index of the current step
  next?: string
  target?: string
}

interface ReportRow {
  id: string
  address: string
  city: string
  photo?: string
  valueNow: number
  upside?: number
  product?: string
  when?: string
  designs?: number // RenoVision designs saved on this home
}

function ProjectCard({ p }: { p: ProjectRow }) {
  const pct = Math.round(((p.step + (p.status === 'active' ? 0.5 : 0.2)) / p.steps) * 100)
  return (
    <Link
      to={`/property/${p.id}?tab=project`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]"
    >
      <div className="relative h-36 overflow-hidden bg-line-soft">
        {p.photo && <img src={img(p.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <span
          className={cn(
            'absolute top-3 left-3 rounded-full bg-[var(--brand-primary)] px-2.5 py-1 text-[11.5px] font-semibold text-white shadow-sm',
          )}
        >
          <Hammer className="mr-1 inline size-3 -translate-y-px" />
          Project · {p.status === 'active' ? 'In construction' : 'In review'}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="truncate text-[15px] font-semibold text-ink">{p.address}</p>
          <p className="text-[12.5px] text-muted">
            {p.city} · {p.product}
          </p>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2 text-[12px]">
            <span className="truncate font-medium text-ink-2">{p.stage}</span>
            <span className="shrink-0 text-muted tabular-nums">
              Step {p.step + 1} of {p.steps}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
            <div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-[12.5px]">
          <span className="flex min-w-0 items-center gap-1.5 text-ink-2">
            <Calendar className="size-3.5 shrink-0 text-muted" />
            <span className="truncate">{p.next ?? 'Nothing waiting on you'}</span>
          </span>
          {p.target && <span className="shrink-0 font-semibold text-ink tabular-nums">{p.target}</span>}
        </div>
      </div>
    </Link>
  )
}

function ReportCard({ r }: { r: ReportRow }) {
  return (
    <Link
      to={`/property/${r.id}?tab=report`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]"
    >
      <div className="relative h-36 overflow-hidden bg-line-soft">
        {r.photo && <img src={img(r.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-ink shadow-sm">
          <FileText className="size-3 text-brand" /> AI report
        </span>
        {r.designs ? (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-brand shadow-sm">
            <Sparkles className="size-3" /> {r.designs} RenoVision
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="truncate text-[15px] font-semibold text-ink">{r.address}</p>
          <p className="text-[12.5px] text-muted">{r.city}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-head px-3 py-2">
            <dt className="text-[11px] text-muted">Value today</dt>
            <dd className="text-[15px] font-semibold text-ink tabular-nums">{money(r.valueNow)}</dd>
          </div>
          <div className="rounded-lg bg-ok-soft px-3 py-2">
            <dt className="text-[11px] text-muted">Best upside</dt>
            <dd className="text-[15px] font-semibold text-[var(--green)] tabular-nums">{r.upside ? gain(r.upside) : '—'}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-[12.5px]">
          <span className="truncate text-ink-2">{r.product ?? 'No project yet'}</span>
          <span className="flex shrink-0 items-center gap-1 font-medium text-brand">
            View report <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
        {r.when && <p className="-mt-1 text-[11.5px] text-faint">{r.when}</p>}
      </div>
    </Link>
  )
}

/** Where the listing stands on the MLS, for the photo label. */
function listingStatus(o: Opportunity) {
  const f = o.property.facts
  if (f.expiredDaysAgo !== undefined) return { label: `Expired ${f.expiredDaysAgo} days ago`, warn: true }
  if (f.withdrawnDaysAgo !== undefined) return { label: 'Withdrawn', warn: true }
  if (f.priceCutDaysAgo !== undefined && f.priceCutDaysAgo <= 14) return { label: `Price cut ${f.priceCutDaysAgo === 1 ? 'yesterday' : `${f.priceCutDaysAgo} days ago`}`, warn: true }
  if (f.daysOnMarket !== undefined) return { label: `Active · ${f.daysOnMarket} days`, warn: f.daysOnMarket >= 30 }
  return { label: 'Active', warn: false }
}

function ListingCard({ o, revive }: { o: Opportunity; revive?: 'project' | 'report' }) {
  const st = listingStatus(o)
  const p = o.property
  return (
    <Link
      to={`/property/${o.id}${revive === 'project' ? '?tab=project' : ''}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]"
    >
      <div className="relative h-36 overflow-hidden bg-line-soft">
        {p.photo && <img src={img(p.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <span className={cn('absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold shadow-sm', st.warn ? 'bg-warn-soft text-warn' : 'bg-white text-ink')}>
          <Tag className="size-3" /> {st.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="truncate text-[15px] font-semibold text-ink">{p.address}</p>
          <p className="text-[12.5px] text-muted">
            {p.city}
            {p.beds ? ` · ${p.beds} bd · ${p.baths} ba` : ''} · {p.sqft.toLocaleString()} sqft
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-head px-3 py-2">
            <dt className="text-[11px] text-muted">List price</dt>
            <dd className="text-[15px] font-semibold text-ink tabular-nums">{money(p.valueNow)}</dd>
          </div>
          <div className="rounded-lg bg-ok-soft px-3 py-2">
            <dt className="text-[11px] text-muted">With Revive</dt>
            <dd className="text-[15px] font-semibold text-[var(--green)] tabular-nums">{o.gain ? gain(o.gain) : '—'}</dd>
          </div>
        </dl>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-[12.5px]">
          {revive ? (
            <span className="inline-flex items-center gap-1 truncate font-medium text-brand">
              {revive === 'project' ? <Hammer className="size-3.5" /> : <FileText className="size-3.5" />}
              {revive === 'project' ? 'Revive project' : 'Revive AI report'}
            </span>
          ) : (
            <span className="truncate text-ink-2">{o.product ?? 'No Revive fit yet'}</span>
          )}
          <span className="flex shrink-0 items-center gap-1 font-medium text-brand">
            {revive ? 'Open' : 'See options'} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

type Kind = 'all' | 'project' | 'report'

function Section({ title, hint, count, children, empty, emptyNode, filter }: { title: string; hint: string; count: number; children: React.ReactNode; empty?: { text: string; cta: string; to: string }; emptyNode?: React.ReactNode; filter?: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
            <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{count}</span>
          </div>
          <p className="mt-1.5 text-[13px] text-muted">{hint}</p>
        </div>
        {filter}
      </div>
      <div className="mb-5" />
      {count ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{children}</div>
      ) : emptyNode ? (
        emptyNode
      ) : empty ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line px-5 py-4">
          <p className="text-[13.5px] text-ink-2">{empty.text}</p>
          <Button size="sm" variant="outline" asChild>
            <AiLink to={empty.to}>
              <Sparkles /> {empty.cta}
            </AiLink>
          </Button>
        </div>
      ) : null}
    </section>
  )
}

export default function Properties() {
  const created = useDemo((s) => s.projects)
  const reports = useDemo((s) => s.reports)
  const renovisions = useDemo((s) => s.renovisions)
  const designsOn = (id: string) => Object.values(renovisions).filter((d) => d.propertyId === id).reduce((n, d) => n + d.pairs.length, 0)
  const opps = useOpportunities()
  const conn = useConnections()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<Kind>('all')
  const needle = q.trim().toLowerCase()
  const noMatch = <p className="rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">No homes match “{q.trim()}”.</p>
  const match = (...fields: (string | undefined)[]) => !needle || fields.some((f) => f?.toLowerCase().includes(needle))

  const projects: ProjectRow[] = [
    ...Object.values(created).map((p) => ({
      id: p.propertyId,
      address: p.address,
      city: p.city,
      photo: opps.find((o) => o.id === p.propertyId)?.property.photo ?? reports[p.propertyId]?.photos[0],
      product: p.product,
      status: 'review' as const,
      stage: 'Revive review · within 48 hrs',
      steps: PROJECT_STEPS.length,
      step: 1,
      next: 'Offer terms arrive by email',
    })),
    ...opps
      .filter((o) => o.property.project && !created[o.id])
      .map((o) => {
        const pr = o.property.project!
        const step = Math.max(0, pr.timeline.findIndex((t) => t.state === 'current'))
        return {
          id: o.id,
          address: o.property.address,
          city: o.property.city,
          photo: o.property.photo,
          product: pr.product,
          status: pr.status === 'active' ? ('active' as const) : ('review' as const),
          stage: pr.stageLabel,
          steps: pr.timeline.length,
          step,
          next: pr.nextFromAgent,
          target: pr.targetList ? `List ${money(pr.targetList)}` : undefined,
        }
      }),
  ]
  const inProject = new Set(projects.map((p) => p.id))
  const reportRows: ReportRow[] = [
    ...Object.values(reports)
      .filter((r) => !inProject.has(r.id))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => {
        const best = [...r.scenarios].sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))[0]
        return {
          id: r.id,
          address: r.address,
          city: r.city,
          photo: r.photos[0],
          valueNow: r.valueNow,
          upside: best?.gain ?? undefined,
          product: best?.gain ? best.product : undefined,
          when: `Generated ${new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          designs: designsOn(r.id),
        }
      }),
    ...opps
      .filter((o) => o.property.reportRun && !reports[o.id] && !inProject.has(o.id))
      .map((o) => ({ id: o.id, address: o.property.address, city: o.property.city, photo: o.property.photo, valueNow: o.property.valueNow, upside: o.gain || undefined, product: o.product, designs: designsOn(o.id) })),
  ]

  const shownProjects = projects.filter((p) => match(p.address, p.city, p.product))
  const shownReports = reportRows.filter((r) => match(r.address, r.city, r.product))
  const reviveCount = (kind !== 'report' ? shownProjects.length : 0) + (kind !== 'project' ? shownReports.length : 0)
  const reviveEmpty = !needle && projects.length === 0 && reportRows.length === 0
  const listings = opps.filter((o) => o.property.source === 'listings' && match(o.property.address, o.property.city, o.product))
  const reportIds = new Set(reportRows.map((r) => r.id))

  const kinds: { k: Kind; label: string; n: number }[] = [
    { k: 'all', label: 'All', n: shownProjects.length + shownReports.length },
    { k: 'project', label: 'Projects', n: shownProjects.length },
    { k: 'report', label: 'AI reports', n: shownReports.length },
  ]
  const filter = reviveEmpty ? null : (
    <div className="flex gap-2" role="radiogroup" aria-label="Show">
      {kinds.map((f) => {
        const on = kind === f.k
        return (
          <button
            key={f.k}
            role="radio"
            aria-checked={on}
            onClick={() => setKind(f.k)}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-line bg-white text-ink hover:border-[var(--brand-primary-border)]')}
          >
            {f.k === 'project' && <Hammer className="size-3.5" />}
            {f.k === 'report' && <FileText className="size-3.5" />}
            {f.label} <span className={cn('text-[12px] tabular-nums', on ? 'text-white/85' : 'text-muted')}>{f.n}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div className={PAGE}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Homes</h1>
          <p className="mt-1 text-[15px] text-ink-2">Every home you’re working on: with Revive, and your own listings. Each one has its own page.</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search homes"
            aria-label="Search homes"
            className="h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[14px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
          />
        </label>
      </div>

      <Section
        title="With Revive"
        hint="Projects you’re running with Revive, and homes you’ve run a Revive AI report on."
        count={reviveCount}
        filter={filter}
        emptyNode={
          needle ? (
            noMatch
          ) : reviveEmpty ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <ProjectsEmpty />
              <ReportsEmpty />
            </div>
          ) : kind === 'project' ? (
            <ProjectsEmpty />
          ) : (
            <ReportsEmpty />
          )
        }
      >
        {kind !== 'report' && shownProjects.map((p) => <ProjectCard key={p.id} p={p} />)}
        {kind !== 'project' && shownReports.map((r) => <ReportCard key={r.id} r={r} />)}
      </Section>

      <Section
        title="Your listings"
        hint="Your active listings from the MLS, and what Revive could add to each."
        count={listings.length}
        emptyNode={
          needle ? (
            noMatch
          ) : !conn.mls ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-line px-5 py-4">
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold text-ink">See your listings here</p>
                <p className="mt-0.5 text-[13.5px] text-ink-2">Add your DRE license number and Revive pulls your active listings from the MLS.</p>
              </div>
              <div className="w-full sm:w-auto">
                <LicenseForm inline />
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">No active listings on the MLS right now.</p>
          )
        }
      >
        {listings.map((o) => (
          <ListingCard key={o.id} o={o} revive={inProject.has(o.id) ? 'project' : reportIds.has(o.id) ? 'report' : undefined} />
        ))}
      </Section>
    </div>
  )
}
