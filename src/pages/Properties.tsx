import { Search } from 'lucide-react'
import { useState } from 'react'
import { LicenseForm } from '@/components/home/ConnectBook'
import { CaseStudies } from '@/components/home/NewAgentIntro'
import { ProjectsEmpty, ReportsEmpty } from '@/components/property/HomesEmpty'
import { HomesList, ProjectCards, needsYouOf, type Home, type HomeSort } from '@/components/property/HomesList'
import type { ReportRow } from '@/components/property/homeRows'
import { money } from '@/lib/format'
import { PROJECT_STEPS } from '@/lib/flows'
import { useConnections, useOpportunities } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Every home the agent is working on, once each: Revive projects, homes with a Revive AI report, and the
// agent's own MLS listings. "Needs you" on top pulls out the few with something waiting on the agent;
// below, one list with tabs by kind, each row tagged with what the home is and showing where it stands.


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
  pct?: number // construction progress, when known
}

/** A section of the list: title, count, how many need you, and an optional control on the right. */
function ListSection({ title, homes, right, children }: { title: string; homes: Home[]; right?: React.ReactNode; children: React.ReactNode }) {
  const waiting = homes.filter((h) => h.needsYou).length
  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{homes.length}</span>
          {waiting > 0 && <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[12px] font-semibold text-white">{waiting} need{waiting === 1 ? 's' : ''} you</span>}
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

export default function Properties() {
  const created = useDemo((s) => s.projects)
  const reports = useDemo((s) => s.reports)
  const renovisions = useDemo((s) => s.renovisions)
  const designsOn = (id: string) => Object.values(renovisions).filter((d) => d.propertyId === id).reduce((n, d) => n + d.pairs.length, 0)
  const opps = useOpportunities()
  const outreach = useDemo((s) => s.outreach)
  const activity = useDemo((s) => s.activity)
  const shareOf = (id: string): ReportRow['share'] => {
    const o = opps.find((x) => x.id === id)
    const log = [...(activity[id] ?? []), ...(o?.activity ?? [])].join(' | ')
    const opened = o?.property.facts.reportOpenedDaysAgo
    if (opened !== undefined || /opened the report/i.test(log)) return { label: opened !== undefined ? `Opened ${opened === 0 ? 'today' : `${opened}d ago`}` : 'Opened by homeowner', tone: 'opened' }
    if (outreach[id] || o?.stage === 'shared' || /shared the Revive AI report/i.test(log)) return { label: 'Shared · not opened', tone: 'shared' }
    if (o?.property.source === 'leadform') return { label: 'Ran it on your lead form', tone: 'leadform' }
    return { label: 'Not shared yet', tone: 'none' }
  }
  const conn = useConnections()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<HomeSort>('recent')
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
          pct: pr.status === 'active' ? pr.progressPct : undefined,
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
          at: r.createdAt,
          share: shareOf(r.id),
        }
      }),
    ...opps
      .filter((o) => o.property.reportRun && !reports[o.id] && !inProject.has(o.id))
      .map((o) => ({ id: o.id, address: o.property.address, city: o.property.city, photo: o.property.photo, valueNow: o.property.valueNow, upside: o.gain || undefined, product: o.product, designs: designsOn(o.id), at: Date.now() - (o.property.facts.leadFormDaysAgo ?? o.property.facts.reportOpenedDaysAgo ?? 30) * 86_400_000, share: shareOf(o.id) })),
  ]

  // every home once: a project wins over its report; a listing joins whichever it already is
  const byId = new Map<string, Home>()
  const put = (id: string, base: Omit<Home, 'needsYou'>) => byId.set(id, base)
  for (const p of projects) put(p.id, { id: p.id, address: p.address, city: p.city, photo: p.photo, project: p, product: p.product, upside: opps.find((o) => o.id === p.id)?.gain || undefined, at: Date.now() })
  for (const r of reportRows) put(r.id, { id: r.id, address: r.address, city: r.city, photo: r.photo, report: r, upside: r.upside, valueNow: r.valueNow, product: r.product, at: r.at ?? 0 })
  for (const o of opps.filter((x) => x.property.source === 'listings')) {
    const prev = byId.get(o.id)
    if (prev) byId.set(o.id, { ...prev, listing: o })
    else put(o.id, { id: o.id, address: o.property.address, city: o.property.city, photo: o.property.photo, listing: o, upside: o.gain || undefined, valueNow: o.property.valueNow, product: o.product, at: Date.now() - (o.property.facts.daysOnMarket ?? 0) * 86_400_000 })
  }
  const homes: Home[] = [...byId.values()].map((h) => {
    const o = opps.find((x) => x.id === h.id)
    const full = { ...h, person: o?.person?.name, facts: o?.property.facts }
    return { ...full, needsYou: needsYouOf(full) }
  })
  const shownAll = homes.filter((h) => match(h.address, h.city, h.product))
  const projectHomes = shownAll.filter((h) => h.project)
  const shown = shownAll.filter((h) => !h.project) // projects have their own cards above
  // a home that's both your listing and has a report sits with your listings, tagged AI report
  const listingHomes = shown.filter((h) => h.listing)
  const reportHomes = shown.filter((h) => h.report && !h.listing)
  const firstVisit = !needle && homes.length === 0
  const sortControl = (
    <div className="flex items-center gap-1 text-[12.5px] text-muted">
      Sort by
      {(['recent', 'upside'] as const).map((k) => (
        <button key={k} onClick={() => setSort(k)} aria-pressed={sort === k} className={cn('rounded-md px-2 py-1 font-medium', sort === k ? 'bg-line-soft text-ink' : 'hover:text-ink')}>
          {k === 'recent' ? 'Recent' : 'Biggest upside'}
        </button>
      ))}
    </div>
  )

  const connectMls = (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-line px-5 py-4">
      <div className="min-w-0">
        <p className="text-[14.5px] font-semibold text-ink">Add your listings</p>
        <p className="mt-0.5 text-[13.5px] text-ink-2">Add your DRE license number and Revive pulls your active MLS listings in here, with what Revive could add to each.</p>
      </div>
      <div className="w-full sm:w-auto">
        <LicenseForm inline />
      </div>
    </div>
  )

  return (
    <div className={PAGE}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Homes</h1>
          <p className="mt-1 text-[15px] text-ink-2">Every home you’re working on, with Revive and on your own. Each one has its own page.</p>
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

      {firstVisit ? (
        <>
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <ProjectsEmpty />
            <ReportsEmpty />
          </div>
          {!conn.mls && <div className="mt-6">{connectMls}</div>}
          <div className="mt-12">
            <CaseStudies />
          </div>
        </>
      ) : (
        <>
          <section className="mt-8" aria-labelledby="projects-title">
            <div className="mb-4 flex items-baseline gap-2">
              <h2 id="projects-title" className="text-xl font-semibold text-ink">
                Projects with Revive
              </h2>
              <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{projectHomes.length}</span>
              {projectHomes.some((h) => h.needsYou) && (
                <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[12px] font-semibold text-white">{projectHomes.filter((h) => h.needsYou).length} waiting on you</span>
              )}
            </div>
            {projectHomes.length ? (
              <ProjectCards homes={projectHomes} />
            ) : needle ? (
              noMatch
            ) : (
              <ProjectsEmpty />
            )}
          </section>

          <ListSection title="AI reports" homes={reportHomes} right={reportHomes.length > 1 ? sortControl : undefined}>
            {reportHomes.length ? <HomesList homes={reportHomes} sort={sort} kind="report" /> : needle ? noMatch : <ReportsEmpty />}
          </ListSection>

          <ListSection title="Your listings" homes={listingHomes}>
            {listingHomes.length ? (
              <HomesList homes={listingHomes} sort="recent" kind="listing" />
            ) : needle ? (
              noMatch
            ) : conn.mls ? (
              <p className="rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">No active listings on the MLS right now.</p>
            ) : (
              connectMls
            )}
          </ListSection>
        </>
      )}
    </div>
  )
}
