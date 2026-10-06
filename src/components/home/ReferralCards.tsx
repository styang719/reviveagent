import { Gift, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { DEALS_TO_PARTNER, TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { plural } from '@/lib/format'

export function LockedReferrals({ tier }: { tier: Tier }) {
  const deals = TIERS[tier].deals
  const left = DEALS_TO_PARTNER - deals
  return (
    <Card className="border-dashed bg-head p-4">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Lock className="size-4 text-muted" /> Homeowner referrals
      </h2>
      <p className="mt-1 text-sm text-ink-2">
        {left === 1 ? 'One more Revive deal unlocks homeowner referrals.' : `${plural(left, 'more Revive deal')} unlock homeowner referrals.`}
      </p>
      <p className="mt-1 text-xs text-muted">Revive sends Partners homeowners in their area who are ready to sell, exclusive for 24 hrs.</p>
      <Progress value={(deals / DEALS_TO_PARTNER) * 100} label="Progress to referrals" className="mt-3" />
      <p className="mt-1 text-xs text-muted">
        {deals} of {DEALS_TO_PARTNER} deals
      </p>
    </Card>
  )
}

export function ReferEarn() {
  return (
    <Card className="p-4">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Gift className="size-4 text-brand" /> Refer & Earn
      </h2>
      <p className="mt-1 text-sm text-ink-2">Know an agent who should work with Revive? Earn [AMOUNT] when they close their first Revive deal.</p>
      <Button variant="outline" size="sm" className="mt-3 w-full">
        Copy your referral link
      </Button>
    </Card>
  )
}
