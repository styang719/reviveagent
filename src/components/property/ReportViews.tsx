import { ArrowRight, Hammer, Send, Sparkles, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AiLink } from '@/components/ai/AiLink'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// Homes page: three ways to show Revive AI reports (to compare), and the listings table.

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

/** A · List: one row per report, scannable like a table, with the two next steps on the right. */
export function ReportList({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1fr_minmax(0,1.4fr)_auto] gap-4 border-b border-line bg-head px-4 py-2 text-[11.5px] font-medium tracking-wide text-muted uppercase md:grid">
        <span>Home</span>
        <span>Value today</span>
        <span>Best upside</span>
        <span>Best fit</span>
        <span className="w-[196px]" />
      </div>
      <ul>
        {rows.map((r, i) => (
          <li key={r.id} className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 hover:bg-head/60 md:grid-cols-[minmax(0,2.2fr)_1fr_1fr_minmax(0,1.4fr)_auto]', i > 0 && 'border-t border-line-soft')}>
            <Link to={to(r.id)} className="flex min-w-0 items-center gap-3">
              <Thumb src={r.photo} className="size-11 rounded-lg" />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-ink hover:text-brand">{r.address}</span>
                <span className="flex items-center gap-2 truncate text-[12.5px] text-muted">
                  {r.city}
                  {r.when && <span className="text-faint">· {r.when}</span>}
                </span>
              </span>
            </Link>
            <span className="hidden text-[14px] font-semibold text-ink tabular-nums md:block">{money(r.valueNow)}</span>
            <span className="hidden text-[14px] font-semibold text-[var(--green)] tabular-nums md:block">{r.upside ? gain(r.upside) : '—'}</span>
            <span className="hidden min-w-0 items-center gap-2 md:flex">
              <span className="truncate text-[13px] text-ink-2">{r.product ?? 'No project fit yet'}</span>
              <Designs n={r.designs} />
            </span>
            <span className="flex w-[196px] justify-end gap-2">
              <Link to={to(r.id)} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-medium text-ink hover:border-[var(--brand-primary-border)]">
                <Send className="size-3.5" /> Share
              </Link>
              <AiLink to={`/ai?flow=project&property=${r.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--brand-primary-subtle)] px-3 text-[12.5px] font-medium text-brand hover:bg-[var(--brand-primary-border)]/40">
                <Hammer className="size-3.5" /> Project
              </AiLink>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** B · Compact tiles: small square photo beside the numbers, two or three to a row. */
export function ReportTiles({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {rows.map((r) => (
        <Link key={r.id} to={to(r.id)} className="group flex items-stretch gap-4 rounded-xl border border-line bg-white p-3 shadow-card transition-shadow hover:shadow-[0_8px_24px_rgba(28,46,88,0.10)]">
          <Thumb src={r.photo} className="size-24 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-[14.5px] font-semibold text-ink group-hover:text-brand">{r.address}</span>
                <span className="block truncate text-[12.5px] text-muted">{r.city}</span>
              </span>
              <ArrowRight className="mt-1 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </div>
            <div className="mt-auto flex items-end justify-between gap-3 pt-2">
              <span>
                <span className="block text-[11px] text-muted">Today</span>
                <span className="block text-[15px] font-semibold text-ink tabular-nums">{money(r.valueNow)}</span>
              </span>
              <span className="text-right">
                <span className="block truncate text-[11px] text-muted">{r.product ?? 'Best upside'}</span>
                <span className="block text-[15px] font-semibold text-[var(--green)] tabular-nums">{r.upside ? gain(r.upside) : '—'}</span>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

/** C · Report preview: a small "page" of the report itself, today → after Revive, no photo. */
export function ReportDocs({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {rows.map((r) => {
        const after = r.valueNow + (r.upside ?? 0)
        const pct = r.upside ? Math.max(8, Math.min(100, Math.round((r.upside / r.valueNow) * 100 * 6))) : 0
        return (
          <Link key={r.id} to={to(r.id)} className="group flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_8px_24px_rgba(28,46,88,0.10)]">
            <div className="flex items-center gap-3 bg-navy px-4 py-3 text-white">
              <Thumb src={r.photo} className="size-9 rounded-md ring-2 ring-white/20" />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold">{r.address}</span>
                <span className="block truncate text-[11.5px] text-white/70">Revive AI report · {r.city}</span>
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="flex items-end justify-between gap-2">
                <span>
                  <span className="block text-[11px] text-muted">Today</span>
                  <span className="block text-[15px] font-semibold text-ink tabular-nums">{money(r.valueNow)}</span>
                </span>
                <ArrowRight className="mb-1 size-4 text-faint" />
                <span className="text-right">
                  <span className="block text-[11px] text-muted">After Revive</span>
                  <span className="block text-[15px] font-semibold text-[var(--green)] tabular-nums">{r.upside ? money(after) : '—'}</span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-line-soft">
                <div className="h-full rounded-full bg-[var(--green)]" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {r.product ? <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11.5px] font-semibold text-[var(--green)]">{r.upside ? gain(r.upside) : ''} · {r.product}</span> : <span className="text-[12px] text-muted">No project fit yet</span>}
                <Designs n={r.designs} />
              </div>
              <span className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[12px]">
                <span className="text-faint">{r.when ?? 'From your lead form'}</span>
                <span className="flex items-center gap-1 font-medium text-brand">
                  Open <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export const REPORT_VIEWS = [
  { k: 'list', label: 'A · List', C: ReportList },
  { k: 'tiles', label: 'B · Tiles', C: ReportTiles },
  { k: 'doc', label: 'C · Report preview', C: ReportDocs },
] as const
export type ReportView = (typeof REPORT_VIEWS)[number]['k']

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
      <table className="w-full min-w-[900px] text-left text-[13.5px]">
        <thead className="border-b border-line bg-head text-[11.5px] font-medium tracking-wide whitespace-nowrap text-muted uppercase">
          <tr>
            <th className="px-4 py-2 font-medium">Listing</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 text-right font-medium">Days on market</th>
            <th className="px-4 py-2 text-right font-medium">List price</th>
            <th className="px-4 py-2 text-right font-medium">With Revive</th>
            <th className="px-4 py-2 font-medium">Best fit</th>
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
                <td className="px-4 py-3 text-right font-semibold text-[var(--green)] tabular-nums">{o.gain ? gain(o.gain) : '—'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-2">{o.product ?? '—'}</td>
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
