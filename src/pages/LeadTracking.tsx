import { ArrowRight, Clock, Eye, FileText, Mail, MailCheck, Reply, Search, Send, UserRound } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { img, leadSignal, OppDrawer } from '@/components/home/TopOpportunities'
import { MessageDialog } from '@/components/opportunity/MessageDialog'
import { SellerReferrals } from '@/components/property/SellerReferrals'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { ago, firstName } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { useDemo, type Outreach } from '@/store/demo'

// Lead tracking: every homeowner who is engaging with the agent, in one place. What needs doing now
// comes first (claim a referral, update Revive, answer a reply, follow up on a report they opened),
// then the seller referrals from Revive, then everyone else's activity on reports and outreach.

type Status = { label: string; icon: typeof Mail; cls: string; at?: number; text: string }

/** Where a lead stands with the agent's report and emails, newest signal first. */
function statusOf(o: Opportunity, out: Outreach | undefined, logged: string[] | undefined): Status | null {
  const first = o.person ? firstName(o.person.name) : 'The homeowner'
  if (out?.reply && !out.answeredAt) return { label: 'Replied', icon: Reply, cls: 'bg-[var(--brand-primary)] text-white', at: out.reply.at, text: `“${out.reply.text}”` }
  if (out?.answeredAt) return { label: 'You replied', icon: MailCheck, cls: 'bg-ok-soft text-[var(--green)]', at: out.answeredAt, text: `Waiting on ${first}` }
  if (out?.openedAt) return { label: 'Opened email', icon: Eye, cls: 'bg-[var(--brand-primary-subtle)] text-brand', at: out.openedAt, text: `“${out.subject}”` }
  if (out) return { label: 'Emailed', icon: Mail, cls: 'bg-head text-ink-2', at: out.sentAt, text: `“${out.subject}” · not opened yet` }
  const opened = logged?.find((l) => /opened the report/.test(l))
  if (opened) return { label: 'Opened report', icon: Eye, cls: 'bg-[var(--brand-primary-subtle)] text-brand', text: `${first} opened the Revive AI report you shared · ${opened.split(' · ').pop()}` }
  const shared = logged?.find((l) => /shared the Revive AI report/.test(l))
  if (shared) return { label: 'Report shared', icon: Send, cls: 'bg-head text-ink-2', text: `Shared ${shared.split(' · ').pop()} · not opened yet` }
  const signal = leadSignal(o, logged)
  if (signal) return { label: 'Engaged', icon: FileText, cls: 'bg-ok-soft text-[var(--green)]', text: signal }
  return null
}

interface Action {
  tone: 'hot' | 'brand'
  cta: string
  run: () => void
}

/** One line in Lead activity: a referral or an engaged opportunity, and the quick action when it needs one. */
interface Row {
  o: Opportunity
  st: Status
  action?: Action
}

