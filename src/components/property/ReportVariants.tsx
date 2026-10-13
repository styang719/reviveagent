import { ArrowRight, Camera, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Home } from './HomesList'

// Three takes on an AI report card, to compare. All show who ran it (an initials avatar: the agent, or the
// homeowner who ran it on the lead form), the potential value with its grade, and the current value when
// there are photos. Without photos Revive can't judge condition, so there's no current value and no upside:
// the card says so and asks for photos.

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))
export type ReportStyle = 'row' | 'photo' | 'value'
export const REPORT_STYLES: { k: ReportStyle; label: string }[] = [
  { k: 'row', label: 'A · Compact' },
  { k: 'photo', label: 'B · Photo card' },
  { k: 'value', label: 'C · Value first' },
]

const GRADE: Record<string, string> = { A: 'bg-[#16a34a]', B: 'bg-[#84cc16]', C: 'bg-[#f59e0b]', D: 'bg-[#9aa3b4]' }
function Grade({ g }: { g?: string }) {
  if (!g) return null
  return <span title={`Revive grade ${g}`} className={cn('inline-grid size-5 place-items-center rounded-md text-[11px] font-bold text-white', GRADE[g])}>{g}</span>
}

/** Who ran it: initials, blue for the agent, purple for a homeowner. */
export function RanBy({ h, size = 'sm' }: { h: Home; size?: 'sm' | 'md' }) {
  const r = h.report?.ranBy
  if (!r) return null
  return (
    <span
      title={r.you ? 'You ran this report' : `${r.name} ran this on your lead form`}
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-semibold', size === 'md' ? 'size-9 text-[13px]' : 'size-6 text-[10.5px]', r.you ? 'bg-line-soft text-ink-2' : 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]')}
    >
      {r.initials}
    </span>
  )
}

function useBits(h: Home) {
  const n = h.needsYou
  const sh = h.report?.share ?? { label: 'Not shared yet', tone: 'none' as const }
  const noPhotos = !!h.report?.noPhotos
  const status = noPhotos ? 'Add photos for the current value' : n ? n.status : sh.label
  const cta = noPhotos ? 'Add photos' : n ? n.cta.replace(/ with .*$/, '') : sh.tone === 'none' ? 'Share' : 'Open'
  const to = n?.to ?? `/property/${h.id}?tab=report`
  return { n, noPhotos, status, cta, to, hot: !!n && !noPhotos }
}

function Footer({ h }: { h: Home }) {
  const b = useBits(h)
  return (
    <span className="flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
      <span className={cn('inline-flex min-w-0 items-center gap-1.5 truncate text-[12.5px]', b.hot ? 'font-semibold text-brand' : 'text-muted')}>
        {b.noPhotos ? <Camera className="size-3.5 shrink-0" /> : <span className={cn('size-1.5 shrink-0 rounded-full', b.hot ? 'bg-[var(--brand-primary)]' : 'bg-[#c4cad6]')} />}
        <span className="truncate">{b.status}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-brand">
        {b.cta} <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </span>
  )
}

/** A · Compact: thumbnail, address, who ran it; upside on the right (or the potential value without photos). */
function Row({ h }: { h: Home }) {
  const b = useBits(h)
  const r = h.report!
  return (
    <Link to={b.to} className="group flex flex-col gap-3 rounded-xl border border-line bg-white p-3.5 transition-colors hover:border-[var(--brand-primary-border)]">
      <span className="flex items-center gap-3">
        <span className="block size-11 shrink-0 overflow-hidden rounded-lg bg-line-soft">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">{h.address}</span>
          <span className="block truncate text-[12.5px] text-muted">
            {h.city}
            {h.product && ` · ${h.product}`}
          </span>
        </span>
        <span className="shrink-0 text-right">
          {b.noPhotos ? (
            <span className="flex items-center gap-1.5 text-[16px] font-semibold text-ink tabular-nums">
              {money(r.potential ?? 0)} <Grade g={r.grade} />
            </span>
          ) : (
            <span className="block text-[18px] leading-6 font-semibold text-[var(--green)] tabular-nums">{h.upside ? gain(h.upside) : '—'}</span>
          )}
          <span className="block text-[11px] text-muted">{b.noPhotos ? 'Potential value' : 'With Revive'}</span>
        </span>
        <RanBy h={h} />
      </span>
      <Footer h={h} />
    </Link>
  )
}

