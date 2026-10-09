import { ArrowRight, CalendarClock, CircleDot, CircleX, Clock, MessageSquareDot, PhoneCall, Signature, UserRound, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// Seller referrals from Revive. Lead tracking shows only the ones that need the agent now (new, or waiting on
// an update to Revive); "View all" opens the referrals page with every referral and how they're converting.

export const REFERRAL_STATUS = {
  new: { label: 'New', icon: CircleDot, cls: 'border-hot-line bg-hot-soft text-hot-ink', body: 'Revive just sent you this homeowner. Reach out within 24 hours, while they’re expecting your call.' },
  claimed: { label: 'Scheduled', icon: Clock, cls: 'border-[#ffe4c6] bg-[#fffbeb] text-[#a95d05]', body: 'Get ready for the home visit. Review the listing details and prepare for your conversation with the homeowner.' },
  contacted: { label: 'Met', icon: UserRound, cls: 'border-[var(--brand-primary-border-subtle)] bg-[var(--brand-primary-subtle)] text-brand', body: 'Tell us how the home visit went so we can understand the opportunity and what happens next.' },
  listing: { label: 'Signed', icon: Signature, cls: 'border-[var(--brand-primary-border-subtle)] bg-[var(--brand-primary-subtle)] text-brand', body: 'You won the listing! Share your experience to help us learn what worked and improve the experience for agents.' },
  lost: { label: 'Unsuccessful', icon: CircleX, cls: 'border-[#fecaca] bg-bad-soft text-bad', body: 'Another agent won this listing. Share an update to help us understand what happened and learn from the opportunity.' },
} as const

/** How far each status got from referral to on market (a lost referral had the visit and the meeting). */
export const REACHED = { new: 0, claimed: 1, contacted: 2, lost: 2, listing: 3 } as const

/** The one thing to do now, short enough for the card's action box. */
const actionFor = (status: keyof typeof REFERRAL_STATUS, first: string) =>
  status === 'new'
    ? `Call ${first} within 24 hours. They’re expecting you.`
    : status === 'claimed'
      ? 'Prep for the home visit: review the listing details.'
      : status === 'contacted'
        ? 'Tell Revive how the home visit went.'
        : 'Share an update with Revive.'

/** New, or waiting on the agent's update: what Lead tracking leads with. */
export const needsAction = (o: Opportunity) => !!o.referral && ((o.referral.status === 'new' && !o.referral.claimedAt) || o.referral.needsUpdateNow)

const ago = (d: number) => (d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`)
const initials = (s: string) =>
  s
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')

/** `action`: the next step to show in the gray box instead of the default (e.g. the dashboard's countdown). */
export function ReferralCard({ o, action }: { o: Opportunity; action?: string }) {
  const r = o.referral!
  const st = REFERRAL_STATUS[r.status]
  const Icon = st.icon
  const ActionIcon = r.status === 'new' ? PhoneCall : r.status === 'claimed' ? CalendarClock : MessageSquareDot
  return (
    <Link
      to={`/leads/referrals/${o.id}`}
      className="group flex flex-col gap-5 rounded-[28px] border border-[var(--brand-primary-border-subtle)] bg-white p-6 transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.10)]"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-[14px] text-ink">{initials(o.person?.name ?? o.property.address)}</span>
          <span className={cn('inline-flex h-10 items-center gap-3 rounded-xl border pr-4 pl-3 text-[14px]', st.cls)}>
            <Icon className="size-4" /> {st.label}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[16px] font-medium text-[#1b2b4b]">{o.person?.name ?? o.property.address}</p>
          <p className="truncate text-[14px] text-faint">
            {o.property.address}, {o.property.city}
          </p>
        </div>
        {needsAction(o) ? (
          // what to do now, in the same gray strip as Lead activity; fixed height so cards line up
          <p className="flex min-h-[84px] items-start gap-2.5 rounded-xl bg-head px-3.5 py-3 text-[14px] leading-5 text-ink-2">
            <ActionIcon className="mt-0.5 size-4 shrink-0 text-brand" />
            <span className="line-clamp-3">{action ?? actionFor(r.status, o.person?.name.split(' ')[0] ?? 'the homeowner')}</span>
          </p>
        ) : (
          <p className="text-[14px] leading-5 text-ink-2">{st.body}</p>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 text-[14px] font-medium">
        <span className="text-ink-2">{ago(r.referredDaysAgo)}</span>
        <span className="flex items-center gap-2 text-brand">
          See details <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

export function SellerReferrals({ opps }: { opps: Opportunity[] }) {
  const now = opps.filter(needsAction)
  if (!opps.length) return null
  return (
    <section className="mt-8" aria-labelledby="referrals-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
            <UserRound className="size-4" />
          </span>
          <h2 id="referrals-title" className="text-xl font-semibold text-ink">
            Your seller referrals from Revive
          </h2>
          <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{now.length}</span>
        </div>
      </div>
      <p className="mt-1.5 mb-5 text-[13px] text-muted">These need you now. Keep their status current so Revive keeps sending you homeowners.</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {now.length ? (
          now.map((o) => <ReferralCard key={o.id} o={o} />)
        ) : (
          <p className="rounded-[28px] border border-dashed border-line px-6 py-5 text-[14px] text-muted sm:col-span-1 xl:col-span-3">You’re all caught up. Every referral is up to date with Revive.</p>
        )}
        {/* the way into every referral, as the last card in the row */}
        <Link
          to="/leads/referrals"
          className="group flex min-h-40 flex-col items-center justify-center gap-3 rounded-[28px] border border-[var(--brand-primary-border-subtle)] bg-[var(--brand-primary-subtle)] p-6 text-brand transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-border-subtle)]"
        >
          <Users className="size-5" />
          <span className="flex items-center gap-1.5 text-[16px] font-medium">
            View all {opps.length} referrals <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </section>
  )
}
