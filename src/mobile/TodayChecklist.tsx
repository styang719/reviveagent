import { Check, ChevronRight, Hammer, Map, MessageSquareReply, PhoneCall, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { attentionOf, attentionRank, crmSignal, leadSignal } from '@/components/home/TopOpportunities'
import { actionFor, needsAction } from '@/components/property/SellerReferrals'
import { isActionable, useOpportunities } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Mobile has no dashboard, so the chat opens with today's to-dos for agents with deals: the lead to call,
// the project waiting on them, the Revive referral that needs an update. Each row takes them there; the
// circle ticks it off for now.

type Todo = { id: string; icon: typeof PhoneCall; title: string; sub: string; to: string; tone: 'lead' | 'project' | 'referral' }
const first = (name?: string) => name?.split(' ')[0] ?? 'the homeowner'

export function TodayChecklist() {
  const tier = useDemo((s) => s.tier)
  const outreach = useDemo((s) => s.outreach)
  const activity = useDemo((s) => s.activity)
  const opps = useOpportunities()
  const [done, setDone] = useState<Set<string>>(() => new Set())
  if (tier === 'new') return null

  const todos: Todo[] = []

  // the most pressing lead: a reply waiting on them, then fresh activity, then the most urgent
  const leads = opps
    .filter((o) => !o.referral && o.stage !== 'project' && (isActionable(o) || attentionOf(o, outreach[o.id], activity[o.id])))
    .sort((a, b) => attentionRank(b, outreach[b.id], activity[b.id]) - attentionRank(a, outreach[a.id], activity[a.id]) || b.score.score - a.score.score)
  const lead = leads[0]
  if (lead) {
    const att = attentionOf(lead, outreach[lead.id], activity[lead.id])
    const signal = leadSignal(lead, activity[lead.id]) ?? crmSignal(lead)
    todos.push({
      id: `lead-${lead.id}`,
      icon: att === 'reply' ? MessageSquareReply : PhoneCall,
      title: att === 'reply' ? `Reply to ${first(lead.person?.name)}` : `Call ${lead.person?.name ?? 'the homeowner'}`,
      sub: `${lead.property.address} · ${signal ?? lead.reasons[0] ?? 'Worth a call this week'}`,
      to: `/m/property/${lead.id}`,
      tone: 'lead',
    })
  }

  // a Revive project waiting on the agent
  const project = opps.find((o) => o.property.project?.nextFromAgent)
  if (project) {
    const pr = project.property.project!
    todos.push({ id: `project-${project.id}`, icon: Hammer, title: pr.nextFromAgent!, sub: `${project.property.address} · ${pr.stageLabel ?? pr.product}`, to: `/m/property/${project.id}`, tone: 'project' })
  }

  // a Revive referral that needs them (new, or waiting on an update)
  const ref = opps.find(needsAction)
  if (ref) {
    todos.push({
      id: `ref-${ref.id}`,
      icon: UserRound,
      title: ref.referral!.status === 'new' ? `Call ${ref.person?.name ?? 'your new referral'}` : `Update Revive on ${first(ref.person?.name)}`,
      sub: `Revive referral · ${actionFor(ref.referral!.status, first(ref.person?.name))}`,
      to: `/m/leads/referrals/${ref.id}`,
      tone: 'referral',
    })
  }

  // room for one more lead, when the list is short
  if (leads[1] && todos.length < 3) {
    const o = leads[1]
    todos.push({ id: `lead-${o.id}`, icon: PhoneCall, title: `Call ${o.person?.name ?? 'the homeowner'}`, sub: `${o.property.address} · ${o.reasons[0] ?? 'Worth a call this week'}`, to: `/m/property/${o.id}`, tone: 'lead' })
  }
  if (!todos.length) return null

  const left = todos.filter((t) => !done.has(t.id)).length
  const toggle = (id: string) =>
    setDone((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toCall = opps.filter(isActionable).length

  return (
    <section aria-labelledby="today-title" className="mt-3.5 rounded-[22px] border border-white/80 bg-white/70 p-1.5 shadow-[0_2px_12px_rgba(28,46,88,0.06)] backdrop-blur-sm">
      <div className="flex items-baseline justify-between px-3 pt-2 pb-1">
        <h2 id="today-title" className="text-[15px] font-semibold text-ink">
          Today
        </h2>
        <span className="text-[12.5px] text-muted tabular-nums">{left ? `${left} to do` : 'All done'}</span>
      </div>
      <ul className="flex flex-col">
        {todos.map((t) => {
          const isDone = done.has(t.id)
          return (
            <li key={t.id} className="flex items-center gap-1">
              <button
                onClick={() => toggle(t.id)}
                aria-pressed={isDone}
                aria-label={isDone ? `Mark “${t.title}” not done` : `Mark “${t.title}” done`}
                className="grid size-11 shrink-0 place-items-center"
              >
                <span className={cn('grid size-[22px] place-items-center rounded-full border-[1.5px] transition-colors', isDone ? 'border-[var(--green)] bg-[var(--green)] text-white' : 'border-[#c4cad6] bg-white')}>
                  {isDone && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
              <Link to={t.to} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-2 pr-2.5 active:bg-[rgba(28,46,88,0.04)]">
                <span className="min-w-0 flex-1">
                  <span className={cn('flex items-center gap-1.5 text-[14.5px] font-medium text-ink', isDone && 'text-muted line-through')}>
                    <t.icon className={cn('size-3.5 shrink-0', t.tone === 'lead' ? 'text-brand' : t.tone === 'project' ? 'text-[var(--green)]' : 'text-[var(--brand-agent)]')} />
                    <span className="truncate">{t.title}</span>
                  </span>
                  <span className={cn('block truncate text-[12.5px] text-muted', isDone && 'opacity-60')}>{t.sub}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-faint" />
              </Link>
            </li>
          )
        })}
      </ul>
      {toCall > 0 && (
        <Link to="/m/map" className="mx-1.5 mt-0.5 mb-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-medium text-brand active:bg-[rgba(28,46,88,0.04)]">
          <Map className="size-3.5" /> See all {toCall} opportunities on the map
        </Link>
      )}
    </section>
  )
}
