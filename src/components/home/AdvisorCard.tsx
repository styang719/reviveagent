import { toast } from 'sonner'
import advisor from '@/assets/avatars/advisor-philip.svg'
import mark from '@/assets/revive-mark.svg'
import { Button } from '@/components/ui/button'

// The agent's Revive advisor: a person to call when a lead stalls or they need more on how Revive works.
export const ADVISOR = { name: 'Philip Philipson', first: 'Philip' }

export function AdvisorCard() {
  return (
    <section aria-labelledby="advisor-title" className="rounded-2xl border border-[var(--brand-primary-border-subtle)] bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-wide text-brand uppercase">Your Revive advisor</p>
          <h2 id="advisor-title" className="mt-1 text-lg font-semibold text-ink">
            {ADVISOR.name}
          </h2>
        </div>
        <span className="relative shrink-0">
          <img src={advisor} alt={`Photo of ${ADVISOR.name}`} className="size-16 rounded-full bg-[var(--brand-primary-subtle)] object-cover" />
          <span className="absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-white bg-[var(--brand-primary)]">
            <img src={mark} alt="" aria-hidden="true" className="size-3.5 brightness-0 invert" />
          </span>
        </span>
      </div>
      <p className="mt-3 text-[14px] leading-6 text-ink-2">Stuck on a lead, or need more details on how Revive can help?</p>
      <Button
        className="mt-4 h-10"
        onClick={() => toast.success(`Call request sent to ${ADVISOR.first}`, { description: 'He’ll reach out within one business day to pick a time.' })}
      >
        Schedule a call
      </Button>
    </section>
  )
}
