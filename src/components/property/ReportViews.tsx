import { ArrowRight, Hammer, Send, Sparkles, Tag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiLink } from '@/components/ai/AiLink'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// Homes page: the Revive AI reports list, and the listings table.

export interface ReportRow {
  id: string
  address: string
  city: string
  photo?: string
  valueNow: number
  upside?: number
  product?: string
  when?: string
  designs?: number // RenoVision designs saved on this home
  at?: number // when it was generated, for sorting
  share?: { label: string; tone: 'opened' | 'shared' | 'leadform' | 'none' } // where it is with the homeowner
}

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))
const to = (id: string) => `/property/${id}?tab=report`

function Thumb({ src, className }: { src?: string; className?: string }) {
  return <span className={cn('block shrink-0 overflow-hidden bg-line-soft', className)}>{src && <img src={img(src)} alt="" className="size-full object-cover" />}</span>
}

function Designs({ n }: { n?: number }) {
  if (!n) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-agent-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-agent)]">
      <Sparkles className="size-3" /> {n} RenoVision
    </span>
  )
}

export type ReportSort = 'newest' | 'upside'
const SHOW = 5

const SHARE_TONE = {
  opened: 'bg-ok-soft text-[var(--green)]',
  shared: 'bg-[var(--brand-primary-subtle)] text-brand',
  leadform: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]',
  none: 'bg-line-soft text-ink-2',
} as const

/**
 * Revive AI reports as a stacked list of row cards (no column header, unlike the listings table), led by
 * where each report is with the homeowner. Long lists stay short: sorted, first five, then Show all.
 */
export function ReportSortControl({ sort, onSort }: { sort: ReportSort; onSort: (s: ReportSort) => void }) {
  return (
    <div className="flex items-center gap-1 text-[12.5px] text-muted">
      Sort by
      {(['newest', 'upside'] as const).map((k) => (
        <button key={k} onClick={() => onSort(k)} aria-pressed={sort === k} className={cn('rounded-md px-2 py-1 font-medium', sort === k ? 'bg-line-soft text-ink' : 'hover:text-ink')}>
          {k === 'newest' ? 'Newest' : 'Biggest upside'}
        </button>
      ))}
    </div>
  )
}

