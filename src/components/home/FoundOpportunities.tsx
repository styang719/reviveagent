import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { OpportunityCard } from '@/components/opportunity/OpportunityCard'
import { Button } from '@/components/ui/button'
import type { Source } from '@/data/types'
import { money, plural } from '@/lib/format'
import { isActionable, SOURCE_LABEL, type Opportunity } from '@/lib/opportunities'

const SOURCE_PLURAL: Partial<Record<Source, [string, string]>> = {
  listings: ['listing', 'listings'],
  contacts: ['contact', 'contacts'],
  leadform: ['lead form lead', 'lead form leads'],
  revive: ['Revive referral', 'Revive referrals'],
  search: ['report you ran', 'reports you ran'],
}

/** "We found N opportunities": the size of the prize, then the few to call first, then the way into Opportunities. */
export function FoundOpportunities({ opps, show = 3, title }: { opps: Opportunity[]; show?: number; title?: string }) {
  const actionable = opps.filter(isActionable)
  const feed = actionable.filter((o) => o.referral?.status !== 'new')
  const value = actionable.reduce((s, o) => s + o.gain, 0)
  const bySource = new Map<Source, number>()
  for (const o of actionable) bySource.set(o.property.source, (bySource.get(o.property.source) ?? 0) + 1)

  return (
    <section aria-labelledby="found-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="found-title" className="text-lg font-semibold text-ink sm:text-xl">
            {title ?? `We found ${plural(actionable.length, 'opportunity', 'opportunities')} in your book`}
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            <span className="font-semibold text-ok">{money(value)}</span> of estimated upside from{' '}
            {[...bySource.entries()].map(([src, n], i, arr) => {
              const [one, many] = SOURCE_PLURAL[src] ?? [SOURCE_LABEL[src], SOURCE_LABEL[src]]
              return (
                <span key={src}>
                  {n} {n === 1 ? one : many}
                  {i < arr.length - 2 ? ', ' : i === arr.length - 2 ? ' and ' : ''}
                </span>
              )
            })}
            .
          </p>
        </div>
      </div>

      <h3 className="mt-5 mb-3 text-[15px] font-semibold text-ink">Who to call first</h3>
      <div className="flex flex-col gap-3">
        {feed.slice(0, show).map((o) => (
          <OpportunityCard key={o.id} o={o} />
        ))}
      </div>

      <Link
        to="/opportunities"
        className="group mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#c7d7fe] bg-brand-soft px-4 py-3.5 text-sm hover:border-brand"
      >
        <span className="text-ink-2">
          <span className="font-semibold text-navy">
            {feed.length > show ? `${plural(feed.length - show, 'more opportunity', 'more opportunities')} ranked` : 'See them all'}
          </span>{' '}
          on a list, map and pipeline
        </span>
        <Button size="sm" asChild>
          <span>
            See all opportunities <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Button>
      </Link>
    </section>
  )
}
