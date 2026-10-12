import { Mail, Map as MapIcon, Reply } from 'lucide-react'
import { useState } from 'react'
import { img, useAttention } from '@/components/home/TopOpportunities'
import { firstName, gain, money } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { MessageDialog } from './MessageDialog'

// The Opportunities list, built to scan: one line per home in fixed columns (who, why now, score, value,
// Revive upside, next step). Lead activity stays in the details drawer instead of opening under rows;
// a row waiting on the agent gets a blue edge and says so in the "Why now" column. The map button
// opens that home's comps.

const COLS = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 lg:grid-cols-[minmax(190px,1fr)_minmax(0,1.3fr)_52px_92px_auto]'
const SOURCE: Record<string, string> = { contacts: 'Contact', leadform: 'Lead form', market: 'Nearby listing' }

function Score({ o }: { o: Opportunity }) {
  const f = o.property.facts
  if (o.property.source === 'market')
    return <span className="rounded-md bg-warn-soft px-1.5 py-0.5 text-[11.5px] font-semibold text-warn">{f.expiredDaysAgo !== undefined ? 'Expired' : 'Withdrawn'}</span>
  const s = o.person?.sellScore
  if (s === undefined) return <span className="text-[13px] text-muted">—</span>
  return (
    <span title="Selling score" className={cn('inline-grid h-7 min-w-9 place-items-center rounded-full px-2 text-[13px] font-semibold tabular-nums', s >= 80 ? 'bg-ok-soft text-[var(--green)]' : s >= 60 ? 'bg-[var(--teal-soft)]/40 text-[#0b7a69]' : 'bg-warn-soft text-warn')}>
      {s}
    </span>
  )
}

function Row({ o, onOpen, onComps, active, onHover }: { o: Opportunity; onOpen: () => void; onComps: () => void; active: boolean; onHover: (on: boolean) => void }) {
  const attention = useAttention(o)
  const [msg, setMsg] = useState(false)
  const name = o.person ? firstName(o.person.name) : null
  const why = attention === 'reply' ? `${name ?? 'They'} replied, waiting on you` : o.reasons[0]
  const sub = attention === 'reply' ? undefined : o.reasons[1]
  const action = attention === 'reply' ? { label: 'Reply', icon: Reply, primary: true } : o.person ? { label: attention ? 'Follow up' : 'Email', icon: Mail, primary: !!attention } : { label: 'Reach out', icon: Mail, primary: false }
  const Icon = action.icon
  return (
    <li
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={cn('relative border-b border-line-soft last:border-b-0', attention ? 'bg-[var(--brand-primary-subtle)]/50' : active ? 'bg-head/60' : 'hover:bg-head/50')}
    >
      {attention && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--brand-primary)]" aria-hidden="true" />}
      <div className={cn(COLS, 'py-2.5 pr-3 pl-4')}>
        <button onClick={onOpen} className="flex min-w-0 items-center gap-3 text-left">
          <img src={img(o)} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
          <span className="min-w-0">
            <span className="block truncate text-[14px] font-semibold text-ink">{o.person?.name ?? o.property.address}</span>
            <span className="block truncate text-[12.5px] text-muted">
              {o.person ? o.property.address : o.property.city} · {SOURCE[o.property.source] ?? 'Contact'}
            </span>
          </span>
        </button>
        <button onClick={onOpen} className="hidden min-w-0 text-left lg:block" title={[why, sub].filter(Boolean).join(' · ')}>
          <span className={cn('block truncate text-[13px]', attention ? 'font-semibold text-brand' : 'font-medium text-ink')}>{why}</span>
          {sub && <span className="block truncate text-[12px] text-muted">{sub}</span>}
        </button>
        <span className="hidden lg:block">
          <Score o={o} />
        </span>
        <span className="hidden tabular-nums lg:block">
          <span className="block text-[14px] font-semibold text-ink">{money(o.property.valueNow)}</span>
          <span className="block text-[12.5px] font-semibold text-[var(--green)]">{o.gain > 0 ? gain(o.gain) : '—'}</span>
        </span>
        <span className="flex items-center justify-end gap-1.5">
          <button onClick={onComps} title="Comps on a map" aria-label={`Comps near ${o.property.address}`} className="grid size-8 place-items-center rounded-lg border border-line bg-white text-brand hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-subtle)]">
            <MapIcon className="size-4" />
          </button>
          <button
            onClick={() => (o.person ? setMsg(true) : onOpen())}
            className={cn('inline-flex h-8 w-[104px] items-center justify-center gap-1.5 rounded-lg text-[12.5px] font-medium', action.primary ? 'bg-[var(--brand-primary)] text-white hover:opacity-90' : 'border border-line bg-white text-ink hover:border-[var(--brand-primary-border)]')}
          >
            <Icon className="size-3.5" /> {action.label}
          </button>
        </span>
      </div>
      {o.person && msg && <MessageDialog o={o} open={msg} onOpenChange={setMsg} />}
    </li>
  )
}

export function ScanTable({ opps, onOpen, onComps, hover, onHover }: { opps: Opportunity[]; onOpen: (id: string) => void; onComps: (id: string) => void; hover: string | null; onHover: (id: string | null) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className={cn(COLS, 'sticky top-0 z-10 hidden border-b border-line bg-head py-2 pr-3 pl-4 text-[11.5px] font-semibold tracking-wide text-muted uppercase lg:grid')}>
        <span>Home</span>
        <span>Why now</span>
        <span>Score</span>
        <span>Value · upside</span>
        <span className="w-[146px]" />
      </div>
      <ul>
        {opps.map((o) => (
          <Row key={o.id} o={o} active={hover === o.id} onHover={(on) => onHover(on ? o.id : null)} onOpen={() => onOpen(o.id)} onComps={() => onComps(o.id)} />
        ))}
      </ul>
    </div>
  )
}
