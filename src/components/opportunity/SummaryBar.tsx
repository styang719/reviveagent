import { ArrowRight, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

// The row above the Opportunities list: the few numbers that matter and the filters. Three treatments
// to compare (A: the numbers are the filters, B: a quiet toolbar, C: a number strip over text tabs).

export interface FilterOpt {
  k: string
  label: string
  n: number
}
export interface Metric {
  value: string
  label: string
  filter?: string // clicking it filters the list
  onClick?: () => void // or opens something (the value breakdown)
  green?: boolean
}
export interface BarProps {
  filters: FilterOpt[]
  filter: string
  setFilter: (k: string) => void
  metrics: Metric[]
  sort: React.ReactNode // the sort control
  primary?: number // how many filters show before "More" (B)
}

export type BarStyle = 'stats' | 'toolbar' | 'strip'
export const BAR_STYLES: { k: BarStyle; label: string }[] = [
  { k: 'stats', label: 'A · Stats as filters' },
  { k: 'toolbar', label: 'B · Quiet toolbar' },
  { k: 'strip', label: 'C · Number strip' },
]

/** Filters that don't fit, in a small menu. */
function More({ opts, filter, setFilter, label = 'More' }: { opts: FilterOpt[]; filter: string; setFilter: (k: string) => void; label?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  if (!opts.length) return null
  const active = opts.find((o) => o.k === filter)
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-medium', active ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] text-brand' : 'border-line bg-white text-ink-2 hover:text-ink')}
      >
        <SlidersHorizontal className="size-3.5" /> {active ? active.label : label} <ChevronDown className="size-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-line bg-white p-1 shadow-[0_12px_32px_rgba(28,46,88,0.14)]">
          {opts.map((o) => (
            <button
              key={o.k}
              onClick={() => (setFilter(o.k === filter ? 'all' : o.k), setOpen(false))}
              className={cn('flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px]', o.k === filter ? 'bg-[var(--brand-primary-subtle)] font-semibold text-brand' : 'text-ink hover:bg-head')}
            >
              {o.label} <span className="text-[12px] text-muted tabular-nums">{o.n}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** A · the numbers are the filters: click one to see those homes; the rest sit under "More". */
function Stats({ filters, filter, setFilter, metrics, sort }: BarProps) {
  const used = new Set(metrics.map((m) => m.filter).filter(Boolean))
  const rest = filters.filter((f) => f.k !== 'all' && !used.has(f.k) && f.n > 0)
  return (
    <div className="flex flex-wrap items-stretch justify-between gap-3">
      <div className="flex flex-wrap items-stretch gap-2">
        {metrics.map((m) => {
          const on = !!m.filter && filter === m.filter
          return (
            <button
              key={m.label}
              onClick={() => (m.filter ? setFilter(on ? 'all' : m.filter) : m.onClick?.())}
              aria-pressed={m.filter ? on : undefined}
              className={cn('flex items-baseline gap-2 rounded-xl border px-3.5 py-2 text-left transition-colors', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)]' : 'border-line bg-white hover:border-[var(--brand-primary-border)]')}
            >
              <span className={cn('text-[18px] font-semibold tabular-nums', m.green ? 'text-[var(--green)]' : 'text-ink')}>{m.value}</span>
              <span className="text-[12.5px] text-muted">{m.label}</span>
              {m.onClick && <ArrowRight className="size-3.5 self-center text-brand" />}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2">
        <More opts={rest} filter={filter} setFilter={setFilter} />
        {sort}
      </div>
    </div>
  )
}

/** B · a quiet toolbar: a segmented control for the main filters, the rest in a menu, one link for the value. */
function Toolbar({ filters, filter, setFilter, metrics, sort, primary = 3 }: BarProps) {
  const main = filters.slice(0, primary)
  const rest = filters.slice(primary).filter((f) => f.n > 0)
  const link = metrics.find((m) => m.onClick)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-lg bg-line-soft p-0.5" role="radiogroup" aria-label="Filter">
          {main.map((f) => (
            <button
              key={f.k}
              role="radio"
              aria-checked={filter === f.k}
              onClick={() => setFilter(f.k)}
              className={cn('inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium', filter === f.k ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink')}
            >
              {f.label} <span className="text-[12px] text-muted tabular-nums">{f.n}</span>
            </button>
          ))}
        </div>
        <More opts={rest} filter={filter} setFilter={setFilter} label="Filters" />
      </div>
      <div className="flex items-center gap-3">
        {link && (
          <button onClick={link.onClick} className="inline-flex items-center gap-1 text-[13px] text-ink-2 hover:text-ink">
            <b className="font-semibold text-[var(--green)]">{link.value}</b> {link.label.toLowerCase()} <ArrowRight className="size-3.5 text-brand" />
          </button>
        )}
        {sort}
      </div>
    </div>
  )
}

/** C · a strip of big numbers with tiny labels, then every filter as a text tab. */
function Strip({ filters, filter, setFilter, metrics, sort }: BarProps) {
  return (
    <div>
      <div className="flex flex-wrap divide-x divide-line rounded-xl border border-line bg-white">
        {metrics.map((m) => {
          const click = m.filter ? () => setFilter(filter === m.filter ? 'all' : m.filter!) : m.onClick
          return (
            <button key={m.label} onClick={click} className="min-w-[140px] flex-1 px-4 py-2.5 text-left hover:bg-head/60">
              <span className={cn('block text-[20px] leading-7 font-semibold tabular-nums', m.green ? 'text-[var(--green)]' : 'text-ink')}>{m.value}</span>
              <span className="flex items-center gap-1 text-[11.5px] font-medium tracking-wide text-muted uppercase">
                {m.label} {m.onClick && <ArrowRight className="size-3 text-brand" />}
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-b border-line">
        <div className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Filter">
          {filters.map((f) => {
            if (!f.n && f.k !== 'all') return null
            const on = filter === f.k
            return (
              <button key={f.k} role="tab" aria-selected={on} onClick={() => setFilter(f.k)} className={cn('-mb-px border-b-2 px-3 py-2 text-[13.5px] font-medium whitespace-nowrap', on ? 'border-[var(--brand-primary)] text-ink' : 'border-transparent text-muted hover:text-ink')}>
                {f.label} <span className="text-[12px] text-muted tabular-nums">{f.n}</span>
              </button>
            )
          })}
        </div>
        <div className="mb-1.5">{sort}</div>
      </div>
    </div>
  )
}

export function SummaryBar({ style, ...p }: BarProps & { style: BarStyle }) {
  if (style === 'toolbar') return <Toolbar {...p} />
  if (style === 'strip') return <Strip {...p} />
  return <Stats {...p} />
}
