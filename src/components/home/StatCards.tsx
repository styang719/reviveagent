import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DEALS_TO_PARTNER, TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { money, plural } from '@/lib/format'
import { isActionable, type Opportunity } from '@/lib/opportunities'

export function StatCards({ tier, opps }: { tier: Tier; opps: Opportunity[] }) {
  const cfg = TIERS[tier]
  const actionable = opps.filter(isActionable)
  const value = actionable.reduce((s, o) => s + o.gain, 0)
  const partner = cfg.deals >= DEALS_TO_PARTNER

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Link to="/opportunities" className="group rounded-xl focus-visible:outline-offset-4">
        <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
          <p className="text-[13px] text-muted">Opportunity value in your book</p>
          <p className="mt-1 text-[28px] leading-9 font-semibold text-ink">{money(value)}</p>
          <p className="flex items-center gap-1 text-[13px] text-brand">
            {plural(actionable.length, 'opportunity', 'opportunities')} to act on <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </p>
        </Card>
      </Link>
      <Card className="p-5">
        <p className="text-[13px] text-muted">Earned with Revive</p>
        <p className="mt-1 text-[28px] leading-9 font-semibold text-ink">{money(cfg.earned)}</p>
        <p className="text-[13px] text-muted">{cfg.earnedNote}</p>
      </Card>
      <Card className="p-5">
        <p className="text-[13px] text-muted">Your Revive status</p>
        {partner ? (
          <>
            <p className="mt-1 flex items-center gap-2 text-[28px] leading-9 font-semibold text-ink">
              Partner <CheckCircle2 className="size-6 text-ok" />
            </p>
            <Progress value={100} label="Partner status" className="mt-2" barClassName="bg-ok" />
            <p className="mt-2 text-[13px] text-muted">Homeowner referrals unlocked</p>
          </>
        ) : (
          <>
            <p className="mt-1 text-[28px] leading-9 font-semibold text-ink">
              {cfg.deals} <span className="text-base font-medium text-muted">of {DEALS_TO_PARTNER} deals</span>
            </p>
            <Progress value={(cfg.deals / DEALS_TO_PARTNER) * 100} label="Progress to Partner" className="mt-2" />
            <p className="mt-2 text-[13px] text-muted">
              {plural(DEALS_TO_PARTNER - cfg.deals, 'more deal')} to Partner
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
