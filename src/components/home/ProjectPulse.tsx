import { ArrowRight, Hammer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Opportunity } from '@/lib/opportunities'

export function ProjectPulse({ o }: { o: Opportunity }) {
  const proj = o.property.project
  if (!proj) return null
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
            <Hammer className="size-3.5" /> Active project · {proj.product}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            <Link to={`/property/${o.id}?tab=project`} className="hover:text-brand hover:underline">
              {o.property.address}
            </Link>
            <span className="font-normal text-muted">, {o.property.city}</span>
          </h2>
          <p className="text-sm text-ink-2">
            {proj.stageLabel} · on schedule · {o.person?.name}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/property/${o.id}?tab=project`}>
            Open project <ArrowRight />
          </Link>
        </Button>
      </div>
      <Progress value={proj.progressPct} label="Project progress" className="mt-4" barClassName="bg-ok" />
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>Submitted</span>
        <span>{proj.progressPct}% done</span>
        <span>Listed</span>
      </div>
      {proj.nextFromAgent && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-brand-soft px-3 py-2.5">
          <p className="text-sm text-navy">
            <span className="font-semibold">Next from you:</span> {proj.nextFromAgent}
          </p>
          <Link to={`/property/${o.id}?tab=project`} className="text-[13px] font-medium text-brand hover:underline">
            Review selections
          </Link>
        </div>
      )}
    </Card>
  )
}
