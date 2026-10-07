import { AlarmClock, Eye, AlertCircle, Clock, Phone, Sparkles, TrendingUp, TriangleAlert, Warehouse } from 'lucide-react'
import { photoUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// Static examples of what each source unlocks, with sample data, shown before it's connected.

function Frame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="flex h-full flex-col rounded-xl border border-[var(--brand-primary-border-subtle)] bg-gradient-to-br from-[var(--brand-primary-subtle)] via-white to-[var(--brand-agent-subtle)]/60 p-3"
    >
      <p className="mb-2 flex items-center gap-1.5 px-0.5 text-[11.5px] font-medium text-ink-2" aria-hidden="true">
        <Eye className="size-3.5 text-brand" /> Example of what you’ll see
      </p>
      <div aria-hidden="true" className="pointer-events-none flex-1 select-none [&>*]:h-full">
        {children}
      </div>
    </div>
  )
}

function Metric({ label, value, className, icon: Icon }: { label: string; value: string; className?: string; icon?: typeof Clock }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <dt className="truncate text-[12px] text-muted">{label}</dt>
      <dd className={cn('flex items-center gap-1 text-[13px] font-semibold whitespace-nowrap text-ink tabular-nums', className)}>
        {Icon && <Icon className="size-3 shrink-0" />}
        {value}
      </dd>
    </div>
  )
}

/** One of your listings, read by Revive: days on market, value now, value after a Revive project. */
export function ListingExample() {
  return (
    <Frame label="Example: one of your listings, 47 days on market, valued at $1.18M now and $1.39M after a Revive project, a $210K upside with Renovate to Sell.">
      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        <div className="flex h-full flex-col gap-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <img src={photoUrl('comp-100-0')} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
            <span className="shrink-0 rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-medium text-ink-2">Your listing · MLS</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-ink">123 Main St</p>
            <p className="truncate text-[11.5px] text-muted">South Pasadena · 3 bd · 2 ba</p>
          </div>
          <dl className="divide-y divide-line rounded-lg bg-head px-2.5">
            <Metric label="On market" value="47 days" className="text-hot" icon={Clock} />
            <Metric label="Value now" value="$1.18M" />
            <Metric label="After Revive" value="$1.39M" className="text-[var(--green)]" icon={TrendingUp} />
          </dl>
          <p className="rounded-lg bg-[var(--brand-agent-subtle)] px-2.5 py-2 text-[12px] leading-4 text-ink-2">
            <span className="flex items-center gap-1 font-semibold text-[var(--brand-agent)]">
              <Sparkles className="size-3.5" /> +$210K upside
            </span>
            <span className="mt-0.5 block">with Renovate to Sell, and could sell ~3 weeks faster</span>
          </p>
          <div className="mt-auto flex items-center justify-between border-t border-line pt-2">
            <span className="truncate text-[11.5px] text-muted">1 price cut</span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--brand-agent-border)] bg-[var(--brand-agent-subtle)] px-2 py-1 text-[12px] font-semibold whitespace-nowrap text-[var(--brand-agent)]">
              <Sparkles className="size-3" /> Propose Revive
            </span>
          </div>
        </div>
      </div>
    </Frame>
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

/** A homeowner from your CRM, with why to call now. */
export function ContactExample() {
  return (
    <Frame label="Example: a homeowner from your CRM whose listing expired 23 days ago. Selling score 79, leaning toward selling, $148K potential. Opportunities: listing issue and ADU room. Call this week.">
      <div className="flex flex-col gap-2.5 rounded-lg border border-line bg-white p-3 shadow-card">
        <div className="flex items-start justify-between gap-2">
          <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-[14px] font-semibold text-brand">RK</span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[11px] font-semibold text-white">
            <AlarmClock className="size-3" /> Call this week
          </span>
        </div>
        <div className="-mt-1 min-w-0">
          <p className="truncate text-[14px] font-semibold text-ink">Rachel Kim</p>
          <p className="truncate text-[11.5px] text-muted">Homeowner · 655 Glenarm St</p>
        </div>

        <div className="rounded-lg bg-warn-soft/70 px-2.5 py-2">
          <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
            <AlertCircle className="size-3.5 shrink-0 text-warn" /> Listing expired 23 days ago
          </p>
          <p className="mt-0.5 pl-5 text-[12px] text-ink-2">Leaning toward selling · +$148K potential</p>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-line pt-2.5">
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">Selling score</p>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-2">
              <ScoreRing value={79} /> Medium
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">Expired</p>
            <p className="mt-2 text-[13px] font-semibold text-ink">23 days ago</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">Opportunities</p>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn">
              <TriangleAlert className="size-3" /> Listing issue
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--brand-agent-subtle)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--brand-agent)]">
              <Warehouse className="size-3" /> ADU room
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-2">
          <span className="text-[11.5px] text-muted">Called 2 mo ago</span>
          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--brand-primary-border)] bg-[var(--brand-primary-subtle)] px-2 py-1 text-[12px] font-semibold text-brand">
            <Phone className="size-3" /> Call
          </span>
        </div>
      </div>
    </Frame>
  )
}