export function ReportList({ rows, sort }: { rows: ReportRow[]; sort: ReportSort }) {
  const [all, setAll] = useState(false)
  const sorted = [...rows].sort((a, b) => (sort === 'upside' ? (b.upside ?? 0) - (a.upside ?? 0) : (b.at ?? 0) - (a.at ?? 0)))
  const visible = all ? sorted : sorted.slice(0, SHOW)
  return (
    <div>
      <ul className="flex flex-col gap-2">
        {visible.map((r) => {
          const sh = r.share ?? { label: 'Not shared yet', tone: 'none' as const }
          return (
            <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-white px-3 py-2.5 shadow-card transition-shadow hover:shadow-[0_6px_18px_rgba(28,46,88,0.08)]">
              <Link to={to(r.id)} className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                <Thumb src={r.photo} className="size-12 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate text-[14.5px] font-semibold text-ink hover:text-brand">{r.address}</span>
                  <span className="block truncate text-[12.5px] text-muted">
                    {r.city}
                    {r.when && <> · {r.when}</>}
                  </span>
                </span>
              </Link>
              <span className={cn('inline-flex w-[168px] shrink-0 items-center justify-center truncate rounded-full px-2.5 py-1 text-[12px] font-semibold', SHARE_TONE[sh.tone])}>{sh.label}</span>
              <span className="w-[190px] shrink-0">
                <span className="block text-[15px] font-semibold text-[var(--green)] tabular-nums">
                  {r.upside ? gain(r.upside) : '—'} <span className="text-[12px] font-normal text-muted">from {money(r.valueNow)}</span>
                </span>
                <span className="flex items-center gap-1.5 truncate text-[12px] text-ink-2">
                  {r.product ?? 'No project fit yet'}
                  <Designs n={r.designs} />
                </span>
              </span>
              <span className="flex w-[252px] shrink-0 justify-end gap-2 whitespace-nowrap">
                <Link
                  to={to(r.id)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium',
                    sh.tone === 'none' ? 'bg-[var(--brand-primary)] text-white hover:opacity-90' : 'border border-line text-ink hover:border-[var(--brand-primary-border)]',
                  )}
                >
                  <Send className="size-3.5" /> {sh.tone === 'none' ? 'Share' : 'Follow up'}
                </Link>
                <AiLink to={`/ai?flow=project&property=${r.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-medium text-ink hover:border-[var(--brand-primary-border)]">
                  <Hammer className="size-3.5" /> Start project
                </AiLink>
              </span>
            </li>
          )
        })}
      </ul>
      {rows.length > SHOW && (
        <button onClick={() => setAll((v) => !v)} className="mt-2 w-full rounded-xl border border-dashed border-line py-2.5 text-[13px] font-medium text-brand hover:bg-head">
          {all ? 'Show fewer' : `Show all ${rows.length} reports`}
        </button>
      )}
    </div>
  )
}

/** Where the listing stands on the MLS. */
export function listingStatus(o: Opportunity) {
  const f = o.property.facts
  if (f.expiredDaysAgo !== undefined) return { label: `Expired ${f.expiredDaysAgo}d ago`, warn: true }
  if (f.withdrawnDaysAgo !== undefined) return { label: 'Withdrawn', warn: true }
  if (f.priceCutDaysAgo !== undefined && f.priceCutDaysAgo <= 14) return { label: f.priceCutDaysAgo === 1 ? 'Price cut yesterday' : `Price cut ${f.priceCutDaysAgo}d ago`, warn: true }
  return { label: 'Active', warn: false }
}

/** Your listings as a table: status, time on market, price, and what Revive could add. */
export function ListingsTable({ rows, reviveOf }: { rows: Opportunity[]; reviveOf: (id: string) => 'project' | 'report' | undefined }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-card">
      <table className="w-full min-w-[760px] text-left text-[13.5px]">
        <thead className="border-b border-line bg-head text-[11.5px] font-medium tracking-wide whitespace-nowrap text-muted uppercase">
          <tr>
            <th className="px-4 py-2 font-medium">Listing</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 text-right font-medium">Days listed</th>
            <th className="px-4 py-2 text-right font-medium">List price</th>
            <th className="px-4 py-2 font-medium">With Revive</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => {
            const p = o.property
            const st = listingStatus(o)
            const rv = reviveOf(o.id)
            const href = `/property/${o.id}${rv === 'project' ? '?tab=project' : ''}`
            return (
              <tr key={o.id} className="border-t border-line-soft first:border-t-0 hover:bg-head/60">
                <td className="px-4 py-3">
                  <Link to={href} className="flex items-center gap-3">
                    <Thumb src={p.photo} className="size-11 rounded-lg" />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink hover:text-brand">{p.address}</span>
                      <span className="block truncate text-[12.5px] text-muted">
                        {p.city}
                        {p.beds ? ` · ${p.beds} bd · ${p.baths} ba` : ''} · {p.sqft.toLocaleString()} sqft
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap', st.warn ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-[var(--green)]')}>
                    <Tag className="size-3" /> {st.label}
                  </span>
                </td>
                <td className={cn('px-4 py-3 text-right tabular-nums', (p.facts.daysOnMarket ?? 0) >= 30 ? 'font-semibold text-warn' : 'text-ink-2')}>{p.facts.daysOnMarket ?? '—'}</td>
                <td className="px-4 py-3 text-right font-semibold text-ink tabular-nums">{money(p.valueNow)}</td>
                <td className="px-4 py-3">
                  <span className="block font-semibold text-[var(--green)] tabular-nums">{o.gain ? gain(o.gain) : '—'}</span>
                  {o.product && <span className="block text-[12px] whitespace-nowrap text-muted">{o.product}</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {rv ? (
                    <Link to={href} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--brand-primary-subtle)] px-3 text-[12.5px] font-medium whitespace-nowrap text-brand">
                      {rv === 'project' ? 'Revive project' : 'AI report'} <ArrowRight className="size-3.5" />
                    </Link>
                  ) : (
                    <Link to={href} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-medium whitespace-nowrap text-ink hover:border-[var(--brand-primary-border)]">
                      See options <ArrowRight className="size-3.5" />
                    </Link>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
