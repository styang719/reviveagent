import { Check, ChevronDown, ChevronRight, FileText, Hammer, IdCard, MessageSquareReply, PhoneCall, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LicenseForm } from '@/components/home/ConnectBook'
import { attentionOf, attentionRank, img } from '@/components/home/TopOpportunities'
import { needsAction } from '@/components/property/SellerReferrals'
import { AGENT } from '@/data/tiers'
import { startProject, startReport } from '@/lib/flowEngine'
import { plural } from '@/lib/format'
import { isActionable, useConnections, useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

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
  if (tier === 'new') return <SetupList opps={opps} />

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
    // a soft blue card with each to-do in its own white row, so the list reads apart from the prompt tiles below
    <section
      aria-labelledby="today-title"
      className="mt-4 rounded-[24px] border border-[var(--brand-primary-border-subtle)] bg-[linear-gradient(160deg,#eaf0fc_0%,#f1effc_100%)] p-2.5"
    >
      <div className="flex items-center justify-between px-1.5 pt-0.5 pb-2">
        <h2 id="today-title" className="text-[15px] font-semibold text-ink">
          Today
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-medium text-brand tabular-nums">{left ? `${left} to do` : 'All done'}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {todos.map((t) => {
          const isDone = done.has(t.id)
          return (
            <li key={t.id} className={cn('flex items-center rounded-2xl bg-white shadow-[0_1px_4px_rgba(28,46,88,0.06)] transition-opacity', isDone && 'opacity-60')}>
              <button
                onClick={() => toggle(t.id)}
                aria-pressed={isDone}
                aria-label={isDone ? `Mark “${t.title}” not done` : `Mark “${t.title}” done`}
                className="grid size-12 shrink-0 place-items-center"
              >
                <span className={cn('grid size-[22px] place-items-center rounded-full border-[1.5px] transition-colors', isDone ? 'border-[var(--green)] bg-[var(--green)] text-white' : 'border-[#c4cad6]')}>
                  {isDone && <Check className="size-3.5" strokeWidth={3} />}
                </span>
              </button>
              <Link to={t.to} className="flex min-w-0 flex-1 items-center gap-2 py-2.5 pr-3">
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[14.5px] font-medium text-ink', isDone && 'text-muted line-through')}>{t.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
                    <span className={cn('inline-flex shrink-0 items-center gap-1 font-semibold', t.tone === 'lead' ? 'text-brand' : t.tone === 'project' ? 'text-[var(--green)]' : 'text-[var(--brand-agent)]')}>
                      <t.icon className="size-3" /> {t.label}
                    </span>
                    <span className="truncate">· {t.sub}</span>
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-faint" />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * A new agent's chat home: the same "Get set up" steps as the desktop dashboard (license number, CRM, first report,
 * first project), in the Today card's style. The license number opens right in the row; the CRM opens its
 * sign-in sheet; the report and the project start in Revive AI. Gone once everything is done.
 */
function SetupList({ opps }: { opps: Opportunity[] }) {
  const { crm, mls, license } = useConnections()
  const openCrm = useUi((s) => s.openCrm)
  const reportGenerated = useDemo((s) => s.reportGenerated)
  const project = useDemo((s) => Object.keys(s.projects).length > 0) || opps.some((o) => o.stage === 'project')
  const [open, setOpen] = useState<string | null>(null)
  const listings = opps.filter((o) => o.property.source === 'listings').length
  const contacts = opps.filter((o) => o.property.source === 'contacts').length

  const steps = [
    { id: 'license', icon: IdCard, title: mls ? `Listings found (DRE #${license ?? ''})` : 'Add your license number', hint: mls ? plural(listings, 'active listing') + ' on the MLS' : 'Finds your listings and past sales · 30 sec', done: mls, run: () => setOpen(open === 'license' ? null : 'license'), expands: true },
    { id: 'crm', icon: Users, title: crm ? `${AGENT.crm} connected` : 'Connect your CRM', hint: crm ? plural(contacts, 'contact') + ' with an address' : 'Finds homeowners worth a call · 1 min', done: crm, run: () => openCrm('') },
    { id: 'report', icon: FileText, title: reportGenerated ? 'First Revive AI report generated' : 'Generate your first Revive AI report', hint: 'Any address: value, upside and the right product · 1 min', done: reportGenerated, run: () => startReport() },
    { id: 'project', icon: Hammer, title: 'Start your first project', hint: 'Revive AI walks you through it · 3 min', done: project, run: () => startProject() },
  ]
  const done = steps.filter((t) => t.done).length
  if (done === steps.length) return null

  return (
    <section aria-labelledby="setup-title" className="mt-4 rounded-[24px] border border-[var(--brand-primary-border-subtle)] bg-[linear-gradient(160deg,#eaf0fc_0%,#f1effc_100%)] p-2.5">
      <div className="flex items-center justify-between px-1.5 pt-0.5">
        <h2 id="setup-title" className="text-[15px] font-semibold text-ink">
          Get set up
        </h2>
        <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-medium text-brand tabular-nums">
          {done} of {steps.length}
        </span>
      </div>
      <div className="mx-1.5 mt-2 mb-2.5 h-1.5 overflow-hidden rounded-full bg-white" aria-hidden="true">
        <div className="h-full rounded-full bg-[var(--green)] transition-[width] duration-500" style={{ width: `${(done / steps.length) * 100}%` }} />
      </div>
      <ol className="flex flex-col gap-2">
        {steps.map((t) => {
          const isOpen = open === t.id && !t.done
          return (
            <li key={t.id} className={cn('rounded-2xl bg-white shadow-[0_1px_4px_rgba(28,46,88,0.06)]', t.done && 'opacity-60')}>
              <button type="button" disabled={t.done} onClick={t.run} aria-expanded={t.expands ? isOpen : undefined} className="flex w-full items-center gap-3 py-2.5 pr-3 pl-3.5 text-left">
                <span className={cn('grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px]', t.done ? 'border-[var(--green)] bg-[var(--green)] text-white' : 'border-[#c4cad6]')}>
                  {t.done && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('block truncate text-[14.5px] font-medium text-ink', t.done && 'text-muted line-through')}>{t.title}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-muted">
                    <t.icon className="size-3 shrink-0 text-brand" />
                    <span className="truncate">{t.hint}</span>
                  </span>
                </span>
                {!t.done && (t.expands ? <ChevronDown className={cn('size-4 shrink-0 text-faint transition-transform', isOpen && 'rotate-180')} /> : <ChevronRight className="size-4 shrink-0 text-faint" />)}
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3">
                  <LicenseForm autoFocus />
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
