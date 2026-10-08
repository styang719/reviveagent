import { UserRound } from 'lucide-react'
import { SellerReferrals } from '@/components/property/SellerReferrals'
import { useOpportunities } from '@/lib/opportunities'
import { PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Lead tracking: the seller referrals Revive sends the agent, and where each one stands.
export default function LeadTracking() {
  const opps = useOpportunities()
  const tier = useDemo((s) => s.tier)
  const refs = opps.filter((o) => o.referral)
  return (
    <div className={PAGE}>
      <header className="border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Lead tracking</h1>
        <p className="mt-1 text-[15px] text-ink-2">Seller leads Revive sends you, from first claim to listing. Keep each one current so the next ones keep coming.</p>
      </header>
      {refs.length ? (
        <SellerReferrals opps={refs} />
      ) : (
        <div className="mt-8 flex items-start gap-3 rounded-xl border border-dashed border-line px-5 py-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
            <UserRound className="size-4" />
          </span>
          <div>
            <p className="text-[14.5px] font-semibold text-ink">No seller referrals yet</p>
            <p className="mt-1 text-[13.5px] text-ink-2">
              {tier === 'partner'
                ? 'New referrals from Revive show up here first.'
                : 'Revive Partners get seller leads: homeowners nearby who are ready to sell, sent to them first. Close two deals with Revive to become a Partner.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
