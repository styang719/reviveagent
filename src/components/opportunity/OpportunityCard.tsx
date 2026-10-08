import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PropertyPhoto } from '@/components/property/PropertyPhoto'
import { Button } from '@/components/ui/button'
import { gain, money } from '@/lib/format'
import { AiLink } from '@/components/ai/AiLink'
import { useIsProperty, useProgress, type Opportunity } from '@/lib/opportunities'
import { useDemo } from '@/store/demo'
import { toast } from 'sonner'
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
  const [top, ...rest] = o.reasons
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
  const isProperty = useIsProperty()
  const progress = useProgress()(o)
  const share = useDemo((s) => s.shareReport)
  const needsReport = !isProperty(o) && ['share', 'verify', 'propose', 'activity'].includes(o.cta.kind)
  return (
    <article className={cn('rounded-xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-md', className)}>
      <div className="flex gap-4">
        {!compact && <PropertyPhoto photo={o.property.photo} label={o.property.address} className="hidden size-20 sm:block" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <UrgencyTag urgency={o.urgency} />
            <SourceTag source={o.property.source} />
            <StageTag stage={o.stage} />
          </div>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-ink">
                {isProperty(o) ? (
                  <Link to={`/property/${o.id}`} className="hover:text-brand hover:underline">
                    {o.property.address}
                  </Link>
                ) : (
                  o.property.address
                )}
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
            {o.score.note && o.urgency !== 'hold' && o.urgency !== 'verify' && <p className="mt-1 text-xs text-warn">{o.score.note}</p>}
          </div>
          {compact && (
            <div className="mt-2">
              <Estimate o={o} align="left" />
            </div>
          )}
          {progress && (
            <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <span className="size-1.5 rounded-full bg-[var(--brand-agent)]" aria-hidden="true" />
              <span className="font-semibold text-ink">{progress.label}</span> · Next: {progress.next}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {progress?.kind === 'share' ? (
              <Button
                size="sm"
                onClick={() => {
                  share(o.id, o.property.address, o.person?.name)
                  toast.success(`Report shared with ${o.person?.name ?? 'the homeowner'}`, { description: 'You’ll see on your dashboard when it’s opened.' })
                }}
              >
                {progress.next}
              </Button>
            ) : progress?.kind === 'project' ? (
              <Button size="sm" asChild>
                <AiLink to={`/ai?flow=project&property=${o.id}`}>{progress.next}</AiLink>
              </Button>
            ) : needsReport ? (
              // nothing to share or propose until there's a report: running it is the next step
              <Button size="sm" asChild>
                <AiLink to={`/ai?flow=report&property=${o.id}`}>
                  <Sparkles /> Run a Revive AI report
                </AiLink>
              </Button>
            ) : (
              <Button size="sm" variant={o.cta.kind === 'claim' ? 'warn' : 'default'} onClick={() => runCta(o)}>
                {progress?.next ?? o.cta.label}
              </Button>
            )}
            {isProperty(o) ? (
              <Button size="sm" variant="ghost" asChild>
                <Link to={`/property/${o.id}`}>
                  View property <ArrowRight />
                </Link>
              </Button>
            ) : needsReport ? null : (
              // not a property yet: the report is what makes it one
              <Button size="sm" variant="ghost" asChild>
                <AiLink to={`/ai?flow=report&property=${o.id}`}>
                  <Sparkles /> Run a Revive AI report
                </AiLink>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
