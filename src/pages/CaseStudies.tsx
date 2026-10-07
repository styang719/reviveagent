import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CaseStudy } from '@/components/home/NewAgentIntro'
import { projectGain, reviveProjects } from '@/data/reviveProjects'
import { gain } from '@/lib/format'
import { cn, PAGE } from '@/lib/utils'

// Every Revive case study near the agent, with the totals up top and a filter by product.
const FILTERS = ['All', 'Renovate to Sell', 'Renovate to Stay', 'In progress'] as const

export default function CaseStudies() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const sold = reviveProjects.filter((p) => p.status === 'sold')
  const added = sold.reduce((n, p) => n + projectGain(p), 0)
  const avgDays = Math.round(sold.reduce((n, p) => n + (p.daysOnMarket ?? 0), 0) / sold.length)
  const shown = reviveProjects.filter((p) =>
    filter === 'All' ? true : filter === 'In progress' ? p.status === 'progress' : p.product.startsWith(filter) && p.status !== 'progress',
  )
  const totals = [
    { k: 'Projects near you', v: String(reviveProjects.length) },
    { k: 'Added on sold homes', v: gain(added) },
    { k: 'Average days on market', v: `${avgDays} days` },
  ]
  return (
    <div className={PAGE}>
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
        <ArrowLeft className="size-3.5" /> Home
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-ink sm:text-[28px]">What Revive has done near you</h1>
      <p className="mt-1 text-[15px] text-ink-2">Recent Revive projects around Pasadena. Revive covers the work until the home sells.</p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        {totals.map((t) => (
          <div key={t.k} className="rounded-2xl bg-[var(--brand-primary-subtle)] px-5 py-4">
            <dt className="text-[12.5px] text-ink-2">{t.k}</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink tabular-nums">{t.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap gap-2" role="radiogroup" aria-label="Filter case studies">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="radio"
            aria-checked={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] font-medium',
              filter === f ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-line bg-white text-ink-2 hover:bg-head',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => (
          <CaseStudy key={p.id} p={p} />
        ))}
      </div>
      <p className="mt-4 text-[11px] text-faint">Sample projects; photos are illustrative.</p>
    </div>
  )
}
