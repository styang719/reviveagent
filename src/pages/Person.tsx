import { ArrowLeft } from 'lucide-react'
import { PAGE } from '@/lib/utils'
import { Link, useParams } from 'react-router-dom'
import { people } from '@/data/people'
import { gain } from '@/lib/format'
import { STAGE_LABEL, useOpportunities } from '@/lib/opportunities'
import { Placeholder } from './Placeholder'

export default function Person() {
  const { id } = useParams()
  const person = people.find((p) => p.id === id)
  const props = useOpportunities().filter((o) => o.person?.id === id)
  if (!person || props.length === 0) {
    return <Placeholder title="Person not found" intro="They may not be visible at this tier." phase={2} />
  }
  return (
    <div className={PAGE}>
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-brand">
        <ArrowLeft className="size-3.5" /> Back
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-ink">{person.name}</h1>
      <p className="text-sm text-muted">
        {person.relationship} · {person.source} · {person.since}
      </p>
      <ul className="mt-4 space-y-2">
        {props.map((o) => (
          <li key={o.id}>
            <Link to={`/property/${o.id}`} className="text-sm font-medium text-brand hover:underline">
              {o.property.address}
            </Link>
            <span className="text-sm text-muted">
              {' '}
              · {STAGE_LABEL[o.stage]}
              {o.gain > 0 ? ` · ${gain(o.gain)}` : ''}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-6 rounded-xl border border-dashed border-line bg-head p-6 text-sm text-muted">
        CRM notes, Revive activity and the drafted follow-up arrive in phase 2.
      </div>
    </div>
  )
}
