import { Check, Hammer, MessageSquareReply, PhoneCall, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { attentionOf, attentionRank, crmSignal, img, leadSignal } from '@/components/home/TopOpportunities'
import { actionFor, needsAction } from '@/components/property/SellerReferrals'
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
    const signal = leadSignal(lead, activity[lead.id]) ?? crmSignal(lead)
    todos.push({
      id: `lead-${lead.id}`,
      icon: att === 'reply' ? MessageSquareReply : PhoneCall,
      title: att === 'reply' ? `Reply to ${first(lead.person?.name)}` : `Call ${lead.person?.name ?? 'the homeowner'}`,
      sub: signal ?? `${lead.property.address} · ${lead.reasons[0] ?? 'Worth a call this week'}`,
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
    todos.push({ id: `project-${project.id}`, icon: Hammer, title: pr.nextFromAgent!, sub: `${project.property.address} · ${pr.stageLabel ?? pr.product}`, to: `/m/property/${project.id}`, tone: 'project', photo: img(project), label: 'Project update' })
  }

  // a Revive referral that needs them (new, or waiting on an update)
  const ref = opps.find(needsAction)
  if (ref) {
    todos.push({
      id: `ref-${ref.id}`,
      icon: UserRound,
      title: ref.referral!.status === 'new' ? `Call ${ref.person?.name ?? 'your new referral'}` : `Update Revive on ${first(ref.person?.name)}`,
      sub: `${ref.property.address} · ${actionFor(ref.referral!.status, first(ref.person?.name))}`,
      to: `/m/leads/referrals/${ref.id}`,
      tone: 'referral',
      photo: img(ref),
      label: 'Revive referral',
    })
  }

  // room for one more lead, when the list is short
  if (leads[1] && todos.length < 3) {
    const o = leads[1]
    todos.push({ id: `lead-${o.id}`, icon: PhoneCall, title: `Call ${o.person?.name ?? 'the homeowner'}`, sub: `${o.property.address} · ${o.reasons[0] ?? 'Worth a call this week'}`, to: `/m/property/${o.id}`, tone: 'lead', photo: img(o), label: 'Lead to call' })
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
    <section aria-labelledby="today-title" className="mt-4">
      <div className="flex items-center justify-between px-1">
        <h2 id="today-title" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          Today
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-navy px-1.5 text-[11px] font-semibold text-white tabular-nums">{left}</span>
        </h2>
        <span className="text-[12.5px] text-muted">{left ? 'Swipe for more' : 'All done for today'}</span>
      </div>
      {/* one card per to-do, a photo of the home on top: swipe across, tap to go there */}
      <ul className="-mx-4 mt-2 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {todos.map((t) => {
          const isDone = done.has(t.id)
          return (
            <li key={t.id} className="w-[232px] shrink-0 snap-start">
              <Link
                to={t.to}
                className={cn('block overflow-hidden rounded-[22px] bg-white shadow-[0_6px_20px_rgba(28,46,88,0.12)] ring-1 ring-black/[0.03] transition-opacity', isDone && 'opacity-55')}
              >
                <span className="relative block h-[92px] bg-line-soft">
                  {t.photo && <img src={t.photo} alt="" className="size-full object-cover" />}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                  <span
                    className={cn(
                      'absolute bottom-2 left-2.5 inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11.5px] font-semibold text-white',
                      t.tone === 'lead' ? 'bg-[var(--brand-primary)]' : t.tone === 'project' ? 'bg-[var(--green)]' : 'bg-[var(--brand-agent)]',
                    )}
                  >
                    <t.icon className="size-3" /> {t.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      toggle(t.id)
                    }}
                    aria-pressed={isDone}
                    aria-label={isDone ? `Mark “${t.title}” not done` : `Mark “${t.title}” done`}
                    className={cn('absolute top-2 right-2 grid size-7 place-items-center rounded-full border-[1.5px] backdrop-blur-sm', isDone ? 'border-white bg-[var(--green)] text-white' : 'border-white/90 bg-white/25')}
                  >
                    {isDone && <Check className="size-3.5" strokeWidth={3} />}
                  </button>
                </span>
                <span className="block px-3 pt-2.5 pb-3">
                  <span className={cn('line-clamp-2 min-h-10 text-[14.5px] leading-5 font-semibold text-ink', isDone && 'line-through')}>{t.title}</span>
                  <span className="mt-1 block truncate text-[12px] text-muted">{t.sub}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
