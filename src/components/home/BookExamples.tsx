import { AlarmClock, CircleDollarSign, Eye, UserRound, CircleAlert, Clock, Hammer, Home as HomeIcon, TrendingDown, TriangleAlert, Warehouse } from 'lucide-react'
import { photoUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// What each source brings in, shown with sample data before it's connected: the real card,
// slimmed down, under a banner that marks it as an example.
// Both cards read the same way: who or what → the one number that matters → why now →
// the Revive opportunities.

function Sample({ label, banner, children }: { label: string; banner: string; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card">
      {/* the banner says up front that this is an example, not real data */}
      <p
        aria-hidden="true"
        className="flex items-center gap-1.5 border-b border-line bg-line-soft px-4 py-2 text-[12px] font-semibold text-ink-2"
      >
        <Eye className="size-3.5 text-muted" /> {banner}
      </p>
      <div aria-hidden="true" className="flex flex-1 flex-col gap-4 p-4">
        {children}
      </div>
    </div>
  )
}

function Who({ img, round, name, sub, badge }: { img?: string; round?: boolean; name: string; sub: string; badge: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {img ? (
        <img src={img} alt="" className={cn('size-11 shrink-0 object-cover', round ? 'rounded-full' : 'rounded-lg')} />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-brand">
          <UserRound className="size-5" />
        </span>
      )}
      <div className="min-w-[6rem] flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{name}</p>
        <p className="text-[12px] leading-4 text-muted">{sub}</p>
      </div>
      {badge}
    </div>
  )
}

/** "Revive opportunities" and the tags under it. */
function Opportunities({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto border-t border-line pt-3">
      <p className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">Revive opportunities</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Tag({ icon: Icon, tone, children }: { icon: typeof Clock; tone: 'agent' | 'warn' | 'teal'; children: React.ReactNode }) {
  const tones = {
    agent: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]',
    warn: 'bg-warn-soft text-warn',
    teal: 'bg-[var(--teal-soft)] text-[var(--green)]',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium', tones[tone])}>
      <Icon className="size-3" /> {children}
    </span>
  )
}

/** Why now: one line, the reason behind the number. */
function Why({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[12.5px] leading-[18px] text-ink-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-hot" />
      <span>{children}</span>
    </p>
  )
}

/** One of your listings, read by Revive. */
export function ListingExample() {
  return (
    <Sample
      banner="Example of your listing"
      label="Example with sample data: one of your listings. Worth $1.39M after a Revive project, $210K more than today's $1.18M. 47 days on market with 1 price cut. Revive opportunities: Renovate to Sell, stale listing, more commission."
    >
      <Who
        img={photoUrl('comp-100-0')}
        name="123 Sample St"
        sub="Anytown, CA"
        badge={
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-medium text-ink-2">
            <HomeIcon className="size-3" /> Your listing
          </span>
        }
      />

      {/* the number that matters */}
      <div>
        <p className="text-[11.5px] text-muted">Value after Revive</p>
        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <span className="text-[26px] leading-8 font-semibold text-ink tabular-nums">$1.39M</span>
          <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[12px] font-semibold text-[var(--green)] tabular-nums">+$210K</span>
        </p>
        <p className="mt-0.5 text-[12px] text-muted tabular-nums">$1.18M today</p>
      </div>

      <Why icon={Clock}>47 days on market and 1 price cut. Comparable refreshed homes sold in about 3 weeks.</Why>

      <Opportunities>
        <Tag icon={Hammer} tone="agent">
          Renovate to Sell
        </Tag>
        <Tag icon={TrendingDown} tone="warn">
          Stale listing
        </Tag>
        <Tag icon={CircleDollarSign} tone="teal">
          More commission
        </Tag>
      </Opportunities>
    </Sample>
  )
}

function ScoreRing({ value }: { value: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--green)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} />
      </svg>
      <span className="relative text-[18px] font-semibold text-ink tabular-nums">{value}</span>
    </span>
  )
}

/** A homeowner from your CRM, with why to call now. */
export function ContactExample() {
  return (
    <Sample
      banner="Example of your contact"
      label="Example with sample data: a homeowner from your CRM. Selling score 79, likely to sell, with $148K potential. Their listing expired 23 days ago. Call this week. Revive opportunities: listing issue, ADU room, more commission."
    >
      <Who
        round
        name="Homeowner"
        sub="Anytown, CA"
        badge={
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[11px] font-semibold text-white">
            <AlarmClock className="size-3" /> Call this week
          </span>
        }
      />

      {/* the number that matters */}
      <div className="flex items-center gap-3">
        <ScoreRing value={79} />
        <div>
          <p className="text-[11.5px] text-muted">Selling score</p>
          <p className="text-[15px] leading-5 font-semibold text-ink">Likely to sell</p>
          <p className="text-[12px] text-muted">
            <span className="font-semibold text-[var(--green)]">+$148K</span> potential with Revive
          </p>
        </div>
      </div>

      <Why icon={CircleAlert}>Their listing expired 23 days ago, and they’re leaning toward selling.</Why>

      <Opportunities>
        <Tag icon={TriangleAlert} tone="warn">
          Listing issue
        </Tag>
        <Tag icon={Warehouse} tone="agent">
          ADU room
        </Tag>
        <Tag icon={CircleDollarSign} tone="teal">
          More commission
        </Tag>
      </Opportunities>
    </Sample>
  )
}
