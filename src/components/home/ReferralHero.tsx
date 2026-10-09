import { Clock, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Reasons } from '@/components/opportunity/OpportunityCard'
import { useCta } from '@/components/opportunity/useCta'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { countdown, gain } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'

export function ReferralHero({ o }: { o: Opportunity }) {
  const now = useNow()
  const runCta = useCta()
  const left = (o.referral?.expiresAt ?? 0) - now
  const expired = left <= 0

  return (
    <section aria-label="New homeowner referral" className="rounded-xl border border-[#f6d58a] bg-warn-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-warn">New homeowner referral · exclusive to you for {o.referral?.expiresInHours} hrs</p>
        <p className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-[13px] font-semibold text-warn tabular-nums" aria-live="off">
          <Clock className="size-3.5" />
          {expired ? 'Exclusivity ended' : `${countdown(left)} left`}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-xl font-semibold text-ink">
            <MapPin className="size-5 text-warn" />
            {o.property.address}
            <span className="text-base font-normal text-muted">, {o.property.city}</span>
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            {o.person?.name} · Homeowner · found by Revive
          </p>
          <div className="mt-2">
            <Reasons o={o} />
          </div>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-xl font-semibold text-ok">{gain(o.gain)}</p>
          <p className="text-xs text-muted">Est. upside · {o.product}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="warn" onClick={() => runCta(o)} disabled={expired}>
          Claim lead
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/leads/referrals/${o.id}`}>View referral</Link>
        </Button>
      </div>
    </section>
  )
}
