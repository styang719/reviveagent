import { Check, Hammer, Sparkles, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import mark from '@/assets/revive-mark.svg'
import { Button } from '@/components/ui/button'
import { DEALS_TO_PARTNER, TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { plural } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { focusHeroSearch } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STEPS = [
  { deals: 0, label: 'Start', icon: Sparkles },
  { deals: 1, label: 'First deal', icon: Hammer },
  { deals: DEALS_TO_PARTNER, label: 'Partner', icon: UserRoundPlus },
]

/** Where the agent is with Revive, and what the next deal unlocks. */
export function RevivePathCard({ tier, opps }: { tier: Tier; opps: Opportunity[] }) {
  const deals = TIERS[tier].deals
  const partner = deals >= DEALS_TO_PARTNER
  const pct = Math.min(1, deals / DEALS_TO_PARTNER)
  const listing = opps.find((o) => o.cta.kind === 'propose')
  const newLeads = opps.filter((o) => o.referral?.status === 'new' && !o.referral.claimedAt).length
  const left = DEALS_TO_PARTNER - deals

  const context = partner
    ? newLeads > 0
      ? `You get seller leads from Revive. ${plural(newLeads, 'new lead')} today, exclusive to you for 24 hrs.`
      : 'You get seller leads from Revive. Keep their status current to keep them coming.'
    : `Partners get seller leads from Revive: homeowners nearby who are ready to sell, sent to them first. ${
        left === 1 ? 'One more deal to go.' : `${plural(left, 'deal')} to go.`
      }`
  const cta: { label: string; to?: string; onClick?: () => void } | null = partner
    ? { label: 'See your seller leads', to: '/opportunities?filter=revive' }
    : listing
      ? { label: `Propose Revive on ${listing.property.address}`, to: `/property/${listing.id}?tab=project` }
      : { label: 'Look up a home to start', onClick: focusHeroSearch }

  return (
    <section aria-labelledby="status-title" className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="relative bg-navy px-5 pt-4 pb-5 text-white">
        <img src={mark} alt="" aria-hidden="true" className="pointer-events-none absolute -top-4 -right-4 h-28 w-auto opacity-[0.07]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <h2 id="status-title" className="text-[13px] font-medium text-[#A8B0D0]">
              Your Revive status
            </h2>
            <p className="mt-0.5 text-xl font-semibold">{partner ? 'Revive Partner' : `${deals} of ${DEALS_TO_PARTNER} deals to Partner`}</p>
          </div>
          {partner && <span className="rounded-full bg-[#fde68a] px-2.5 py-1 text-[11px] font-bold text-navy">PARTNER</span>}
        </div>

        {/* the track: Start → First deal → Partner */}
        <ol className="relative mt-5 flex justify-between" aria-label={`${deals} of ${DEALS_TO_PARTNER} deals`}>
          <span className="absolute top-4 right-4 left-4 h-1 rounded-full bg-white/15" aria-hidden="true" />
          <span
            className="absolute top-4 left-4 h-1 rounded-full bg-[#7dd3b0] transition-[width] duration-500"
            style={{ width: `calc((100% - 2rem) * ${pct})` }}
            aria-hidden="true"
          />
          {STEPS.map((s) => {
            const done = deals >= s.deals
            const next = !done && STEPS.find((x) => deals < x.deals) === s
            const Icon = done ? Check : s.icon
            return (
              <li key={s.label} className="relative flex w-16 flex-col items-center text-center first:items-start first:text-left last:items-end last:text-right">
                <span
                  className={cn(
                    'grid size-9 place-items-center rounded-full border-2',
                    done ? 'border-[#7dd3b0] bg-[#7dd3b0] text-navy' : next ? 'border-white bg-navy text-white' : 'border-white/25 bg-navy text-white/50',
                  )}
                >
                  <Icon className="size-4" strokeWidth={2.4} />
                </span>
                <span className={cn('mt-1.5 text-xs font-medium whitespace-nowrap', done || next ? 'text-white' : 'text-white/50')}>{s.label}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4">
        <p className="text-sm leading-5 text-ink-2">{context}</p>
        {cta && (
          <Button variant={partner ? 'warn' : 'default'} className="self-start" asChild={!!cta.to} onClick={cta.onClick}>
            {cta.to ? <Link to={cta.to}>{cta.label}</Link> : <span>{cta.label}</span>}
          </Button>
        )}
      </div>
    </section>
  )
}
