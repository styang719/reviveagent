import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { OpportunityCard } from '@/components/opportunity/OpportunityCard'
import { plural } from '@/lib/format'
import { useOpportunities } from '@/lib/opportunities'
import { useDemo } from '@/store/demo'
import { Placeholder } from './Placeholder'

// The to-do list. A home leaves it once a project is submitted: from then on it's tracked on its
// property page, under Properties.
export default function Opportunities() {
  const opps = useOpportunities()
  const projects = useDemo((s) => s.projects)
  const inProject = (o: (typeof opps)[number]) => o.stage === 'project' || !!projects[o.id] || !!o.property.project
  const open = opps.filter((o) => !inProject(o))
  const moved = opps.length - open.length
  return (
    <Placeholder title="Opportunities" intro="Every place Revive can add value in your book, ranked by who to call first." phase={2}>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted">Filters, list / map / pipeline views come next. For now, the ranked book:</p>
        {moved > 0 && (
          <Link to="/properties" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            {plural(moved, 'home')} in Revive projects <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {open.map((o) => (
          <OpportunityCard key={o.id} o={o} size="compact" />
        ))}
      </div>
    </Placeholder>
  )
}
