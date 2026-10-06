import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { money, plural } from '@/lib/format'
import { isActionable, type Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// The three numbers at the top of Home. A brand-new agent sees the same cards, with what fills them.
export function StatCards({ tier, opps }: { tier: Tier; opps: Opportunity[] }) {
  const cfg = TIERS[tier]
  const empty = opps.length === 0
  const actionable = opps.filter(isActionable)
  const value = actionable.reduce((s, o) => s + o.gain, 0)
  const projects = opps.filter((o) => o.stage === 'project')
  const next = projects.find((o) => o.property.project?.nextFromAgent)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link to="/opportunities" className="group rounded-xl">
        <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
          <p className="text-[13px] text-muted">Opportunity value in your book</p>
          <p className={cn('mt-1 text-[28px] leading-9 font-semibold tabular-nums', empty ? 'text-faint' : 'text-ink')}>{empty ? '$0' : money(value)}</p>
          <p className="flex items-center gap-1 text-[13px] text-brand">
            {empty ? 'Connect your book to find them' : `${plural(actionable.length, 'opportunity', 'opportunities')} to act on`}{' '}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Card>
      </Link>
      <Card className="p-5">
        <p className="text-[13px] text-muted">Earned with Revive</p>
        <p className={cn('mt-1 text-[28px] leading-9 font-semibold tabular-nums', cfg.earned ? 'text-ink' : 'text-faint')}>{money(cfg.earned)}</p>
        <p className="text-[13px] text-muted">{cfg.earnedNote}</p>
      </Card>
      <Link to="/projects" className="group rounded-xl">
        <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
          <p className="text-[13px] text-muted">Revive projects</p>
          <p className={cn('mt-1 text-[28px] leading-9 font-semibold tabular-nums', projects.length ? 'text-ink' : 'text-faint')}>
            {projects.length} <span className="text-base font-medium text-muted">in progress</span>
          </p>
          <p className="truncate text-[13px] text-ink-2">
            {next ? `Next from you: ${next.property.project?.nextFromAgent}` : projects.length ? 'Nothing waiting on you' : 'Projects start from an opportunity'}
          </p>
        </Card>
      </Link>
    </div>
  )
}
