import { AlertCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { plural } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { useDemo } from '@/store/demo'

const STATUS_LABEL = { new: 'New', claimed: 'Claimed', contacted: 'Contacted', listing: 'Listing', lost: 'Lost' }

export function ReferralUpdates({ waiting }: { waiting: Opportunity[] }) {
  const markUpdated = useDemo((s) => s.markReferralUpdated)
  if (waiting.length === 0) return null
  return (
    <section aria-label="Referrals waiting on your update" className="rounded-xl border border-[#fbd5d5] bg-bad-soft p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-bad">
          <AlertCircle className="size-4" />
          {plural(waiting.length, 'referral is', 'referrals are')} waiting on your update
        </h2>
        <Link to="/opportunities?filter=revive" className="flex items-center gap-1 text-[13px] font-medium text-bad hover:underline">
          See all Revive leads <ArrowRight className="size-3.5" />
        </Link>
      </div>
      <p className="mt-1 text-[13px] text-ink-2">Revive keeps sending referrals to Partners who keep homeowners’ status current.</p>
      <ul className="mt-3 divide-y divide-[#fbd5d5] rounded-lg bg-white/70">
        {waiting.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <Link to={`/property/${o.id}`} className="text-sm font-medium text-ink hover:text-brand hover:underline">
                {o.property.address}
              </Link>
              <p className="text-xs text-muted">
                {o.person?.name} · last status: {o.referral ? STATUS_LABEL[o.referral.status] : '—'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                markUpdated(o.id)
                toast.success('Update sent to Revive', { description: `${o.property.address} is marked current.` })
              }}
            >
              Mark status current
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
