import { Mail, MailCheck } from 'lucide-react'
import { useState } from 'react'
import { img, LeadStrip, OutreachStrip, Ring, ScoreCell, TagPill, tagsOf, useAttention, useLeadSignal } from '@/components/home/TopOpportunities'
import { firstName, gain, money } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { MessageDialog } from './MessageDialog'

// The Opportunities list as a table, like the Contacts page: who and why now, selling score, value
// with the Revive upside, what Revive spotted, and a message button. The bar on the left says how soon.

// narrow (the list is half the page): the score is just its ring; wide: ring and label
const SOURCE: Record<string, string> = { listings: 'MLS listing', contacts: 'Contact', leadform: 'Lead form', revive: 'Revive lead', search: 'Report' }

const COLS = 'grid grid-cols-[minmax(0,1fr)_64px_76px_118px_40px] @[720px]:grid-cols-[minmax(0,1.7fr)_minmax(124px,1fr)_minmax(80px,0.7fr)_minmax(124px,1fr)_40px] items-center gap-x-3'

/** The score column when space is tight: the ring alone, or for a listing the Listed badge and days on market. */
function ScoreCompact({ o }: { o: Opportunity }) {
  const dom = o.property.facts.daysOnMarket
  if (o.property.source === 'listings' && dom !== undefined)
    return (
      <div className="flex flex-col items-start gap-0.5">
        <span className="rounded-md bg-[var(--brand-primary-subtle)] px-1.5 py-0.5 text-[11px] font-semibold text-brand">Listed</span>
        <span className={cn('text-[11.5px] tabular-nums', dom > 30 ? 'font-medium text-hot' : 'text-muted')}>{dom} DOM</span>
      </div>
    )
  const score = o.person?.sellScore
  if (score === undefined) return <span className="text-[12px] text-muted">—</span>
  return (
    <span title={`Selling score ${score}`}>
      <Ring value={score} pct={score / 100} color={score >= 80 ? 'var(--green)' : score >= 60 ? 'var(--teal)' : 'var(--amber)'} />
    </span>
  )
}
const WHY: Record<string, string> = { now: 'text-brand', soon: 'text-navy' }

function Row({ o, onOpen, active, onHover }: { o: Opportunity; onOpen: () => void; active: boolean; onHover: (on: boolean) => void }) {
  const out = useDemo((s) => s.outreach[o.id])
  const [msg, setMsg] = useState(false)
  const waiting = !!out?.reply && !out.answeredAt
  const signal = useLeadSignal(o)
  const attention = useAttention(o)
  const tags = tagsOf(o)
  const listing = o.property.source === 'listings'
  return (
    <li
      id={`opp-${o.id}`}
      className={cn(
        'relative border-b border-line-soft',
        attention === 'reply' && 'my-2 rounded-xl border border-[var(--brand-primary-border)] bg-white shadow-card ring-1 ring-[var(--brand-primary-border)]',
        active && 'bg-[var(--brand-primary-subtle)]/60',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${o.person?.name ?? o.property.address}`}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        className={cn(COLS, 'cursor-pointer py-3 pr-2 pl-4 hover:bg-head/70')}
      >
        <div className="flex min-w-0 items-center gap-3">
          <img src={img(o)} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="flex min-w-0 items-center gap-1.5">
              {/* your listing reads as the home; a contact reads as the person */}
              <span className="truncate text-[14.5px] font-semibold text-ink" title={listing ? o.person?.name : o.property.address}>
                {listing ? o.property.address : (o.person?.name ?? o.property.address)}
              </span>
              <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold whitespace-nowrap', listing ? 'bg-[var(--brand-primary-subtle)] text-brand' : 'bg-head text-ink-2')}>
                {SOURCE[o.property.source]}
              </span>
            </p>
            <p className={cn('line-clamp-2 text-[12.5px] leading-[1.35] font-medium', WHY[o.urgency] ?? 'text-muted')}>{o.reasons[0]}</p>
          </div>
        </div>
        <div>
          <div className="@[720px]:hidden">
            <ScoreCompact o={o} />
          </div>
          <div className="hidden @[720px]:block">
            <ScoreCell o={o} />
          </div>
        </div>
        <div className="tabular-nums">
          <p className="text-[15px] font-bold text-ink">{money(o.property.valueNow)}</p>
          {o.gain > 0 && <p className="text-[12.5px] font-semibold text-[var(--green)]">{gain(o.gain)}</p>}
        </div>
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          {tags.length ? tags.map((t) => <TagPill key={t} tag={t} />) : <span className="rounded-lg border border-dashed border-line px-2 py-1 text-[12px] text-muted">None right now</span>}
        </div>
        {o.person ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMsg(true)
            }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`Message ${o.person.name}`}
            title={`Message ${firstName(o.person.name)}`}
            className="relative grid size-10 place-items-center rounded-xl border border-line bg-white text-brand transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-subtle)]"
          >
            {out ? <MailCheck className="size-[18px]" /> : <Mail className="size-[18px]" />}
            {waiting && <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-white bg-[var(--brand-primary)]" aria-label="New reply" />}
          </button>
        ) : (
          <span />
        )}
      </div>
      {out ? (
        <div className="grid pr-2 pb-3 pl-4">
          <OutreachStrip o={o} out={out} onReply={() => setMsg(true)} />
        </div>
      ) : (
        signal && (
          <div className="grid pr-2 pb-3 pl-4">
            <LeadStrip o={o} text={signal} onMessage={() => setMsg(true)} />
          </div>
        )
      )}
      {o.person && msg && <MessageDialog o={o} open={msg} onOpenChange={setMsg} />}
    </li>
  )
}

export function OppTable({ opps, onOpen, hover, onHover }: { opps: Opportunity[]; onOpen: (id: string) => void; hover: string | null; onHover: (id: string | null) => void }) {
  return (
    <div className="@container">
      <div className={cn(COLS, 'sticky top-0 z-10 rounded-xl border border-line bg-head py-2.5 pr-2 pl-4 text-[11.5px] font-semibold tracking-wide text-muted uppercase')}>
        <span>Home</span>
        <span>
          <span className="@[720px]:hidden">Score</span>
          <span className="hidden @[720px]:inline">Selling score</span>
        </span>
        <span>Value</span>
        <span>Opportunities</span>
        <span />
      </div>
      <ul>
        {opps.map((o) => (
          <Row key={o.id} o={o} onOpen={() => onOpen(o.id)} active={hover === o.id} onHover={(on) => onHover(on ? o.id : null)} />
        ))}
      </ul>
    </div>
  )
}
