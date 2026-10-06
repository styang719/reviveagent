import { BarChart3, Check, Hammer, Lock, Sparkles, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import mark from '@/assets/revive-mark.svg'
import { Button } from '@/components/ui/button'
import { DEALS_TO_PARTNER, TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { plural } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

const STEPS = [
  { deals: 0, label: 'Start', icon: Sparkles },
  { deals: 1, label: 'First deal', icon: Hammer },
  { deals: DEALS_TO_PARTNER, label: 'Partner', icon: UserRoundPlus },
]

const PERKS = [
  {
    deals: 0,
    icon: Sparkles,
    title: 'Revive AI on any address',
    body: 'Value today, renovation upside and shareable reports, plus opportunities found in your book.',
  },
  { deals: 1, icon: BarChart3, title: 'Project tracking and earnings', body: 'Follow every Revive project and what it earned you.' },
  {
    deals: DEALS_TO_PARTNER,
    icon: UserRoundPlus,
    title: 'Seller leads from Revive',
    body: 'Homeowners in your area who ask Revive for an agent are sent to Partners first, exclusive to you for 24 hrs.',
  },
]

/** Where the agent is with Revive, and what the next deal unlocks. */
export function RevivePathCard({ tier, opps }: { tier: Tier; opps: Opportunity[] }) {
  const deals = TIERS[tier].deals
  const partner = deals >= DEALS_TO_PARTNER
  const pct = Math.min(1, deals / DEALS_TO_PARTNER)
  const listing = opps.find((o) => o.cta.kind === 'propose')
  const newLeads = opps.filter((o) => o.referral?.status === 'new' && !o.referral.claimedAt).length
  const left = DEALS_TO_PARTNER - deals

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

      <ul className="divide-y divide-line-soft px-5">
        {PERKS.map((p) => {
          const unlocked = deals >= p.deals
          const Icon = p.icon
          return (
            <li key={p.title} className="flex gap-3 py-3">
              <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg', unlocked ? 'bg-ok-soft text-ok' : 'bg-line-soft text-faint')}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-ink">
                  {p.title}
                  {unlocked ? (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-ok">
                      <Check className="size-3" strokeWidth={3} /> Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-muted">
                      <Lock className="size-3" /> {plural(p.deals, 'deal')}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[13px] leading-5 text-muted">{p.body}</p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-line bg-head px-5 py-3.5">
        {partner ? (
          <p className="text-[13px] text-ink-2">
            {newLeads > 0 ? (
              <>
                <span className="font-semibold text-warn">{plural(newLeads, 'new seller lead')}</span> waiting for you today.
              </>
            ) : (
              'Keep referral statuses current to keep seller leads coming.'
            )}
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-ink-2">
              {left === 1 ? 'One more Revive deal unlocks seller leads.' : `${plural(left, 'Revive deal')} unlock seller leads.`}
            </p>
            {listing && (
              <Button size="sm" variant="outline" asChild>
                <Link to={`/property/${listing.id}?tab=project`}>{deals === 0 ? 'Start your first project' : 'Start a project'}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
