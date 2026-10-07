import { AlarmClock, AlertCircle, Clock, Home as HomeIcon, Phone, Sparkles, TrendingUp, TriangleAlert, Warehouse } from 'lucide-react'
import rachel from '@/assets/avatar-rachel.jpg'
import { photoUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// What each source brings in, shown with sample data before it's connected. One surface each
// (no card inside a card). Three treatments to compare, switched from the demo bar:
//   flat   · the real card, slimmed down, with a dashed edge that marks it as a sample
//   promo  · a tinted tile that leads with the headline number, like an ad for the feature
//   teaser · the real card fading out under an "Example" label, a peek at what's coming

export type ExampleStyle = 'flat' | 'promo' | 'teaser'

const LISTING_LABEL =
  'Example: one of your listings, 47 days on market, valued at $1.18M now and $1.39M after a Revive project, a $210K upside with Renovate to Sell.'
const CONTACT_LABEL =
  'Example: Rachel Kim, a homeowner from your CRM whose listing expired 23 days ago. Selling score 79, leaning toward selling, $148K potential. Opportunities: listing issue and ADU room. Call this week.'

function ExampleTag({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-muted uppercase', className)}>
      <Sparkles className="size-3 text-[var(--brand-agent)]" /> Example
    </span>
  )
}

function Who({ img, round, name, sub, badge }: { img: string | undefined; round?: boolean; name: string; sub: string; badge: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <img src={img} alt="" className={cn('size-11 shrink-0 object-cover', round ? 'rounded-full' : 'rounded-lg')} />
      <div className="min-w-[6rem] flex-1">
        <p className="truncate text-[14px] font-semibold text-ink">{name}</p>
        <p className="text-[12px] leading-4 text-muted">{sub}</p>
      </div>
      {badge}
    </div>
  )
}

const listingBadge = (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-medium text-ink-2">
    <HomeIcon className="size-3" /> Your listing
  </span>
)
const contactBadge = (
  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[11px] font-semibold text-white">
    <AlarmClock className="size-3" /> Call this week
  </span>
)

function Row({ label, value, className, icon: Icon }: { label: string; value: string; className?: string; icon?: typeof Clock }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <dt className="truncate text-[12.5px] text-muted">{label}</dt>
      <dd className={cn('flex items-center gap-1 text-[13px] font-semibold whitespace-nowrap text-ink tabular-nums', className)}>
        {Icon && <Icon className="size-3 shrink-0" />}
        {value}
      </dd>
    </div>
  )
}

function ScoreRing({ value }: { value: number }) {
  const r = 13
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid size-8 shrink-0 place-items-center">
      <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
        <circle cx="16" cy="16" r={r} fill="none" stroke="var(--line)" strokeWidth="3" />
        <circle cx="16" cy="16" r={r} fill="none" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} />
      </svg>
      <span className="relative text-[11px] font-semibold text-ink tabular-nums">{value}</span>
    </span>
  )
}

/* ---------- the card content, shared by flat and teaser ---------- */

function ListingContent() {
  return (
    <>
      <Who img={photoUrl('comp-100-0')} name="123 Main St" sub="South Pasadena" badge={listingBadge} />
      <dl className="divide-y divide-line">
        <Row label="On market" value="47 days" className="text-hot" icon={Clock} />
        <Row label="Value now" value="$1.18M" />
        <Row label="After Revive" value="$1.39M" className="text-[var(--green)]" icon={TrendingUp} />
      </dl>
      <p className="flex items-start gap-1.5 text-[12.5px] leading-[18px] text-ink-2">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[var(--brand-agent)]" />
        <span>
          <span className="font-semibold text-[var(--brand-agent)]">+$210K upside</span> with Renovate to Sell, and could sell ~3 weeks faster
        </span>
      </p>
    </>
  )
}

function ContactContent() {
  return (
    <>
      <Who img={rachel} round name="Rachel Kim" sub="655 Glenarm St" badge={contactBadge} />
      <div className="rounded-lg bg-warn-soft/70 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
          <AlertCircle className="size-3.5 shrink-0 text-warn" /> Listing expired 23 days ago
        </p>
        <p className="mt-0.5 pl-5 text-[12px] text-ink-2">Leaning toward selling · +$148K potential</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[12px] text-ink-2">
          <ScoreRing value={79} /> Selling score
        </p>
        <div className="flex flex-wrap gap-1">
          <span className="inline-flex items-center gap-1 rounded-md bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn">
            <TriangleAlert className="size-3" /> Listing issue
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-[var(--brand-agent-subtle)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--brand-agent)]">
            <Warehouse className="size-3" /> ADU room
          </span>
        </div>
      </div>
    </>
  )
}

/* ---------- A · flat ---------- */

