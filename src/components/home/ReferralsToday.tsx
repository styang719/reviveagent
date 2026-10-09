import { ArrowRight, CalendarClock, ChevronRight, PhoneCall } from 'lucide-react'
import { Link } from 'react-router-dom'
import { initials, REFERRAL_STATUS } from '@/components/property/SellerReferrals'
import { useNow } from '@/hooks/useNow'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// Dashboard (Partner): the seller referrals that can't wait, as two compact rows. A new one (call within its
// 24-hour window) and the next home visit. Everything else, like updates owed to Revive, waits on Lead tracking.

export function ReferralsToday({ opps }: { opps: Opportunity[] }) {
  const now = useNow(60_000)
  const fresh = opps.find((o) => o.referral?.status === 'new' && !o.referral.claimedAt && o.referral.expiresAt > now)
  const visit = opps.find((o) => o.referral?.status === 'claimed' && o.referral.needsUpdateNow)
  const first = (o: Opportunity) => o.person?.name.split(' ')[0] ?? 'the homeowner'
  const rows = [
    fresh && { o: fresh, icon: PhoneCall, action: `Call ${first(fresh)} · ${Math.max(1, Math.round((fresh.referral!.expiresAt - now) / 3_600_000))} hrs left` },
    visit && { o: visit, icon: CalendarClock, action: 'Home visit tomorrow, 11:30am' },
  ].filter((r): r is { o: Opportunity; icon: typeof PhoneCall; action: string } => !!r)
  if (!rows.length) return null
  return (
    <section aria-labelledby="referrals-today">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="referrals-today" className="flex items-center gap-2.5 text-xl font-semibold text-ink">
            Seller referrals from Revive
            <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{rows.length}</span>
          </h2>
          <p className="mt-1 text-[13px] text-muted">Homeowners Revive sent you that need you today.</p>
        </div>
        <Link to="/leads/referrals" className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-brand hover:underline">
          All referrals <ArrowRight className="size-4" />
        </Link>
      </div>
      <ul className="divide-y divide-[var(--brand-primary-border-subtle)] overflow-hidden rounded-2xl border border-[var(--brand-primary-border-subtle)] bg-white">
        {rows.map(({ o, icon: Icon, action }) => {
          const st = REFERRAL_STATUS[o.referral!.status]
          return (
            <li key={o.id}>
              <Link to={`/leads/referrals/${o.id}`} className="group flex flex-wrap items-center gap-x-5 gap-y-3 px-6 py-5 transition-colors hover:bg-head sm:flex-nowrap">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-[14px] text-ink">{initials(o.person?.name ?? o.property.address)}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="truncate text-[15.5px] font-medium text-[#1b2b4b]">{o.person?.name}</span>
                    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-[12.5px]', st.cls)}>
                      <st.icon className="size-3.5" /> {st.label}
                    </span>
                  </span>
                  <span className="truncate text-[13.5px] text-faint">
                    {o.property.address}, {o.property.city}
                  </span>
                </span>
                {/* the next step, sized to its text */}
                <span className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-head px-4 py-2.5 text-[14px] font-medium text-ink max-sm:basis-full">
                  <Icon className="size-4 text-brand" />
                  {action}
                </span>
                <ChevronRight className="hidden size-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:block" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
