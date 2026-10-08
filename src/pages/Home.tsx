import { DiscussProperty } from '@/components/home/DiscussProperty'
import { AdvisorCard } from '@/components/home/AdvisorCard'
import { ProjectPulse } from '@/components/home/ProjectPulse'
import { ReferEarn } from '@/components/home/ReferralCards'
import { ReferralHero } from '@/components/home/ReferralHero'
import { ReferralUpdates } from '@/components/home/ReferralUpdates'
import { RevivePathCard } from '@/components/home/RevivePathCard'
import { SetupTodo } from '@/components/home/ConnectBook'
import { StatCards } from '@/components/home/StatCards'
import { CaseStudies, ReviveAiIntro } from '@/components/home/NewAgentIntro'
import { YourBook } from '@/components/home/YourBook'
import { TopOpportunities } from '@/components/home/TopOpportunities'
import { AGENT, TIERS } from '@/data/tiers'
import { useNow } from '@/hooks/useNow'
import { isActionable, useConnections, useOpportunities } from '@/lib/opportunities'
import { useUi } from '@/store/ui'
import { PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'

const FEED_SIZE = 5

function greetingWord(h: number) {
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Home() {
  const tier = useDemo((s) => s.tier)
  const opps = useOpportunities()
  const now = useNow(30_000)
  const { crm, mls } = useConnections()
  const importing = useUi((s) => s.importing)

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

  // once both sources are in, the ranked list is the agent's book; the source panels would repeat it
  const bookDone = crm && mls && !importing

  const whoToCall = feed.length > 0 && <TopOpportunities opps={feed.slice(0, FEED_SIZE)} />

  const greeting = (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">
          {greetingWord(new Date(now).getHours())}, {AGENT.firstName}
        </h1>
        <p className="mt-1 text-[15px] text-ink-2">{sentence}</p>
      </div>
      <DiscussProperty />
    </header>
  )

  // New agent: Ask Revive with the Revive status beside it, then the book and the context below.
  if (isNew) {
    return (
      <div className={PAGE}>
        {greeting}
        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-x-6 gap-y-10 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ReviveAiIntro />
          <RevivePathCard tier={tier} opps={opps} />
          <div className="flex min-w-0 flex-col gap-12">
            {bookDone ? whoToCall : (
              <>
                <YourBook opps={opps} />
                {whoToCall}
              </>
            )}
            <CaseStudies />
          </div>
          <aside className="flex flex-col gap-5" aria-label="Getting started">
            <SetupTodo opps={opps} />
            <AdvisorCard />
          </aside>
        </div>
      </div>
    )
  }

  return (
    <div className={PAGE}>
      {greeting}

      {/* the same Ask Revive search as a new agent sees, with the Revive status beside it */}
      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ReviveAiIntro />
        <RevivePathCard tier={tier} opps={opps} />
      </div>

      <div className="mt-8">
        <StatCards tier={tier} opps={opps} />
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          {newReferral && <ReferralHero o={newReferral} />}
          {tier === 'partner' && <ReferralUpdates waiting={waiting} />}
          {projects.map((o) => (
            <ProjectPulse key={o.id} o={o} />
          ))}
          {whoToCall}
        </div>

        <aside className="flex flex-col gap-5" aria-label="At a glance">
          <AdvisorCard />
          {tier === 'partner' && <ReferEarn />}
        </aside>
      </div>
    </div>
  )
}