function Flat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} className="relative flex h-full flex-col rounded-xl border border-dashed border-[var(--brand-primary-border)] bg-white p-4 pt-5">
      <ExampleTag className="absolute -top-2.5 left-3 border border-[var(--brand-primary-border)]" />
      <div aria-hidden="true" className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  )
}

/* ---------- B · promo ---------- */

function Promo({
  label,
  eyebrow,
  headline,
  line,
  img,
  round,
  chips,
}: {
  label: string
  eyebrow: string
  headline: React.ReactNode
  line: string
  img: string | undefined
  round?: boolean
  chips: React.ReactNode
}) {
  return (
    <div role="img" aria-label={label} className="flex h-full flex-col rounded-xl bg-gradient-to-br from-[var(--brand-primary-subtle)] via-[#f6f2fb] to-[var(--brand-agent-subtle)] p-5">
      <div aria-hidden="true" className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[11px] font-semibold tracking-wide text-[var(--brand-primary)] uppercase">{eyebrow}</p>
          <ExampleTag className="shrink-0 shadow-sm" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <img src={img} alt="" className={cn('size-14 shrink-0 object-cover shadow-md ring-[3px] ring-white', round ? 'rounded-full' : 'rounded-xl')} />
          <div className="min-w-0">{headline}</div>
        </div>
        <p className="mt-3 text-[13px] leading-5 text-ink-2">{line}</p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-4">{chips}</div>
      </div>
    </div>
  )
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-medium text-ink-2 shadow-sm', className)}>{children}</span>
}

/* ---------- C · teaser ---------- */

function Teaser({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} className="relative h-[244px] overflow-hidden">
      <div aria-hidden="true" className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4 shadow-card">
        {children}
      </div>
      {/* the card fades into the page; the label sits on the fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-end justify-center bg-gradient-to-b from-transparent via-white/90 to-white pb-1" aria-hidden="true">
        <ExampleTag className="border border-line shadow-sm" />
      </div>
    </div>
  )
}

/* ---------- the two examples ---------- */

export function ListingExample({ style }: { style: ExampleStyle }) {
  if (style === 'promo')
    return (
      <Promo
        label={LISTING_LABEL}
        eyebrow="From your listings"
        img={photoUrl('comp-100-0')}
        headline={
          <>
            <p className="text-[clamp(20px,1.9vw,26px)] leading-8 font-semibold whitespace-nowrap text-[var(--brand-agent)]">+$210K</p>
            <p className="truncate text-[12.5px] font-medium text-ink">upside on 123 Main St</p>
          </>
        }
        line="Sitting 47 days on market. Renovate to Sell could get it to $1.39M, ~3 weeks faster."
        chips={
          <>
            <Chip className="text-hot">
              <Clock className="size-3" /> 47 days on market
            </Chip>
            <Chip className="text-[var(--green)]">
              <TrendingUp className="size-3" /> $1.18M → $1.39M
            </Chip>
          </>
        }
      />
    )
  if (style === 'teaser')
    return (
      <Teaser label={LISTING_LABEL}>
        <ListingContent />
      </Teaser>
    )
  return (
    <Flat label={LISTING_LABEL}>
      <ListingContent />
    </Flat>
  )
}

export function ContactExample({ style }: { style: ExampleStyle }) {
  if (style === 'promo')
    return (
      <Promo
        label={CONTACT_LABEL}
        eyebrow="From your contacts"
        img={rachel}
        round
        headline={
          <>
            <p className="text-[clamp(20px,1.9vw,26px)] leading-8 font-semibold whitespace-nowrap text-[var(--brand-primary)]">Call Rachel</p>
            <p className="truncate text-[12.5px] font-medium text-ink">this week · 655 Glenarm St</p>
          </>
        }
        line="Her listing expired 23 days ago and she’s leaning toward selling, with +$148K potential."
        chips={
          <>
            <Chip>
              <span className="font-semibold text-[var(--green)] tabular-nums">79</span> selling score
            </Chip>
            <Chip className="text-warn">
              <TriangleAlert className="size-3" /> Listing issue
            </Chip>
            <Chip className="text-[var(--brand-agent)]">
              <Warehouse className="size-3" /> ADU room
            </Chip>
          </>
        }
      />
    )
  if (style === 'teaser')
    return (
      <Teaser label={CONTACT_LABEL}>
        <ContactContent />
        <div className="flex items-center justify-between border-t border-line pt-2">
          <span className="text-[11.5px] text-muted">Called 2 mo ago</span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand">
            <Phone className="size-3" /> Call
          </span>
        </div>
      </Teaser>
    )
  return (
    <Flat label={CONTACT_LABEL}>
      <ContactContent />
    </Flat>
  )
}
