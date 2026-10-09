import { Check, ChevronRight, Hammer, MessageSquareReply, PhoneCall, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { attentionOf, attentionRank, img } from '@/components/home/TopOpportunities'
import { needsAction } from '@/components/property/SellerReferrals'
import { isActionable, useOpportunities } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Mobile has no dashboard, so the chat opens with today's to-dos for agents with deals: the lead to call,
// the project waiting on them, the Revive referral that needs an update. Each row takes them there; the
// circle ticks it off for now.

type Todo = { id: string; icon: typeof PhoneCall; title: string; sub: string; to: string; tone: 'lead' | 'project' | 'referral'; photo?: string; label: string }
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
    todos.push({
      id: `lead-${lead.id}`,
      icon: att === 'reply' ? MessageSquareReply : PhoneCall,
      title: att === 'reply' ? `Reply to ${first(lead.person?.name)}` : `Call ${lead.person?.name ?? 'the homeowner'}`,
      sub: lead.property.address,
      to: `/m/property/${lead.id}`,
      tone: 'lead',
      photo: img(lead),
      label: att === 'reply' ? 'Reply waiting' : 'Lead to call',
    })
  }

  // a Revive project waiting on the agent
  const project = opps.find((o) => o.property.project?.nextFromAgent)
  if (project) {
    const pr = project.property.project!
    todos.push({ id: `project-${project.id}`, icon: Hammer, title: pr.nextFromAgent!, sub: project.property.address, to: `/m/property/${project.id}`, tone: 'project', photo: img(project), label: 'Project update' })
  }

  // a Revive referral that needs them (new, or waiting on an update)
  const ref = opps.find(needsAction)
  if (ref) {
    todos.push({
      id: `ref-${ref.id}`,
      icon: UserRound,
      title: ref.referral!.status === 'new' ? `Call ${ref.person?.name ?? 'your new referral'}` : `Update Revive on ${first(ref.person?.name)}`,
      sub: ref.property.address,
      to: `/m/leads/referrals/${ref.id}`,
      tone: 'referral',
      photo: img(ref),
      label: 'Revive referral',
    })
  }

  // room for one more lead, when the list is short
  if (leads[1] && todos.length < 3) {
    const o = leads[1]
    todos.push({ id: `lead-${o.id}`, icon: PhoneCall, title: `Call ${o.person?.name ?? 'the homeowner'}`, sub: o.property.address, to: `/m/property/${o.id}`, tone: 'lead', photo: img(o), label: 'Lead to call' })
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

  return (
    // a navy card, so the to-dos read apart from the prompt tiles below
    <section aria-labelledby="today-title" className="mt-4 overflow-hidden rounded-[22px] bg-[radial-gradient(120%_90%_at_100%_0%,#2b4580_0%,var(--navy)_60%,#141f3d_100%)] p-1.5 text-white shadow-[0_10px_28px_rgba(28,46,88,0.25)]">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <h2 id="today-title" className="text-[15px] font-semibold">
          Today
        </h2>
        <span className="rounded-full bg-white/12 px-2 py-0.5 text-[12px] font-medium text-white/85 tabular-nums">{left ? `${left} to do` : 'All done'}</span>
      </div>
      <ul className="flex flex-col">
        {todos.map((t) => {
          const isDone = done.has(t.id)
          return (
            <li key={t.id} className="flex items-center">
              <button
                onClick={() => toggle(t.id)}
                aria-pressed={isDone}
                aria-label={isDone ? `Mark “${t.title}” not done` : `Mark “${t.title}” done`}
                className="grid size-11 shrink-0 place-items-center"
              >
                <span className={cn('grid size-[22px] place-items-center rounded-full border-[1.5px] transition-colors', isDone ? 'border-[var(--teal)] bg-[var(--teal)] text-navy' : 'border-white/45')}>
                  {isDone && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
              <Link to={t.to} className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl py-2 pr-2.5 active:bg-white/5">
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[14.5px] font-medium', isDone && 'text-white/50 line-through')}>{t.title}</span>
                  <span className={cn('mt-0.5 flex items-center gap-1.5 text-[12px] text-white/60', isDone && 'opacity-60')}>
                    <span className={cn('inline-flex shrink-0 items-center gap-1 font-semibold', t.tone === 'lead' ? 'text-[#9db8ff]' : t.tone === 'project' ? 'text-[var(--teal)]' : 'text-[#d6b4f5]')}>
                      <t.icon className="size-3" /> {t.label}
                    </span>
                    <span className="truncate">· {t.sub}</span>
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-white/40" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
