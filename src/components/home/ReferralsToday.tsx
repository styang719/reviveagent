import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ReferralCard } from '@/components/property/SellerReferrals'
import { useNow } from '@/hooks/useNow'
import type { Opportunity } from '@/lib/opportunities'

// Dashboard (Partner): the seller referrals that can't wait. A new one (call within its 24-hour window) and the
// next home visit. Everything else, like updates owed to Revive, waits on Lead tracking.

export function ReferralsToday({ opps }: { opps: Opportunity[] }) {
  const now = useNow(60_000)
  const fresh = opps.find((o) => o.referral?.status === 'new' && !o.referral.claimedAt && o.referral.expiresAt > now)
  const visit = opps.find((o) => o.referral?.status === 'claimed' && o.referral.needsUpdateNow)
  const cards = [fresh, visit].filter((o): o is Opportunity => !!o)
  if (!cards.length) return null
  const first = (o: Opportunity) => o.person?.name.split(' ')[0] ?? 'the homeowner'
  return (
    <section aria-labelledby="referrals-today">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="referrals-today" className="flex items-center gap-2.5 text-xl font-semibold text-ink">
            Seller referrals from Revive
            <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{cards.length}</span>
          </h2>
          <p className="mt-1 text-[13px] text-muted">Homeowners Revive sent you that need you today.</p>
        </div>
        <Link to="/leads/referrals" className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-brand hover:underline">
          All referrals <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((o) =>
          o === fresh ? (
            <ReferralCard key={o.id} o={o} action={`Call ${first(o)} in the next ${Math.max(1, Math.round((o.referral!.expiresAt - now) / 3_600_000))} hours. They’re expecting you.`} />
          ) : (
            <ReferralCard key={o.id} o={o} action="Home visit tomorrow at 11:30am. Review the listing details first." />
          ),
        )}
      </div>
    </section>
  )
}
