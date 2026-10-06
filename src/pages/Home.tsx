import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { FoundOpportunities } from '@/components/home/FoundOpportunities'
import { NearbyMini } from '@/components/home/NearbyMini'
import { ProjectPulse } from '@/components/home/ProjectPulse'
import { ReferEarn } from '@/components/home/ReferralCards'
import { ReferralHero } from '@/components/home/ReferralHero'
import { ReferralUpdates } from '@/components/home/ReferralUpdates'
import { RevivePathCard } from '@/components/home/RevivePathCard'
import { CrmDialog, SetupTodo } from '@/components/home/ConnectBook'
import { OpportunitiesPreview } from '@/components/home/OpportunitiesPreview'
import { GlobalSearch } from '@/components/shell/GlobalSearch'
import { StatCards } from '@/components/home/StatCards'
import { OpportunityCard } from '@/components/opportunity/OpportunityCard'
import { AGENT, TIERS } from '@/data/tiers'
import { useNow } from '@/hooks/useNow'
import { isActionable, useOpportunities } from '@/lib/opportunities'
import { useDemo } from '@/store/demo'

const FEED_SIZE = 5

function greetingWord(h: number) {
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const tier = useDemo((s) => s.tier)
  const opps = useOpportunities()
  const now = useNow(30_000)

  const newReferral = opps.find((o) => o.referral?.status === 'new' && !o.referral.claimedAt && o.referral.expiresAt > now)
  const waiting = opps.filter((o) => o.referral?.needsUpdateNow && o.id !== newReferral?.id)
  const projects = opps.filter((o) => o.stage === 'project' && o.property.project?.status === 'active')
  const feed = opps.filter((o) => isActionable(o) && o.referral?.status !== 'new')
  const actionableCount = opps.filter(isActionable).length

  const sentence = TIERS[tier].greeting({
    opportunities: actionableCount,
    listings: opps.filter((o) => o.property.source === 'listings').length,
    contacts: opps.filter((o) => o.property.source === 'contacts').length,
    projectName: projects[0]?.property.address.split(' ').slice(1, -1).join(' '),
    newReferral: !!newReferral,
  })

  const isNew = tier === 'new'

  const hello = `${greetingWord(new Date(now).getHours())}, ${AGENT.firstName}.`

  // New agent: one title that is also the question, the search right under it, and the
  // to-do list beside it. Opportunities sit under the search once something is connected.
  if (isNew) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-8 sm:py-10">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-10">
            <header>
              <h1 className="text-[26px] leading-tight tracking-[-0.01em] text-balance text-ink sm:text-[32px]">
                <span className="font-normal">{hello}</span> <span className="font-semibold">Have a property in mind?</span>
              </h1>
              <GlobalSearch variant="hero" className="mt-5" />
              <p className="mt-2 text-[13px] text-muted">See any home’s value, renovation upside and the Revive product that fits.</p>
            </header>
            <OpportunitiesPreview opps={opps} />
            {opps.length > 0 && <FoundOpportunities opps={opps} />}
          </div>
          <aside className="flex flex-col gap-5" aria-label="Getting started">
            <SetupTodo opps={opps} />
            <RevivePathCard tier={tier} opps={opps} />
          </aside>
        </div>
        <CrmDialog />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-8 sm:py-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">{hello.slice(0, -1)}</h1>
        <p className="mt-1 text-[15px] text-ink-2">{sentence}</p>
      </header>

      <div className="mt-6">
        <StatCards tier={tier} opps={opps} />
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          {newReferral && <ReferralHero o={newReferral} />}
          {tier === 'partner' && <ReferralUpdates waiting={waiting} />}
          {projects.map((o) => (
            <ProjectPulse key={o.id} o={o} />
          ))}
          <section aria-labelledby="who-to-call">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id="who-to-call" className="text-lg font-semibold text-ink">
                  Who to call this week
                </h2>
                <p className="text-[13px] text-muted">Ranked by why now: timing, relationship and what Revive can add.</p>
              </div>
              <Link to="/opportunities" className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                See all {actionableCount} <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="flex flex-col gap-3">
              {feed.slice(0, FEED_SIZE).map((o) => (
                <OpportunityCard key={o.id} o={o} />
              ))}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5" aria-label="At a glance">
          <RevivePathCard tier={tier} opps={opps} />
          <NearbyMini opps={opps} />
          {tier === 'partner' && <ReferEarn />}
        </aside>
      </div>
    </div>
  )
}
