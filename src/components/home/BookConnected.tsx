import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { UrgencyTag } from '@/components/opportunity/Tags'
import { Button } from '@/components/ui/button'
import { photoUrl } from '@/lib/assets'
import { gain, money, plural } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { IMPORT_MS } from './ConnectBook'

// What a source panel on Home shows once the agent connects it: the import, step by step, then
// the real insights in place of the example, with the way into Opportunities.

const STEPS = {
  mls: {
    title: 'Pulling in your listings',
    body: 'We’re finding your listings and preparing personalized insights to help you sell faster and maximize value.',
    steps: ['Matching your license in the DRE record', 'Pulling your active listings from the MLS', 'Reading days on market and price history', 'Estimating value after a Revive project', 'Preparing your personalized insights'],
  },
  crm: {
    title: 'Pulling in your contacts',
    body: 'We’re reading your contacts and preparing personalized insights on who’s likely to sell or renovate.',
    steps: ['Connecting to your CRM', 'Importing contacts with a home address', 'Matching each home to public records', 'Scoring who’s likely to sell', 'Preparing your personalized insights'],
  },
}

/** The import in progress: each step checks off in turn. */
export function ImportProgress({ kind, at, from }: { kind: 'mls' | 'crm'; at: number; from?: string }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 150)
    return () => clearInterval(t)
  }, [])
  const s = STEPS[kind]
  const steps = from ? [`Connecting to ${from}`, ...s.steps.slice(1)] : s.steps
  const per = IMPORT_MS / steps.length
  const current = Math.min(steps.length - 1, Math.floor((now - at) / per))
  const pct = Math.min(100, ((now - at) / IMPORT_MS) * 100)
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col rounded-xl border border-white bg-white p-5 shadow-card">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Loader2 className="size-4 animate-spin text-brand" /> {s.title}
      </p>
      <p className="mt-1.5 text-[13px] leading-5 text-ink-2">{s.body}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line-soft" aria-hidden="true">
        <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-agent)] transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-5 flex flex-col gap-3">
        {steps.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={label} className={cn('flex items-center gap-2.5 text-[13.5px] transition-colors', done ? 'text-ink' : active ? 'font-medium text-ink' : 'text-faint')}>
              <span
                className={cn(
                  'grid size-5 shrink-0 place-items-center rounded-full border',
                  done ? 'border-[var(--green)] bg-[var(--green)] text-white' : active ? 'border-brand text-brand' : 'border-line text-transparent',
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : active ? <Loader2 className="size-3 animate-spin" /> : null}
              </span>
              {label}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function SeeOpportunities({ count }: { count: number }) {
  return (
    <div className="flex justify-end">
      <Button asChild className="h-10">
        <Link to="/opportunities">
          See my opportunities{count ? ` (${count})` : ''} <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}

/** The agent's real listings, read by Revive. */
export function ListingInsights({ opps }: { opps: Opportunity[] }) {
  const rows = opps.filter((o) => o.property.source === 'listings')
  const total = rows.reduce((n, o) => n + (o.gain || 0), 0)
  return (
    <>
      <div className="flex flex-1 flex-col gap-2.5">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--green)]">
          <Check className="size-3.5" /> {plural(rows.length, 'active listing')} found
        </p>
        <ul className="flex flex-col gap-2.5">
          {rows.map((o) => {
            const dom = o.property.facts.daysOnMarket
            return (
              <li key={o.id}>
                <Link to={`/property/${o.id}?tab=report`} className="flex items-center gap-3 rounded-xl border border-white bg-white px-3 py-2.5 shadow-card hover:shadow-md">
                  <img src={o.photo ?? photoUrl(o.property.photo)} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">{o.property.address}</p>
                      {o.product && <span className="rounded-md bg-[var(--brand-agent-subtle)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--brand-agent)]">{o.product}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
                      <p className={cn('text-[11.5px] whitespace-nowrap tabular-nums', dom && dom > 30 ? 'text-hot' : 'text-muted')}>
                        {dom ? `${dom} days on market` : o.reasons[0]}
                      </p>
                      <p className="text-[11.5px] whitespace-nowrap text-muted tabular-nums">
                        <span className="text-[13px] font-semibold text-ink">{money(o.property.valueNow + (o.gain || 0))}</span>{' '}
                        {o.gain ? <span className="font-semibold text-[var(--green)]">{gain(o.gain)}</span> : null}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
        {total > 0 && (
          <p className="flex flex-wrap items-center justify-between gap-x-2 px-1 text-[12.5px] text-ink-2">
            <span>{plural(rows.filter((o) => o.gain).length, 'Revive opportunity', 'Revive opportunities')}</span>
            <span className="font-semibold text-[var(--green)] tabular-nums">{gain(total)} potential</span>
          </p>
        )}
      </div>
      <SeeOpportunities count={rows.length} />
    </>
  )
}

/** The homeowners in the agent's CRM worth a call first. */
export function ContactInsights({ opps }: { opps: Opportunity[] }) {
  const all = opps.filter((o) => o.property.source === 'contacts')
  const rows = all.filter((o) => o.person).slice(0, 4)
  return (
    <>
      <div className="flex flex-1 flex-col gap-2.5">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--green)]">
          <Check className="size-3.5" /> {plural(all.length, 'contact')} checked · who to call first
        </p>
        <ul className="flex flex-col gap-2.5">
          {rows.map((o) => (
            <li key={o.id}>
              <Link to={`/person/${o.person!.id}`} className="flex items-start gap-3 rounded-xl border border-white bg-white px-3 py-2.5 shadow-card hover:shadow-md">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-[12.5px] font-semibold text-brand">
                  {o.person!.name
                    .split(' ')
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <p className="truncate text-[13.5px] font-semibold text-ink">{o.person!.name}</p>
                    <UrgencyTag urgency={o.urgency} />
                  </div>
                  <p className="truncate text-[11.5px] text-muted">
                    {o.property.address}
                    {o.gain ? ` · ${gain(o.gain)} with Revive` : ''}
                  </p>
                  {o.reasons[0] && <p className="mt-0.5 truncate text-[12px] text-ink-2">{o.reasons[0]}</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <SeeOpportunities count={all.length} />
    </>
  )
}
