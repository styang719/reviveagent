import { ArrowRight, Hammer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useOpportunities } from '@/lib/opportunities'
import { PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Every Revive project, each opening its property page on the Project tab.
export default function Projects() {
  const created = useDemo((s) => s.projects)
  const opps = useOpportunities()
  const rows = [
    ...Object.values(created).map((p) => ({ id: p.propertyId, address: p.address, city: p.city, product: p.product, status: 'Submitted · Revive review within 48 hrs' })),
    ...opps
      .filter((o) => o.property.project && !created[o.id])
      .map((o) => ({ id: o.id, address: o.property.address, city: o.property.city, product: o.property.project!.product, status: o.property.project!.stageLabel })),
  ]
  return (
    <div className={PAGE}>
      <h1 className="text-2xl font-semibold text-ink">Projects</h1>
      <p className="mt-1 text-[15px] text-ink-2">Every Revive project, from submission to sale. Each one lives on its property’s page.</p>
      {rows.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line p-8 text-center">
          <p className="text-base font-semibold text-ink">No projects yet</p>
          <p className="mt-1 text-sm text-ink-2">Revive AI walks you through your first one in a few minutes.</p>
          <Button className="mt-4" asChild>
            <Link to="/ai?flow=project">
              <Hammer /> Start a project
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
          {rows.map((r) => (
            <li key={r.id}>
              <Link to={`/property/${r.id}?tab=project`} className="flex items-center gap-4 px-5 py-4 hover:bg-head">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Hammer className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">
                    {r.address}
                    <span className="font-normal text-muted">, {r.city}</span>
                  </span>
                  <span className="block text-[13px] text-muted">
                    {r.product} · {r.status}
                  </span>
                </span>
                <ArrowRight className="size-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