/** B · Photo card: today's report card, smaller. Current value and potential value side by side. */
function Photo({ h }: { h: Home }) {
  const b = useBits(h)
  const r = h.report!
  return (
    <Link to={b.to} className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_8px_24px_rgba(28,46,88,0.10)]">
      <span className="relative block aspect-[16/7] overflow-hidden bg-line-soft">
        {h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        {b.hot && <span className="absolute top-2.5 left-2.5 rounded-full bg-[var(--brand-primary)] px-2.5 py-0.5 text-[11.5px] font-semibold text-white">{b.status}</span>}
      </span>
      <span className="flex flex-1 flex-col gap-2.5 p-3.5">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-[16px] font-semibold text-ink">{h.address}</span>
            <span className="flex items-center gap-1 truncate text-[12.5px] text-muted">
              <MapPin className="size-3.5 text-brand" /> {h.city}
            </span>
          </span>
          <RanBy h={h} size="md" />
        </span>
        <span className="grid grid-cols-2 gap-2 border-t border-line-soft pt-2.5">
          <span>
            <span className="block text-[11.5px] text-muted">Current value</span>
            {b.noPhotos ? <span className="block text-[14px] font-medium text-muted">No photos</span> : <span className="block text-[15px] font-semibold text-ink tabular-nums">{money(r.valueNow)}</span>}
          </span>
          <span className="text-right">
            <span className="block text-[11.5px] text-muted">Potential value</span>
            <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink tabular-nums">
              {money(r.potential ?? r.valueNow)} <Grade g={r.grade} />
            </span>
          </span>
        </span>
        <span className="mt-auto flex items-center justify-between gap-2">
          <span className={cn('truncate text-[12.5px]', b.hot ? 'invisible' : 'text-muted')}>{b.status}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-brand">
            {b.cta} <ArrowRight className="size-3.5" />
          </span>
        </span>
      </span>
    </Link>
  )
}

/** C · Value first: no photo; the potential value leads, with today's value and the gain under it. */
function Value({ h }: { h: Home }) {
  const b = useBits(h)
  const r = h.report!
  return (
    <Link to={b.to} className="group flex flex-col gap-3 rounded-xl border border-line bg-white p-4 transition-colors hover:border-[var(--brand-primary-border)]">
      <span className="flex items-center gap-2">
        <RanBy h={h} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{h.address}</span>
        <span className="shrink-0 text-[12px] text-muted">{h.city}</span>
      </span>
      <span className="flex items-end justify-between gap-2">
        <span>
          <span className="block text-[11.5px] text-muted">Potential value</span>
          <span className="flex items-center gap-2 text-[22px] leading-7 font-semibold text-ink tabular-nums">
            {money(r.potential ?? r.valueNow)} <Grade g={r.grade} />
          </span>
        </span>
        <span className="text-right text-[12.5px] tabular-nums">
          {b.noPhotos ? (
            <span className="text-muted">No current value yet</span>
          ) : (
            <>
              <span className="block text-muted">from {money(r.valueNow)}</span>
              <span className="block font-semibold text-[var(--green)]">{h.upside ? gain(h.upside) : ''}</span>
            </>
          )}
        </span>
      </span>
      <Footer h={h} />
    </Link>
  )
}

export function ReportCard({ h, style }: { h: Home; style: ReportStyle }) {
  if (style === 'photo') return <Photo h={h} />
  if (style === 'value') return <Value h={h} />
  return <Row h={h} />
}
