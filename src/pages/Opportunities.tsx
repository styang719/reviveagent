import { OpportunityCard } from '@/components/opportunity/OpportunityCard'
import { useOpportunities } from '@/lib/opportunities'
import { Placeholder } from './Placeholder'

export default function Opportunities() {
  const opps = useOpportunities()
  return (
    <Placeholder
      title="Opportunities"
      intro="Every place Revive can add value in your book, ranked by who to call first."
      phase={2}
    >
      <p className="mt-1 text-sm text-muted">Filters, list / map / pipeline views come next. For now, the ranked book:</p>
      <div className="mt-4 flex flex-col gap-3">
        {opps.map((o) => (
          <OpportunityCard key={o.id} o={o} size="compact" />
        ))}
      </div>
    </Placeholder>
  )
}
