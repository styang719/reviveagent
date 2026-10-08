import { ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AiLink } from '@/components/ai/AiLink'
import { useCta } from '@/components/opportunity/useCta'
import type { Source } from '@/data/types'
import { firstName, gain } from '@/lib/format'
import { STAGE_LABEL, useIsProperty, useProgress, type Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Home's weekly to-do: the top opportunities as a checklist, one line of why and one action each.
// Listings and contacts sit in the same ranked list; the label says where each came from.

const SOURCE: Record<Source, string> = {
  listings: 'MLS listing',
  contacts: 'Contact',
  leadform: 'Lead form',
  revive: 'Revive lead',
  search: 'Report you ran',
}

const actionCls = 'inline-flex items-center gap-1 text-[13px] font-medium whitespace-nowrap text-brand hover:underline'

/** The one thing to do next, worded for the relationship: your seller vs. someone you're winning. */
function NextAction({ o }: { o: Opportunity }) {
  const runCta = useCta()
  const share = useDemo((s) => s.shareReport)
  const progress = useProgress()(o)
  const isProperty = useIsProperty()
  const name = o.person ? firstName(o.person.name) : 'the homeowner'
  const arrow = <ArrowRight className="size-3.5" />

  if (progress?.kind === 'share')
    return (
      <button
        className={actionCls}
        onClick={() => {
          share(o.id, o.property.address, o.person?.name)
          toast.success(`Report shared with ${o.person?.name ?? 'the homeowner'}`, { description: 'You’ll see on Home when it’s opened.' })
        }}
      >
        {progress.next} {arrow}
      </button>
    )
  if (progress?.kind === 'project')
    return (
      <AiLink to={`/ai?flow=project&property=${o.id}`} className={actionCls}>
        Propose a Revive project {arrow}
      </AiLink>
    )
  if (progress?.kind === 'open')
    return (
      <Link to={`/property/${o.id}?tab=project`} className={actionCls}>
        Open project {arrow}
      </Link>
    )
  if (o.cta.kind === 'claim' || o.cta.kind === 'followup' || isProperty(o))
    return (
      <button className={actionCls} onClick={() => runCta(o)}>
        {o.cta.label} {arrow}
      </button>
    )
  return (
    <AiLink to={`/ai?flow=report&property=${o.id}`} className={actionCls}>
      {o.property.source === 'listings' ? `Show ${name} what Revive adds` : `Send ${name} their home’s value`} {arrow}
    </AiLink>
  )
}

export function TopOpportunities({ opps, total }: { opps: Opportunity[]; total: number }) {
  const checked = useDemo((s) => s.checked)
  const toggle = useDemo((s) => s.toggleChecked)
  const progress = useProgress()
  const isProperty = useIsProperty()
  const done = opps.filter((o) => checked[o.id]).length

  return (
    <section aria-labelledby="top-opps">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 id="top-opps" className="text-xl font-semibold text-ink">
            Top opportunities this week
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">
            {done} of {opps.length} done
          </p>
        </div>
        <Link to="/opportunities" className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand hover:underline">
          See all {total} <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <ul className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        {opps.map((o, i) => {
          const isDone = !!checked[o.id]
          const state = progress(o)?.label ?? (o.stage === 'spotted' ? 'Not started' : STAGE_LABEL[o.stage])
          return (
            <li key={o.id} className={cn('flex items-start gap-3 px-4 py-3.5', i > 0 && 'border-t border-line-soft')}>
              <button
                role="checkbox"
                aria-checked={isDone}
                aria-label={`Mark ${o.property.address} done`}
                onClick={() => toggle(o.id)}
                className={cn(
                  'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
                  isDone ? 'border-[var(--green)] bg-[var(--green)] text-white' : 'border-line hover:border-brand',
                )}
              >
                {isDone && <Check className="size-3" strokeWidth={3} />}
              </button>
              <div className={cn('min-w-0 flex-1', isDone && 'opacity-50')}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className={cn('text-[14.5px] font-semibold text-ink', isDone && 'line-through')}>
                    {isProperty(o) ? (
                      <Link to={`/property/${o.id}`} className="hover:text-brand hover:underline">
                        {o.property.address}
                      </Link>
                    ) : (
                      o.property.address
                    )}
                  </p>
                  <span className="rounded-md bg-head px-1.5 py-0.5 text-[11px] font-medium text-ink-2">{SOURCE[o.property.source]}</span>
                  <span className="text-[12px] text-muted">{state}</span>
                </div>
                <p className="mt-0.5 flex min-w-0 gap-1 text-[13px] text-ink-2">
                  <span className="truncate">
                    {o.person ? `${o.person.name} · ` : ''}
                    {o.reasons[0]}
                  </span>
                  {o.gain > 0 && <span className="shrink-0 font-medium text-[var(--green)]">· {gain(o.gain)}</span>}
                </p>
                {!isDone && (
                  <div className="mt-1.5 sm:hidden">
                    <NextAction o={o} />
                  </div>
                )}
              </div>
              {!isDone && (
                <div className="hidden shrink-0 pt-0.5 sm:block">
                  <NextAction o={o} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