export default function LeadTracking() {
  const opps = useOpportunities()
  const tier = useDemo((s) => s.tier)
  const outreach = useDemo((s) => s.outreach)
  const activity = useDemo((s) => s.activity)
  const claim = useDemo((s) => s.claimReferral)
  const markUpdated = useDemo((s) => s.markReferralUpdated)
  const now = useNow(20_000)
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [msgId, setMsgId] = useState<string | null>(null)

  const needle = q.trim().toLowerCase()
  const match = (o: Opportunity) => !needle || [o.property.address, o.property.city, o.person?.name].some((f) => f?.toLowerCase().includes(needle))
  const refs = opps.filter((o) => o.referral && match(o))
  const engaged = opps
    .filter((o) => !o.referral && match(o))
    .map((o) => ({ o, st: statusOf(o, outreach[o.id], activity[o.id]) }))
    .filter((x): x is { o: Opportunity; st: Status } => !!x.st)
    .sort((a, b) => (b.st.at ?? 0) - (a.st.at ?? 0))

  // one list: referrals that need something, and everyone engaging with reports and emails.
  // Rows that need the agent are highlighted, carry their quick action and sort first.
  const rows: Row[] = []
  for (const o of refs) {
    const r = o.referral!
    const first = o.person ? firstName(o.person.name) : 'the homeowner'
    if (r.status === 'new' && !r.claimedAt && r.expiresAt > now) {
      const hrs = Math.max(1, Math.round((r.expiresAt - now) / 3_600_000))
      rows.push({
        o,
        st: { label: 'New referral', icon: UserRound, cls: 'bg-[var(--teal-soft)] text-[var(--green)]', text: `Seller referral from Revive · ${hrs} hr${hrs === 1 ? '' : 's'} left to claim before it goes to another agent` },
        action: {
          tone: 'hot',
          cta: 'Claim lead',
          run: () => {
            claim(o.id)
            toast.success('Lead claimed', { description: `Revive let ${first} know you’ll reach out today.` })
          },
        },
      })
    } else if (r.needsUpdateNow)
      rows.push({
        o,
        st: { label: 'Update due', icon: Clock, cls: 'bg-[var(--brand-primary-subtle)] text-brand', text: r.status === 'contacted' ? `You met ${first}. Tell Revive how the home visit went.` : `Revive needs a status update on ${first} to keep sending you leads.` },
        action: {
          tone: 'brand',
          cta: 'Send update',
          run: () => {
            markUpdated(o.id)
            toast.success('Update sent to Revive')
          },
        },
      })
  }
  for (const { o, st } of engaged) {
    const first = o.person ? firstName(o.person.name) : 'the homeowner'
    if (st.label === 'Replied') rows.push({ o, st, action: { tone: 'hot', cta: 'Reply with draft', run: () => setMsgId(o.id) } })
    else if ((st.label === 'Engaged' || st.label === 'Opened report') && o.person) rows.push({ o, st, action: { tone: 'brand', cta: `Email ${first}`, run: () => setMsgId(o.id) } })
    else rows.push({ o, st })
  }
  const rank = (r: Row) => (r.action?.tone === 'hot' ? 2 : r.action ? 1 : 0)
  rows.sort((a, b) => rank(b) - rank(a) || (b.st.at ?? 0) - (a.st.at ?? 0))
  const todo = rows.filter((r) => r.action).length

  const open = opps.find((o) => o.id === openId) ?? null
  const msg = opps.find((o) => o.id === msgId)

  return (
    <div className={PAGE}>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Lead tracking</h1>
          <p className="mt-1 text-[15px] text-ink-2">Every homeowner engaging with you: seller referrals from Revive, and who’s opening your reports and emails.</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or address"
            aria-label="Search name or address"
            className="h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[14px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
          />
        </label>
      </header>

      {refs.length ? (
        <SellerReferrals opps={refs} />
      ) : (
        !needle && (
          <div className="mt-8 flex items-start gap-3 rounded-xl border border-dashed border-line px-5 py-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
              <UserRound className="size-4" />
            </span>
            <div>
              <p className="text-[14.5px] font-semibold text-ink">No seller referrals yet</p>
              <p className="mt-1 text-[13.5px] text-ink-2">
                {tier === 'partner'
                  ? 'New referrals from Revive show up here first.'
                  : 'Revive Partners get seller leads: homeowners nearby who are ready to sell, sent to them first. Close two deals with Revive to become a Partner.'}
              </p>
            </div>
          </div>
        )
      )}

      <section className="mt-10" aria-labelledby="lead-activity-all">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
            <Eye className="size-4" />
          </span>
          <h2 id="lead-activity-all" className="text-xl font-semibold text-ink">
            Lead activity
          </h2>
          {todo > 0 && <span className="rounded-full bg-[var(--brand-primary-subtle)] px-2 py-0.5 text-[12px] font-semibold text-brand tabular-nums">{todo} need action</span>}
        </div>
        <p className="mt-1.5 mb-4 text-[13px] text-muted">Seller referrals that need you, and homeowners engaging with your Revive AI reports and emails. What needs action is first.</p>
        {rows.length ? (
          <ul className="flex flex-col gap-2">
            {rows.map(({ o, st, action }) => {
              const Icon = st.icon
              return (
                <li
                  key={o.id}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border bg-white py-2.5 pr-3 pl-4',
                    action?.tone === 'hot' ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] ring-1 ring-[var(--brand-primary)]' : action ? 'border-[var(--brand-primary-border)] ring-1 ring-[var(--brand-primary-border)]' : 'border-line',
                  )}
                >
                  <button type="button" onClick={() => setOpenId(o.id)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                    <img src={img(o)} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                    <span className="w-52 min-w-0 shrink-0">
                      <span className="block truncate text-[14.5px] font-semibold text-ink">{o.property.address}</span>
                      <span className="block truncate text-[13px] text-muted">{o.person?.name ?? o.property.city}</span>
                    </span>
                    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold', st.cls)}>
                      <Icon className="size-3.5" /> {st.label}
                    </span>
                    <span className="hidden min-w-0 flex-1 truncate text-[13px] text-ink-2 md:block">{st.text}</span>
                    {st.at && <span className="shrink-0 text-[12.5px] text-muted">{ago(st.at, now)}</span>}
                  </button>
                  {action ? (
                    <Button size="sm" className="h-9 w-40 shrink-0" onClick={action.run}>
                      {action.cta} <ArrowRight />
                    </Button>
                  ) : (
                    <span className="w-40 shrink-0" />
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">
            {needle ? `No leads match “${q.trim()}”.` : 'Share a Revive AI report or email a homeowner from Opportunities, and you’ll see here when they open or reply.'}
          </p>
        )}
      </section>

      <OppDrawer o={open} onClose={() => setOpenId(null)} />
      {msg?.person && <MessageDialog o={msg} open onOpenChange={(v) => !v && setMsgId(null)} />}
    </div>
  )
}
