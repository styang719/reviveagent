import { FileText, Hammer, Search, Tag } from 'lucide-react'
import { useState } from 'react'
import { LicenseForm } from '@/components/home/ConnectBook'
import { CaseStudies } from '@/components/home/NewAgentIntro'
import { ProjectsEmpty, ReportsEmpty } from '@/components/property/HomesEmpty'
import { HomesList, NeedsYou, needsYouOf, type Home, type HomeSort } from '@/components/property/HomesList'
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

type Tab = 'all' | 'project' | 'report' | 'listing'

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
  const [tab, setTab] = useState<Tab>('all')
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
  const homes: Home[] = [...byId.values()].map((h) => ({ ...h, needsYou: needsYouOf(h) }))
  const shown = homes.filter((h) => match(h.address, h.city, h.product))
  const inTab = (h: Home) => tab === 'all' || (tab === 'project' && !!h.project) || (tab === 'report' && !!h.report) || (tab === 'listing' && !!h.listing)
  const rows = shown.filter(inTab)
  const firstVisit = !needle && homes.length === 0

  const tabs: { k: Tab; label: string; icon?: typeof Hammer }[] = [
    { k: 'all', label: 'All homes' },
    { k: 'project', label: 'Projects', icon: Hammer },
    { k: 'report', label: 'AI reports', icon: FileText },
    { k: 'listing', label: 'Your listings', icon: Tag },
  ]
  const count = (k: Tab) => shown.filter((h) => k === 'all' || (k === 'project' ? !!h.project : k === 'report' ? !!h.report : !!h.listing)).length

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
          {!needle && <NeedsYou homes={homes} />}

          <div className="mt-8 flex flex-wrap items-end justify-between gap-3 border-b border-line">
            <div role="tablist" aria-label="Homes" className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]">
              {tabs.map((t) => {
                const Icon = t.icon
                const on = tab === t.k
                return (
                  <button
                    key={t.k}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(t.k)}
                    className={cn('inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[14px] font-medium whitespace-nowrap', on ? 'border-[var(--brand-primary)] text-ink' : 'border-transparent text-muted hover:text-ink')}
                  >
                    {Icon && <Icon className="size-3.5" />}
                    {t.label}
                    <span className={cn('rounded-full px-1.5 text-[12px] tabular-nums', on ? 'bg-[var(--brand-primary-subtle)] text-brand' : 'bg-line-soft text-muted')}>{count(t.k)}</span>
                  </button>
                )
              })}
            </div>
            <div className="mb-1.5 flex items-center gap-1 text-[12.5px] text-muted">
              Sort by
              {(['recent', 'upside'] as const).map((k) => (
                <button key={k} onClick={() => setSort(k)} aria-pressed={sort === k} className={cn('rounded-md px-2 py-1 font-medium', sort === k ? 'bg-line-soft text-ink' : 'hover:text-ink')}>
                  {k === 'recent' ? 'Recent' : 'Biggest upside'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {rows.length ? (
              <HomesList homes={rows} sort={sort} />
            ) : needle ? (
              noMatch
            ) : tab === 'listing' ? (
              conn.mls ? <p className="rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">No active listings on the MLS right now.</p> : connectMls
            ) : tab === 'project' ? (
              <ProjectsEmpty />
            ) : (
              <ReportsEmpty />
            )}
            {tab === 'all' && !needle && !conn.mls && rows.length > 0 && <div className="mt-4">{connectMls}</div>}
          </div>
        </>
      )}
    </div>
  )
}
