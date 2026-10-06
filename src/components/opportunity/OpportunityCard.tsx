import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PropertyPhoto } from '@/components/property/PropertyPhoto'
import { Button } from '@/components/ui/button'
import { gain, money } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { SourceTag, StageTag, UrgencyTag } from './Tags'
import { useCta } from './useCta'

export function Estimate({ o, align = 'right' }: { o: Opportunity; align?: 'left' | 'right' }) {
  const target = o.property.project?.targetList
  return (
    <div className={cn('shrink-0', align === 'right' ? 'text-right' : 'text-left')}>
      {o.stage === 'project' && target ? (
        <>
          <p className="text-lg leading-6 font-semibold text-navy">{money(target)}</p>
          <p className="text-xs text-muted">Target list price</p>
        </>
      ) : o.gain > 0 ? (
        <>
          <p className="text-lg leading-6 font-semibold text-ok">{gain(o.gain)}</p>
          <p className="text-xs text-muted">Est. upside · {o.product}</p>
        </>
      ) : (
        <p className="text-xs text-muted">No estimate yet</p>
      )}
    </div>
  )
}

export function Reasons({ o, max = 3 }: { o: Opportunity; max?: number }) {
  const [top, ...rest] = o.property.signals
  return (
    <p className="text-sm leading-5 text-ink-2">
      <span className="font-medium text-ink">{top}</span>
      {rest.slice(0, max - 1).map((r) => (
        <span key={r} className="text-muted"> · {r}</span>
      ))}
    </p>
  )
}

export function PersonLine({ o }: { o: Opportunity }) {
  if (!o.person) return <p className="text-[13px] text-muted">Owner not in your contacts</p>
  return (
    <p className="text-[13px] text-muted">
      <Link to={`/person/${o.person.id}`} className="font-medium text-ink-2 hover:text-brand hover:underline">
        {o.person.name}
      </Link>{' '}
      · {o.property.ownerRole === 'Seller' ? 'Seller' : o.person.relationship} · {o.person.source}
    </p>
  )
}

/** One card used on Home, list, map preview and pipeline (size variants). */
export function OpportunityCard({ o, size = 'feed', className }: { o: Opportunity; size?: 'feed' | 'compact'; className?: string }) {
  const runCta = useCta()
  const compact = size === 'compact'
  return (
    <article className={cn('rounded-xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-md', className)}>
      <div className="flex gap-4">
        {!compact && <PropertyPhoto id={o.id} label={o.property.address} className="hidden size-20 sm:grid" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <UrgencyTag urgency={o.urgency} />
            <SourceTag source={o.property.source} />
            <StageTag stage={o.stage} />
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink">
                <Link to={`/property/${o.id}`} className="hover:text-brand hover:underline">
                  {o.property.address}
                </Link>
                <span className="font-normal text-muted">, {o.property.city}</span>
              </h3>
              <PersonLine o={o} />
            </div>
            {!compact && (
              <>
                <div className="sm:hidden">
                  <Estimate o={o} align="left" />
                </div>
                <div className="hidden sm:block">
                  <Estimate o={o} />
                </div>
              </>
            )}
          </div>
          <div className="mt-2">
            <Reasons o={o} max={compact ? 2 : 3} />
            {o.score.note && <p className="mt-1 text-xs text-warn">{o.score.note}</p>}
          </div>
          {compact && (
            <div className="mt-2">
              <Estimate o={o} align="left" />
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant={o.cta.kind === 'claim' ? 'warn' : 'default'} onClick={() => runCta(o)}>
              {o.cta.label}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <Link to={`/property/${o.id}`}>
                View property <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
