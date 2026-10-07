import { AlarmClock, Phone, CircleDollarSign, Eye, UserRound, CircleAlert, Clock, Hammer, TrendingDown, TriangleAlert, Warehouse } from 'lucide-react'
import { photoUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// What each source brings in, shown with sample data before it's connected, under a label that
// marks it as an example. Sits on the source's tinted panel: listings as a stack of cards, the
// contact as one card.
// Both cards read the same way: who or what → the one number that matters → why now →
// the Revive opportunities.

function Sample({ label, banner, cards = false, children }: { label: string; banner: string; cards?: boolean; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} className="flex h-full flex-col gap-2.5">
      {/* the label says up front that this is an example, not real data */}
      <p aria-hidden="true" className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
        <Eye className="size-3.5 text-muted" /> {banner}
      </p>
      {/* either the items are cards themselves, or the content sits on one white card */}
      <div aria-hidden="true" className={cn('flex flex-1 flex-col', cards ? 'gap-2.5' : 'gap-4 overflow-hidden rounded-xl border border-white bg-white p-4 shadow-card')}>
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

function Tag({ icon: Icon, tone, small = false, children }: { icon: typeof Clock; tone: 'agent' | 'warn' | 'teal'; small?: boolean; children: React.ReactNode }) {
  const tones = {
    agent: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]',
    warn: 'bg-warn-soft text-warn',
    teal: 'bg-[var(--teal-soft)] text-[var(--green)]',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap', small ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-[11.5px]', tones[tone])}>
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

const LISTINGS = [
  { photo: 'comp-100-0', address: '123 Sample St', days: 47, after: '$1.39M', gain: '+$210K', tag: { icon: Hammer, tone: 'agent', text: 'Renovate to Sell' } },
  { photo: 'comp-111-2', address: '456 Example Ave', days: 63, after: '$1.81M', gain: '+$290K', tag: { icon: TrendingDown, tone: 'warn', text: 'Stale listing' } },
  { photo: 'comp-104-0', address: '789 Sample Ln', days: 21, after: '$965K', gain: '+$95K', tag: { icon: CircleDollarSign, tone: 'teal', text: 'More commission' } },
] as const

/** Your listings, read by Revive: a list, ranked by upside. */
export function ListingExample() {
  return (
    <Sample
      cards
      banner="Example of your listings"
      label="Example with sample data: three of your listings with the value Revive could add. 123 Sample St, $1.39M after Revive, up $210K, Renovate to Sell. 456 Example Ave, $1.81M, up $290K, stale listing. 789 Sample Ln, $965K, up $95K, more commission. $595K potential across 3 listings."
    >
      <ul className="@container flex flex-1 flex-col gap-2.5">
        {LISTINGS.map((l) => (
          <li key={l.address} className="flex flex-1 flex-col justify-center gap-2 rounded-xl border border-white bg-white px-3.5 py-3 shadow-card">
            <div className="flex items-center gap-3">
              <img src={photoUrl(l.photo)} alt="" className="hidden size-10 shrink-0 rounded-lg object-cover @[18rem]:block" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink">{l.address}</p>
                <p className={cn('text-[11.5px] tabular-nums', l.days > 30 ? 'text-hot' : 'text-muted')}>{l.days} days on market</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[14px] font-semibold text-ink tabular-nums">{l.after}</p>
                <p className="text-[11.5px] font-semibold text-[var(--green)] tabular-nums">{l.gain}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Tag icon={l.tag.icon} tone={l.tag.tone} small>
                {l.tag.text}
              </Tag>
              <span className="text-[10.5px] whitespace-nowrap text-muted">after Revive</span>
            </div>
          </li>
        ))}
      </ul>
      <p className="flex flex-wrap items-center justify-between gap-x-2 px-1 text-[12.5px] text-ink-2">
        <span className="whitespace-nowrap">3 Revive opportunities</span>
        <span className="font-semibold whitespace-nowrap text-[var(--green)] tabular-nums">+$595K potential</span>
      </p>
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

      <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 border-t border-line bg-head px-4 py-2.5">
        <span className="text-[12.5px] text-ink-2">Called 2 mo ago</span>
        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--brand-primary-border)] bg-white px-2.5 py-1 text-[12.5px] font-semibold text-brand">
          <Phone className="size-3.5" /> Call
        </span>
      </div>
    </Sample>
  )
}
