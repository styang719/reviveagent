import { ArrowLeft } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Estimate, PersonLine, Reasons } from '@/components/opportunity/OpportunityCard'
import { SourceTag, StageTag, UrgencyTag } from '@/components/opportunity/Tags'
import { useCta } from '@/components/opportunity/useCta'
import { PropertyPhoto } from '@/components/property/PropertyPhoto'
import { Button } from '@/components/ui/button'
import { useOpportunities } from '@/lib/opportunities'
import { Placeholder } from './Placeholder'

export default function Property() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const runCta = useCta()
  const o = useOpportunities().find((x) => x.id === id)

  if (id === 'new') {
    return (
      <Placeholder title={params.get('address') ?? 'New address'} intro="Revive AI report for an address you searched." phase={2} />
    )
  }
  if (!o) {
    return <Placeholder title="Property not found" intro="It may not be visible at this tier. Try switching the demo tier." phase={2} />
  }
  const p = o.property
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-8 sm:py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-brand">
        <ArrowLeft className="size-3.5" /> Back
      </Link>
      <div className="mt-3 flex flex-col gap-5 rounded-xl border border-line bg-white p-5 shadow-card sm:flex-row">
        <PropertyPhoto id={p.id} label={p.address} className="h-40 w-full sm:h-36 sm:w-56" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            <UrgencyTag urgency={o.urgency} />
            <SourceTag source={p.source} />
            <StageTag stage={o.stage} />
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-ink">{p.address}</h1>
          <p className="text-sm text-muted">
            {p.city} · {p.homeType} · {p.beds} bd · {p.baths} ba · {p.sqft.toLocaleString()} sqft · built {p.yearBuilt}
          </p>
          <div className="mt-1">
            <PersonLine o={o} />
          </div>
          <div className="mt-3">
            <Reasons o={o} />
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Estimate o={o} />
          <Button onClick={() => runCta(o)} variant={o.cta.kind === 'claim' ? 'warn' : 'default'}>
            {o.cta.label}
          </Button>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-line bg-head p-6 text-sm text-muted">
        Tabs (Overview · Revive AI report · Project · Marketing) arrive in phase 2
        {params.get('tab') ? `. You asked for the “${params.get('tab')}” tab.` : '.'}
      </div>
    </div>
  )
}
