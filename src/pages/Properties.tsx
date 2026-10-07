import { ArrowRight, FileText, Hammer, Handshake, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { useOpportunities } from '@/lib/opportunities'
import { PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Every property the agent is working with Revive, grouped by where it is: talking with Revive,
// in construction, or with a Revive AI report. Each opens its property page.

type Row = { id: string; address: string; city: string; photo?: string; status: string; value?: string; tab: 'report' | 'project' }

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))

function PropertyCard({ r }: { r: Row }) {
  return (
    <Link
      to={`/property/${r.id}?tab=${r.tab}`}
      className="group flex items-center gap-4 rounded-xl border border-line bg-white p-3 shadow-card transition-shadow hover:shadow-md"
    >
      <span className="size-16 shrink-0 overflow-hidden rounded-lg bg-line-soft">
        {r.photo && <img src={img(r.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-ink">{r.address}</span>
        <span className="block truncate text-[13px] text-muted">{r.city}</span>
        <span className="mt-1 block truncate text-[12.5px] text-ink-2">{r.status}</span>
      </span>
      {r.value && <span className="shrink-0 text-[13px] font-semibold text-[var(--green)] tabular-nums">{r.value}</span>}
      <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}

function Section({
  icon: Icon,
  title,
  hint,
  rows,
  empty,
}: {
  icon: typeof Hammer
  title: string
  hint: string
  rows: Row[]
  empty: { text: string; cta: string; to: string }
}) {
  return (
    <section className="mt-10 first-of-type:mt-8">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
          <Icon className="size-4" />
        </span>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{rows.length}</span>
      </div>
      <p className="-mt-2 mb-4 text-[13px] text-muted">{hint}</p>
      {rows.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((r) => (
            <PropertyCard key={`${r.tab}-${r.id}`} r={r} />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line px-5 py-4">
          <p className="text-[13.5px] text-ink-2">{empty.text}</p>
          <Button size="sm" variant="outline" asChild>
            <Link to={empty.to}>
              <Sparkles /> {empty.cta}
            </Link>
          </Button>
        </div>
      )}
    </section>
  )
}

export default function Properties() {
  const created = useDemo((s) => s.projects)
  const reports = useDemo((s) => s.reports)
  const opps = useOpportunities()

  // with Revive: projects submitted from Revive AI, built-in projects still in review
  const discussing: Row[] = [
    ...Object.values(created).map((p) => ({
      id: p.propertyId,
      address: p.address,
      city: p.city,
      photo: opps.find((o) => o.id === p.propertyId)?.property.photo ?? reports[p.propertyId]?.photos[0],
      status: `${p.product} · Revive review within 48 hrs`,
      tab: 'project' as const,
    })),
    ...opps
      .filter((o) => o.property.project?.status === 'submitted' && !created[o.id])
      .map((o) => ({ id: o.id, address: o.property.address, city: o.property.city, photo: o.property.photo, status: `${o.property.project!.product} · ${o.property.project!.stageLabel}`, tab: 'project' as const })),
  ]
  const building: Row[] = opps
    .filter((o) => o.property.project?.status === 'active' && !created[o.id])
    .map((o) => ({
      id: o.id,
      address: o.property.address,
      city: o.property.city,
      photo: o.property.photo,
      status: `${o.property.project!.product} · ${o.property.project!.stageLabel}`,
      value: `${o.property.project!.progressPct}%`,
      tab: 'project',
    }))
  const inProject = new Set([...discussing, ...building].map((r) => r.id))
  const reported: Row[] = [
    ...Object.values(reports)
      .filter((r) => !inProject.has(r.id))
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((r) => {
        const best = Math.max(0, ...r.scenarios.map((s) => s.gain ?? 0))
        return { id: r.id, address: r.address, city: r.city, photo: r.photos[0], status: `Report · value today ${money(r.valueNow)}`, value: best ? gain(best) : undefined, tab: 'report' as const }
      }),
    ...opps
      .filter((o) => o.property.reportRun && !o.property.project && !reports[o.id] && !inProject.has(o.id))
      .map((o) => ({
        id: o.id,
        address: o.property.address,
        city: o.property.city,
        photo: o.property.photo,
        status: `Report · value today ${money(o.property.valueNow)}`,
        value: o.gain ? gain(o.gain) : undefined,
        tab: 'report' as const,
      })),
  ]

  return (
    <div className={PAGE}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Properties</h1>
          <p className="mt-1 text-[15px] text-ink-2">Every home you’re working on with Revive. Each one has its own page with the report, project and marketing.</p>
        </div>
        <Button asChild>
          <Link to="/ai?flow=report">
            <FileText /> New Revive AI report
          </Link>
        </Button>
      </div>
      <div className="mt-2">
        <Section
          icon={Handshake}
          title="Discussing with Revive"
          hint="Projects you’ve submitted. Revive reviews each within 48 hours, then sends offer terms."
          rows={discussing}
          empty={{ text: 'Nothing with Revive yet. Start a project from any report.', cta: 'Start a project', to: '/ai?flow=project' }}
        />
        <Section
          icon={Hammer}
          title="In construction"
          hint="Revive is doing the work. Follow each project to listing."
          rows={building}
          empty={{ text: 'No projects under construction yet.', cta: 'Start a project', to: '/ai?flow=project' }}
        />
        <Section
          icon={FileText}
          title="Revive AI reports"
          hint="Homes you’ve run a report on. Share it with the homeowner, or turn it into a project."
          rows={reported}
          empty={{ text: 'No reports yet. Any address works, nothing to connect first.', cta: 'Generate a report', to: '/ai?flow=report' }}
        />
      </div>
    </div>
  )
}
