import { ArrowRight, CalendarClock, CircleDot, Clock, Signpost, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// Homes > Your seller referrals from Revive: homeowners Revive sent this agent. Each card leads with the
// address (this is the Homes page), then the homeowner, where the referral stands and the one thing to do.

const STATUS = {
  new: { label: 'New', icon: CircleDot, cls: 'border-hot-line bg-hot-soft text-hot-ink', body: 'Revive just sent you this homeowner. Claim it within 24 hours to keep the lead.' },
  claimed: { label: 'Scheduled', icon: Clock, cls: 'border-[#fde3a7] bg-[#fef8e6] text-[var(--amber)]', body: 'Get ready for the home visit. Review the listing details and prepare for your conversation with the homeowner.' },
  contacted: { label: 'Met', icon: UserRound, cls: 'border-[var(--brand-primary-border)] bg-[var(--brand-primary-subtle)] text-brand', body: 'Tell us how the home visit went so we can understand the opportunity and what happens next.' },
  listing: { label: 'Listed', icon: Signpost, cls: 'border-[var(--teal-soft)] bg-ok-soft text-[var(--green)]', body: 'You’re listing it. Keep Revive posted as offers come in.' },
  lost: { label: 'Closed', icon: CalendarClock, cls: 'border-line bg-head text-ink-2', body: 'This referral is closed.' },
} as const

const when = (o: Opportunity) => {
  const s = o.person?.since ?? ''
  const d = s.split(' · ').pop()
  return d === 'today' ? 'Referred today' : d ? `Referred ${d}` : ''
}

export function SellerReferrals({ opps }: { opps: Opportunity[] }) {
  if (!opps.length) return null
  return (
    <section className="mt-10" aria-labelledby="referrals-title">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
          <UserRound className="size-4" />
        </span>
        <h2 id="referrals-title" className="text-xl font-semibold text-ink">
          Your seller referrals from Revive
        </h2>
        <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{opps.length}</span>
      </div>
      <p className="mt-1.5 mb-5 text-[13px] text-muted">Homeowners nearby who are ready to sell, sent to you first. Keep their status current to keep them coming.</p>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {opps.map((o) => {
          const st = STATUS[o.referral!.status]
          const Icon = st.icon
          const initials = (o.person?.name ?? o.property.address)
            .split(' ')
            .map((x) => x[0])
            .slice(0, 2)
            .join('')
          return (
            <Link
              key={o.id}
              to={`/property/${o.id}`}
              className="group flex flex-col rounded-2xl border border-[var(--brand-primary-border-subtle)] bg-white p-5 shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-[14px] font-medium text-ink">{initials}</span>
                <span className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[13px] font-medium', st.cls)}>
                  <Icon className="size-4" /> {st.label}
                </span>
              </div>
              <p className="mt-4 text-[17px] font-semibold text-navy">{o.property.address}</p>
              <p className="text-[13.5px] text-muted">
                {o.person?.name} · {o.property.city}
              </p>
              <p className="mt-3 text-[14px] leading-6 text-ink-2">{st.body}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-[13.5px]">
                <span className="text-muted">{when(o)}</span>
                <span className="flex items-center gap-1 font-medium text-brand">
                  See details <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
