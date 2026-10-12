import { FileText, Hammer, ImagePlus, MessageSquareDot, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LicenseForm } from '@/components/home/ConnectBook'
import { CaseStudies } from '@/components/home/NewAgentIntro'
import { ProjectsEmpty, ReportsEmpty } from '@/components/property/HomesEmpty'
import { ListingsTable, REPORT_VIEWS, type ReportRow, type ReportView } from '@/components/property/ReportViews'
import { photoUrl } from '@/lib/assets'
import { money } from '@/lib/format'
import { PROJECT_STEPS } from '@/lib/flows'
import { useConnections, useOpportunities } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Every home the agent is working on, in two sections. With Revive: projects (wide cards with progress,
// open the Project tab) and AI reports (photo cards with value and upside, open the report), each under
// its own labeled row, with a filter to show one kind. Your listings: the agent's active MLS listings,
// with what Revive could add to each.

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
  pct?: number // construction progress, when known
}

/** Figma "Property card": square photo with the product badge, then progress, what's next and one action. */
function ProjectCard({ p }: { p: ProjectRow }) {
  const to = `/property/${p.id}?tab=project`
  const active = p.status === 'active'
  const photos = !!p.next && /photo/i.test(p.next)
  const pct = p.pct ?? Math.round(((p.step + 0.5) / p.steps) * 100)
  return (
    <article className="group flex overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]">
      <Link to={to} tabIndex={-1} aria-hidden="true" className="relative w-32 shrink-0 self-stretch overflow-hidden bg-line-soft sm:w-56 xl:w-60">
        {p.photo && <img src={img(p.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <span className="absolute top-2.5 left-2.5 max-w-[calc(100%-20px)] truncate rounded-full bg-black/50 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">{p.product}</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <Link to={to} className="block truncate text-[15px] font-semibold text-ink hover:text-brand">
            {p.address}
          </Link>
          <p className="truncate text-[13px] text-muted">
            {p.city}
            {p.target && <> · {p.target}</>}
          </p>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-2 text-[13px]">
            <span className="truncate font-medium text-ink">{active ? 'Construction progress' : 'In review with Revive'}</span>
            <span className="shrink-0 text-muted tabular-nums">{active ? `${pct}%` : `${p.step + 1}/${p.steps}`}</span>
          </div>
          {active ? (
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line-soft" role="progressbar" aria-label="Construction progress" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[var(--green)]" style={{ width: `${pct}%` }} />
            </div>
          ) : (
            <div className="mt-1.5 flex gap-1" role="progressbar" aria-label="Project steps" aria-valuenow={p.step + 1} aria-valuemin={1} aria-valuemax={p.steps}>
              {Array.from({ length: p.steps }, (_, i) => (
                <span key={i} className={cn('h-2 flex-1 rounded-full', i <= p.step ? 'bg-[var(--brand-primary)]' : 'bg-line-soft')} />
              ))}
            </div>
          )}
          <p className="mt-1.5 truncate text-[12px] text-muted">{p.stage}</p>
        </div>
        <p className="flex min-h-9 items-start gap-2 text-[12.5px] leading-[18px] text-ink-2">
          {photos ? <ImagePlus className="mt-px size-3.5 shrink-0 text-brand" /> : <MessageSquareDot className="mt-px size-3.5 shrink-0 text-brand" />}
          <span className="line-clamp-2">{p.next ?? 'Nothing waiting on you'}</span>
        </p>
        {photos ? (
          <button
            type="button"
            onClick={() => toast.success('Photos added', { description: `Revive will have them before the site visit at ${p.address}.` })}
            className="mt-auto flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-line-soft text-[12.5px] font-medium text-ink transition-colors hover:bg-line"
          >
            <ImagePlus className="size-3.5" /> Upload home photos
          </button>
        ) : (
          <Link to={to} className="mt-auto flex h-8 w-full items-center justify-center rounded-lg bg-line-soft text-[12.5px] font-medium text-ink transition-colors hover:bg-line">
            {active ? 'View updates' : 'Open project'}
          </Link>
        )}
      </div>
    </article>
  )
}

type Kind = 'all' | 'project' | 'report'

/** A labeled row inside With Revive: icon, name and count, then its cards. */
function Group({ icon: Icon, label, count, grid, right, children }: { icon: typeof Hammer; label: string; count: number; grid?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          <span className="grid size-6 place-items-center rounded-md bg-[var(--brand-primary-subtle)] text-brand">
            <Icon className="size-3.5" />
          </span>
          {label}
          <span className="text-[13px] font-normal text-muted tabular-nums">{count}</span>
        </h3>
        {right}
      </div>
      {grid ? <div className={cn('grid gap-5', grid)}>{children}</div> : children}
    </div>
  )
}

function Section({ title, hint, count, children, emptyNode, filter }: { title: string; hint: string; count: number; children: React.ReactNode; emptyNode: React.ReactNode; filter?: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
            <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{count}</span>
          </div>
          <p className="mt-1.5 text-[13px] text-muted">{hint}</p>
        </div>
        {filter}
      </div>
      {count ? children : emptyNode}
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
  // three report layouts to compare; remembered per browser
  const [view, setView] = useState<ReportView>(() => {
    try {
      return (localStorage.getItem('rv-report-view') as ReportView) || 'list'
    } catch {
      return 'list'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('rv-report-view', view)
    } catch {
      /* private window */
    }
  }, [view])
  const ReportsView = REPORT_VIEWS.find((v) => v.k === view)?.C ?? REPORT_VIEWS[0].C
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
        }
      }),
    ...opps
      .filter((o) => o.property.reportRun && !reports[o.id] && !inProject.has(o.id))
      .map((o) => ({ id: o.id, address: o.property.address, city: o.property.city, photo: o.property.photo, valueNow: o.property.valueNow, upside: o.gain || undefined, product: o.product, designs: designsOn(o.id) })),
  ]

  const shownProjects = projects.filter((p) => match(p.address, p.city, p.product))
  const shownReports = reportRows.filter((r) => match(r.address, r.city, r.product))
  const showProjects = kind !== 'report' && shownProjects.length > 0
  const showReports = kind !== 'project' && shownReports.length > 0
  const reviveEmpty = !needle && projects.length === 0 && reportRows.length === 0
  const listings = opps.filter((o) => o.property.source === 'listings' && match(o.property.address, o.property.city, o.product))
  const reportIds = new Set(reportRows.map((r) => r.id))

  const kinds: { k: Kind; label: string; n: number; icon?: typeof Hammer }[] = [
    { k: 'all', label: 'All', n: shownProjects.length + shownReports.length },
    { k: 'project', label: 'Projects', n: shownProjects.length, icon: Hammer },
    { k: 'report', label: 'AI reports', n: shownReports.length, icon: FileText },
  ]
  const filter = reviveEmpty ? null : (
    <div className="flex gap-2" role="radiogroup" aria-label="Show">
      {kinds.map((f) => {
        const on = kind === f.k
        const Icon = f.icon
        return (
          <button
            key={f.k}
            role="radio"
            aria-checked={on}
            onClick={() => setKind(f.k)}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-line bg-white text-ink hover:border-[var(--brand-primary-border)]')}
          >
            {Icon && <Icon className="size-3.5" />}
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
        count={(showProjects ? shownProjects.length : 0) + (showReports ? shownReports.length : 0)}
        filter={filter}
        emptyNode={
          needle ? (
            noMatch
          ) : reviveEmpty ? (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
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
        <div className="flex flex-col gap-8">
          {showProjects && (
            <Group icon={Hammer} label="Projects" count={shownProjects.length} grid="lg:grid-cols-2">
              {shownProjects.map((p) => (
                <ProjectCard key={p.id} p={p} />
              ))}
            </Group>
          )}
          {showReports && (
            <Group
              icon={FileText}
              label="AI reports"
              count={shownReports.length}
              right={
                <div className="flex items-center gap-1 rounded-lg bg-line-soft p-0.5" role="radiogroup" aria-label="Report layout">
                  {REPORT_VIEWS.map((v) => (
                    <button
                      key={v.k}
                      role="radio"
                      aria-checked={view === v.k}
                      onClick={() => setView(v.k)}
                      className={cn('h-7 rounded-md px-2.5 text-[12px] font-medium', view === v.k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              }
            >
              <ReportsView rows={shownReports} />
            </Group>
          )}
        </div>
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
        <ListingsTable rows={listings} reviveOf={(id) => (inProject.has(id) ? 'project' : reportIds.has(id) ? 'report' : undefined)} />
      </Section>

      {reviveEmpty && (
        <div className="mt-12">
          <CaseStudies />
        </div>
      )}
    </div>
  )
}
