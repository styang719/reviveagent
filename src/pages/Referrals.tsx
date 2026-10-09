import { ArrowLeft, Calendar, House, List, Phone, Search, Signpost, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import advisor from '@/assets/avatars/advisor-philip.svg'
import mark from '@/assets/revive-mark.svg'
import { ADVISOR } from '@/components/home/AdvisorCard'
import { GRADES } from '@/components/home/PartnerStatusCard'
import { REFERRAL_STATUS, ReferralCard } from '@/components/property/SellerReferrals'
import { Button } from '@/components/ui/button'
import { TIERS } from '@/data/tiers'
import type { Referral } from '@/data/types'
import { money, plural } from '@/lib/format'
import { useOpportunities } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'

// Lead tracking > View all: every seller referral from Revive, how they're converting (received to on market),
// and on the right the next home visit, the agent's Revive grade and their advisor. Layout from the Figma
// "Your leads" page.

type Status = Referral['status']
// how far each status got down the funnel (a lost referral had the visit and the meeting)
const REACHED: Record<Status, number> = { new: 0, claimed: 1, contacted: 2, lost: 2, listing: 3 }
const FUNNEL = ['Referral received', 'Home visit set', 'Met with homeowner', 'Signed listing agreement', 'On market']
const LABEL = 'text-[12px] font-medium tracking-wide text-brand uppercase'

export default function Referrals() {
  const opps = useOpportunities().filter((o) => o.referral)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all' | Status>('all')
  const needle = q.trim().toLowerCase()
  const shown = opps
    .filter((o) => status === 'all' || o.referral!.status === status)
    .filter((o) => !needle || [o.person?.name, o.property.address, o.property.city].some((f) => f?.toLowerCase().includes(needle)))
    .sort((a, b) => a.referral!.referredDaysAgo - b.referral!.referredDaysAgo)

  const received = opps.length
  const thisMonth = opps.filter((o) => o.referral!.referredDaysAgo <= 30).length
  const reached = FUNNEL.map((_, i) => opps.filter((o) => REACHED[o.referral!.status] >= i).length)
  const signed = reached[3]
  const conversion = received ? Math.round((signed / received) * 100) : 0
  const active = opps.filter((o) => o.referral!.status !== 'lost')
  const volume = active.reduce((n, o) => n + o.property.valueNow, 0)
  const next = opps.find((o) => o.referral!.status === 'claimed')

  const deals = TIERS.partner.deals
  const grade = [...GRADES].reverse().find((g) => deals >= g.from) ?? GRADES[0]
  const gi = GRADES.indexOf(grade)
  const nextGrade = GRADES[gi + 1]

  return (
    <div className={PAGE}>
      <Link to="/leads" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-brand">
        <ArrowLeft className="size-3.5" /> Lead tracking
      </Link>
      <header className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Your seller referrals</h1>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search referrals"
            aria-label="Search referrals"
            className="h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[14px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
          />
        </label>
      </header>

      <div className="mt-8 grid gap-x-16 gap-y-12 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-12">
          {/* how referrals are converting */}
          <section aria-labelledby="perf-title" className="flex flex-col gap-5">
            <div>
              <h2 id="perf-title" className="text-[18px] font-medium text-ink">
                How your referrals are converting
              </h2>
              <p className="mt-1 text-[14px] text-ink-2">Every homeowner Revive has sent you, from referral to on market.</p>
            </div>
            <div className="flex flex-col gap-6 rounded-[28px] border border-[var(--brand-primary-border-subtle)] p-6">
              <dl className="grid gap-6 sm:grid-cols-3 sm:divide-x sm:divide-[var(--brand-primary-border-subtle)]">
                {[
                  { icon: Users, label: 'Referrals received', value: String(received), sub: `+ ${thisMonth} this month` },
                  { icon: House, label: 'Referral conversion', value: `${conversion}%`, sub: 'vs. 24% top agents' },
                  { icon: Signpost, label: 'Potential listing volume', value: money(volume), sub: `from ${plural(active.length, 'active referral')}` },
                ].map(({ icon: Icon, label, value, sub }) => (
                  <div key={label} className="flex min-w-0 flex-col gap-3 sm:pl-6 sm:first:pl-0">
                    <Icon className="size-5 text-brand" />
                    <div>
                      <dt className={LABEL}>{label}</dt>
                      <dd className="flex flex-wrap items-baseline gap-x-2 text-ink">
                        <span className="text-[28px] leading-10 font-semibold tabular-nums">{value}</span>
                        <span className="text-[14px] font-medium">{sub}</span>
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
              <div className="h-px bg-[var(--brand-primary-border-subtle)]" />
              {/* funnel: each bar is that stage's share of referrals received */}
              <ol className="grid grid-cols-5 gap-2 pt-6" aria-label="Referral funnel">
                {FUNNEL.map((label, i) => {
                  const n = reached[i]
                  const pct = received ? n / received : 0
                  const last = i === FUNNEL.length - 1
                  return (
                    <li key={label} className="flex min-w-0 flex-col items-center gap-2">
                      <div className="relative flex h-32 w-full max-w-[104px] flex-col justify-end overflow-visible rounded-t-xl rounded-b bg-gradient-to-b from-[rgba(62,98,182,0.16)] to-[rgba(62,98,182,0)]">
                        <div
                          className={cn('w-full rounded-t-[4px] rounded-b', i === 0 && 'rounded-t-xl', last ? 'bg-[#74e9cd]' : 'bg-[linear-gradient(170deg,#3e62b6_0%,#6c8cd6_100%)]')}
                          style={{ height: `${Math.max(pct * 100, n ? 12 : 4)}%` }}
                        />
                        <span
                          className="absolute left-1/2 flex min-w-14 -translate-x-1/2 flex-col items-center rounded-xl border border-[var(--brand-primary-border-subtle)] bg-white p-1 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
                          style={{ bottom: `calc(${Math.max(pct * 100, n ? 12 : 4)}% - 18px)` }}
                        >
                          <span className="text-[14px] font-medium text-ink tabular-nums">{n}</span>
                          <span className="text-[12px] text-ink tabular-nums">{Math.round(pct * 100)}%</span>
                        </span>
                      </div>
                      <span className="line-clamp-2 w-full text-center text-[12.5px] leading-[18px] text-ink sm:text-[13.5px]">
                        {i + 1}. {label}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </section>

          {/* every referral */}
          <section aria-labelledby="all-title" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="all-title" className="text-[18px] font-medium text-ink">
                  All referrals
                </h2>
                <p className="mt-1 text-[14px] text-ink-2">Stay on top of every referral, with the details you need to take action.</p>
              </div>
              <label className="relative">
                <span className="sr-only">Filter by status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'all' | Status)}
                  className="h-10 appearance-none rounded-xl border border-line bg-white pr-9 pl-5 text-[14px] font-medium text-ink-2 outline-none hover:bg-head focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
                >
                  <option value="all">All referrals</option>
                  {(Object.keys(REFERRAL_STATUS) as Status[]).map((s) => (
                    <option key={s} value={s}>
                      {REFERRAL_STATUS[s].label}
                    </option>
                  ))}
                </select>
                <List className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
              </label>
            </div>
            {shown.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {shown.map((o) => (
                  <ReferralCard key={o.id} o={o} />
                ))}
              </div>
            ) : (
              <p className="rounded-[28px] border border-dashed border-line px-6 py-5 text-[14px] text-muted">No referrals match.</p>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-8" aria-label="Your referrals at a glance">
          {next && (
            <section className="flex flex-col gap-5">
              <div>
                <p className={LABEL}>Next home visit</p>
                <p className="text-[22px] leading-8 font-semibold text-ink">Tomorrow, 11:30am</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-[14px] text-ink">
                  {next.person?.name
                    .split(' ')
                    .map((x) => x[0])
                    .join('')}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-medium text-ink">{next.person?.name}</p>
                  <p className="truncate text-[14px] text-ink-2">
                    {next.property.address}, {next.property.city}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="h-12 flex-1 rounded-xl text-[15px]" asChild>
                  <Link to={`/property/${next.id}`}>
                    <List /> View referral
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="size-12 rounded-xl"
                  aria-label={`Call ${next.person?.name}`}
                  onClick={() => toast(`Calling ${next.person?.name}…`, { description: 'Prototype: no call is placed.' })}
                >
                  <Phone />
                </Button>
              </div>
            </section>
          )}
          <div className="h-px bg-[var(--brand-primary-border-subtle)]" />
          <section className="flex flex-col gap-6">
            <div>
              <p className={LABEL}>Revive’s grade</p>
              <p className="text-[22px] leading-8 font-semibold text-ink">{grade.name}</p>
              {nextGrade && (
                <p className="mt-1 text-[14px] text-ink-2">
                  <span className="font-medium">{plural(nextGrade.from - deals, 'deal')} to next grade.</span> {nextGrade.perk}.
                </p>
              )}
            </div>
            <div>
              <div className="flex gap-2">
                {GRADES.map((g, i) => (
                  <span key={g.name} className={cn('h-3 flex-1 rounded-full', i <= gi ? 'bg-[linear-gradient(180deg,#3e62b6_0%,#6c8cd6_100%)]' : 'bg-[var(--brand-primary-border-subtle)]')} />
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 text-center text-[12px]">
                {GRADES.map((g, i) => (
                  <span key={g.name} className={i === gi ? 'text-brand' : 'text-faint'}>
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          </section>
          <div className="h-px bg-[var(--brand-primary-border-subtle)]" />
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className={LABEL}>Your Revive advisor</p>
                <p className="text-[18px] leading-7 font-semibold text-ink">{ADVISOR.name}</p>
              </div>
              <span className="relative shrink-0">
                <img src={advisor} alt={`Photo of ${ADVISOR.name}`} className="size-14 rounded-full bg-[var(--brand-primary-subtle)] object-cover" />
                <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full border-2 border-white bg-[var(--brand-primary)]">
                  <img src={mark} alt="" aria-hidden="true" className="size-3 brightness-0 invert" />
                </span>
              </span>
            </div>
            <p className="-mt-3 text-[14px] text-ink-2">Stuck on a lead, or need more details on how Revive can help?</p>
            <Button
              className="h-12 rounded-xl text-[15px]"
              onClick={() => toast.success(`Call request sent to ${ADVISOR.first}`, { description: 'He’ll reach out within one business day to pick a time.' })}
            >
              <Calendar /> Schedule a call
            </Button>
          </section>
        </aside>
      </div>
    </div>
  )
}
