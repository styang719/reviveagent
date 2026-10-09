import { ChevronRight, Gift, Inbox, LayoutGrid, Megaphone, MessageCircle, RotateCcw, TrendingUp, UserRoundPen } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import michelle from '@/assets/avatar-michelle.jpg'
import { ADVISOR } from '@/components/home/AdvisorCard'
import { ProfileDialog } from '@/components/marketing/ProfileDialog'
import { AGENT, TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import { inPhoneFrame } from './mode'

// More: everything that isn't a tab. Opportunities as a list, Marketing center, Inbox, Refer & Earn, the
// Revive advisor, the marketing profile, and (outside the phone frame) the demo scenario switch.

function Row({ icon: Icon, label, sub, to, onClick, badge }: { icon: typeof Inbox; label: string; sub?: string; to?: string; onClick?: () => void; badge?: number }) {
  const body = (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand-primary-subtle)] text-brand">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {sub && <span className="block truncate text-[13px] text-muted">{sub}</span>}
      </span>
      {badge ? <span className="rounded-full bg-bad px-2 py-0.5 text-[12px] font-semibold text-white">{badge}</span> : null}
      <ChevronRight className="size-5 shrink-0 text-faint" />
    </>
  )
  const cls = 'flex w-full items-center gap-3.5 px-4 py-3.5 text-left active:bg-head'
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {body}
    </button>
  )
}

export default function MobileMore() {
  const tier = useDemo((s) => s.tier)
  const setTier = useDemo((s) => s.setTier)
  const setNewAgent = useDemo((s) => s.setNewAgent)
  const reset = useDemo((s) => s.reset)
  const resetChats = useUi((s) => s.resetChats)
  const [profile, setProfile] = useState(false)
  const pick = (t: Tier) => (t === 'new' ? setNewAgent(false) : setTier(t))
  return (
    <div className="pb-6">
      <header className="flex items-center gap-4 px-4 pt-6 pb-5">
        <img src={michelle} alt="" className="size-14 rounded-full object-cover" />
        <div>
          <p className="text-[19px] font-semibold text-ink">{AGENT.name}</p>
          <p className="text-[13.5px] text-muted">
            {AGENT.role} · {TIERS[tier].label} on Revive
          </p>
        </div>
      </header>

      <ul className="mx-3 divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-white">
        <li>
          <Row icon={TrendingUp} label="Opportunities" sub="Your book, ranked by who to call" to="/m/opportunities" />
        </li>
        <li>
          <Row icon={Megaphone} label="Marketing center" sub="Templates branded for you" to="/m/marketing" />
        </li>
        <li>
          <Row icon={Inbox} label="Inbox" sub="Messages from homeowners and Revive" to="/m/inbox" badge={8} />
        </li>
        <li>
          <Row icon={LayoutGrid} label="What Revive has done near you" sub="Recent projects around Pasadena" to="/m/case-studies" />
        </li>
      </ul>

      <ul className="mx-3 mt-4 divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-white">
        <li>
          <Row icon={UserRoundPen} label="Marketing profile" sub="Photo, name and license on every template" onClick={() => setProfile(true)} />
        </li>
        <li>
          <Row
            icon={MessageCircle}
            label={`Talk to ${ADVISOR.name}`}
            sub="Your Revive advisor"
            onClick={() => toast.success(`Call request sent to ${ADVISOR.first}`, { description: 'He’ll reach out within one business day.' })}
          />
        </li>
        <li>
          <Row icon={Gift} label="Refer & Earn" sub="Invite an agent to Revive" onClick={() => toast.success('Referral link copied')} />
        </li>
      </ul>

      {/* on a phone there's no demo bar, so the scenarios live here (in the frame they sit beside the phone) */}
      {!inPhoneFrame() && (
        <section className="mx-3 mt-6">
          <p className="px-1 text-[12px] font-semibold tracking-wide text-muted uppercase">Demo scenario</p>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-line-soft p-1" role="radiogroup" aria-label="Demo scenario">
            {(Object.keys(TIERS) as Tier[]).map((t) => (
              <button key={t} role="radio" aria-checked={tier === t} onClick={() => pick(t)} className={cn('rounded-lg px-2 py-2 text-[12.5px] font-medium', tier === t ? 'bg-white text-ink shadow-sm' : 'text-muted')}>
                {TIERS[t].label}
              </button>
            ))}
          </div>
        </section>
      )}
      <button
        onClick={() => {
          reset()
          resetChats()
          toast('Demo reset')
        }}
        className="mx-auto mt-6 flex items-center gap-1.5 text-[13px] text-muted"
      >
        <RotateCcw className="size-3.5" /> Reset demo
      </button>
      <ProfileDialog open={profile} onOpenChange={setProfile} />
    </div>
  )
}
