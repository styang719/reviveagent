import { CheckCircle2, Circle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Opportunity } from '@/lib/opportunities'

export function SetupChecklist({ opps }: { opps: Opportunity[] }) {
  const firstShareable = opps.find((o) => o.cta.kind === 'share')
  const firstListing = opps.find((o) => o.cta.kind === 'propose')
  const items = [
    { label: 'CRM connected', done: true },
    { label: 'MLS listings imported', done: true },
    {
      label: 'Share your first report',
      // Only the agent's own share counts; a lead-form lead arriving as "Interested" doesn't.
      done: opps.some((o) => o.stage === 'shared' || o.activity.some((a) => a.startsWith('You shared'))),
      to: firstShareable ? `/property/${firstShareable.id}?tab=report` : '/opportunities',
    },
    {
      label: 'Start your first project',
      done: opps.some((o) => o.stage === 'project'),
      to: firstListing ? `/property/${firstListing.id}?tab=project` : '/opportunities',
    },
  ]
  const done = items.filter((i) => i.done).length
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Get set up</h2>
        <span className="text-xs text-muted">
          {done} of {items.length}
        </span>
      </div>
      <Progress value={(done / items.length) * 100} label="Setup progress" className="mt-2" barClassName="bg-ok" />
      <ul className="mt-3 space-y-1">
        {items.map((i) => (
          <li key={i.label}>
            {i.done || !i.to ? (
              <span className="flex items-center gap-2 py-1 text-sm text-muted">
                {i.done ? <CheckCircle2 className="size-4 text-ok" /> : <Circle className="size-4 text-faint" />}
                <span className={i.done ? 'line-through decoration-faint' : ''}>{i.label}</span>
              </span>
            ) : (
              <Link to={i.to} className="flex items-center gap-2 rounded-md py-1 text-sm font-medium text-ink hover:text-brand">
                <Circle className="size-4 text-faint" />
                {i.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Your opportunities are ready now. Setup just makes them better.</p>
    </Card>
  )
}
