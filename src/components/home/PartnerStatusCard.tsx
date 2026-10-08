import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import mark from '@/assets/revive-mark.svg'
import { Button } from '@/components/ui/button'
import { TIERS } from '@/data/tiers'
import { money, plural } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// Once the agent is a Revive Partner, the status card becomes a membership card: the grade they're at,
// deals closed toward the next one, and what a higher grade earns (first look at new referrals).
const GRADES = [
  { name: 'Starter', from: 2, perk: 'Seller leads from Revive, exclusive for 24 hrs' },
  { name: 'Semi-Pro', from: 7, perk: 'First look at new Revive referrals in your area' },
  { name: 'Producer', from: 12, perk: 'Priority referrals and a dedicated Revive advisor line' },
]

export function PartnerStatusCard({ opps }: { opps: Opportunity[] }) {
  const deals = TIERS.partner.deals
  const earned = TIERS.partner.earned
  const at = [...GRADES].reverse().find((g) => deals >= g.from) ?? GRADES[0]
  const i = GRADES.indexOf(at)
  const next = GRADES[i + 1]
  const pct = next ? (deals - at.from) / (next.from - at.from) : 1
  const newLeads = opps.filter((o) => o.referral?.status === 'new' && !o.referral.claimedAt).length

  return (
    <section aria-labelledby="partner-title" className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="relative overflow-hidden bg-[radial-gradient(120%_90%_at_100%_0%,#2b4580_0%,var(--navy)_55%,#141f3d_100%)] px-5 pt-5 pb-6 text-white">
        <img src={mark} alt="" aria-hidden="true" className="pointer-events-none absolute -top-6 -right-6 h-36 w-auto opacity-[0.08]" />
        <div className="relative">
          <p className="text-[11.5px] font-semibold tracking-[0.12em] text-[var(--teal)] uppercase">Partner status</p>
          <h2 id="partner-title" className="mt-1 text-[30px] leading-9 font-semibold text-[var(--teal-soft)]">
            {at.name}
          </h2>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-[34px] leading-none font-semibold tabular-nums">
              {deals}
              {next && <span className="text-white/45">/{next.from}</span>}
            </span>
            <span className="text-[11.5px] font-semibold tracking-[0.1em] text-white/70 uppercase">Deals closed</span>
          </p>
          {/* progress to the next grade, ending in the star like a membership card */}
          <div className="mt-3 flex items-center gap-2.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/12">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--teal)] to-[var(--teal-soft)]" style={{ width: `${Math.max(6, pct * 100)}%` }} />
            </div>
            <Sparkles className="size-5 shrink-0 text-[var(--teal)]" />
          </div>
          <p className="mt-2.5 text-[13px] text-white/80">
            {next ? (
              <>
                <b className="font-semibold text-white">{plural(next.from - deals, 'deal')} to {next.name}.</b> {next.perk}.
              </>
            ) : (
              'Top grade. Thank you for building with Revive.'
            )}
          </p>
          <ol className="mt-4 grid grid-cols-3 gap-1.5" aria-label="Partner grades">
            {GRADES.map((g, k) => (
              <li key={g.name}>
                <span className={cn('block h-1 rounded-full', k <= i ? 'bg-[var(--teal)]' : 'bg-white/15')} />
                <span className={cn('mt-1.5 flex items-center gap-1 text-[11.5px]', k === i ? 'font-semibold text-white' : k < i ? 'text-white/70' : 'text-white/45')}>
                  {k < i && <Check className="size-3" />}
                  {g.name}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
          <span className="text-[13px] text-muted">Earned with Revive</span>
          <span className="text-[15px] font-semibold text-ink tabular-nums">{money(earned)}</span>
        </div>
        <p className="mt-3 text-[13.5px] leading-5 text-ink-2">
          {newLeads > 0 ? (
            <>
              <b className="font-semibold text-ink">{plural(newLeads, 'new seller lead')}</b> today, yours alone for 24 hrs.
            </>
          ) : (
            'Keep your seller leads current to keep them coming.'
          )}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button asChild className="h-10">
            <Link to="/leads">
              See seller leads <ArrowRight />
            </Link>
          </Button>
          <Button variant="ghost" className="h-10">
            Grade details
          </Button>
        </div>
      </div>
    </section>
  )
}
