import { ArrowRight, Check, HousePlus, Sparkles, TrendingUp } from 'lucide-react'
import { AiLink } from '@/components/ai/AiLink'
import { Button } from '@/components/ui/button'
import { StartWithRevive } from './StartWithRevive'

// Homes, before there's anything on it: two cards that say what each section is for and why it's worth
// a first try, each ending in the one action that fills it.

/** Projects with Revive, empty: how a project works, what it's worth, and the address search to start one. */
export function ProjectsEmpty() {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--brand-primary-border-subtle)] bg-[radial-gradient(120%_120%_at_100%_0%,var(--brand-primary-subtle)_0%,#fff_60%)] p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-ink">Start your first project with Revive</h3>
        <span className="rounded-full bg-ok-soft px-2.5 py-1 text-[12px] font-semibold text-[var(--green)]">+$62K avg upside nearby</span>
      </div>
      <p className="mt-1 text-[14px] leading-6 text-ink-2">Revive renovates before the home lists and is repaid at closing. Your seller pays nothing up front, and you list a home that sells for more.</p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ['Tell us the home', 'An address is enough'],
          ['Revive reviews it', 'Offer terms within 48 hrs'],
          ['Renovate, then list', 'Revive manages the work'],
        ].map(([t, d], i) => (
          <li key={t} className="rounded-xl bg-white/80 p-3 ring-1 ring-[var(--brand-primary-border-subtle)]">
            <span className="grid size-6 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-[12px] font-bold text-brand">{i + 1}</span>
            <p className="mt-2 text-[13.5px] font-semibold text-ink">{t}</p>
            <p className="text-[12px] text-muted">{d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-auto pt-6">
        <p className="mb-2 text-[13px] font-medium text-ink">Have a property in mind?</p>
        <StartWithRevive bare />
      </div>
    </div>
  )
}

/** Revive AI reports, empty: a peek at what a report holds, and a one-click way to run the first. */
export function ReportsEmpty() {
  return (
    <div className="flex flex-col rounded-2xl border border-[var(--brand-agent-border-subtle,#e0caf2)] bg-[radial-gradient(120%_120%_at_100%_0%,var(--brand-agent-subtle)_0%,#fff_60%)] p-6 shadow-card">
      <h3 className="text-lg font-semibold text-ink">Run your first Revive AI report</h3>
      <p className="mt-1 text-[14px] leading-6 text-ink-2">Any address, about a minute. A branded report you can share with the homeowner to start the conversation.</p>
      {/* a peek at a report */}
      <div className="mt-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-line">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13.5px] font-semibold text-ink">123 Main St, South Pasadena</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-agent-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-agent)]">
            <Sparkles className="size-3" /> Sample
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-head px-2.5 py-2">
            <p className="text-[10.5px] text-muted">Value today</p>
            <p className="text-[14px] font-semibold text-ink">$1.15M</p>
          </div>
          <div className="rounded-lg bg-ok-soft px-2.5 py-2">
            <p className="text-[10.5px] text-muted">Best upside</p>
            <p className="text-[14px] font-semibold text-[var(--green)]">+$62K</p>
          </div>
          <div className="rounded-lg bg-head px-2.5 py-2">
            <p className="text-[10.5px] text-muted">ADU room</p>
            <p className="text-[14px] font-semibold text-ink">No</p>
          </div>
        </div>
        <ul className="mt-3 flex flex-col gap-1.5">
          {[
            [TrendingUp, 'What it could sell for after each Revive product'],
            [HousePlus, 'Whether the lot can take an ADU'],
            [Check, 'Recent sales nearby, to back the numbers'],
          ].map(([Icon, t]) => {
            const I = Icon as typeof Check
            return (
              <li key={t as string} className="flex items-center gap-2 text-[12.5px] text-ink-2">
                <I className="size-3.5 text-[var(--brand-agent)]" /> {t as string}
              </li>
            )
          })}
        </ul>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
        <Button asChild className="h-11 px-5">
          <AiLink to="/ai?flow=report">
            <Sparkles /> Generate a report
          </AiLink>
        </Button>
        <Button asChild variant="ghost" className="h-11 text-brand">
          <AiLink to="/ai?flow=report&property=main">
            Try it on 123 Main St <ArrowRight />
          </AiLink>
        </Button>
      </div>
    </div>
  )
}
