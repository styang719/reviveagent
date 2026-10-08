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
  key: string
  o: Opportunity
  tone: 'hot' | 'brand'
  title: string
  body: string
  cta: string
  run: () => void
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

  // what can't wait: each with the one thing to do
  const actions: Action[] = []
  for (const o of refs) {
    const r = o.referral!
    const first = o.person ? firstName(o.person.name) : 'the homeowner'
    if (r.status === 'new' && !r.claimedAt && r.expiresAt > now) {
      const hrs = Math.max(1, Math.round((r.expiresAt - now) / 3_600_000))
      actions.push({
        key: `claim-${o.id}`,
        o,
        tone: 'hot',
        title: `Claim ${o.property.address}`,
        body: `New seller referral from Revive. ${hrs} hr${hrs === 1 ? '' : 's'} left before it goes to another agent.`,
        cta: 'Claim lead',
        run: () => {
          claim(o.id)
          toast.success('Lead claimed', { description: `Revive let ${first} know you’ll reach out today.` })
        },
      })
    } else if (r.needsUpdateNow) {
      actions.push({
        key: `upd-${o.id}`,
        o,
        tone: 'brand',
        title: `Update Revive on ${o.property.address}`,
        body: r.status === 'contacted' ? `You met ${first}. Tell Revive how the home visit went.` : `Revive needs a status update on ${first} to keep sending you leads.`,
        cta: 'Send update',
        run: () => {
          markUpdated(o.id)
          toast.success('Update sent to Revive')
        },
      })
    }
  }
  for (const { o, st } of engaged) {
    const first = o.person ? firstName(o.person.name) : 'the homeowner'
    if (st.label === 'Replied')
      actions.push({ key: `rep-${o.id}`, o, tone: 'hot', title: `${first} replied about ${o.property.address}`, body: st.text, cta: 'Reply with Revive’s draft', run: () => setMsgId(o.id) })
    else if ((st.label === 'Engaged' || st.label === 'Opened report') && o.person)
      actions.push({ key: `eng-${o.id}`, o, tone: 'brand', title: `Follow up with ${first}`, body: st.text, cta: `Email ${first}`, run: () => setMsgId(o.id) })
  }

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

      {actions.length > 0 && (
        <section className="mt-8" aria-labelledby="do-now">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-hot-soft text-hot">
              <Clock className="size-4" />
            </span>
            <h2 id="do-now" className="text-xl font-semibold text-ink">
              Do this now
            </h2>
            <span className="rounded-full bg-hot-soft px-2 py-0.5 text-[12px] font-semibold text-hot-ink tabular-nums">{actions.length}</span>
          </div>
          <p className="mt-1.5 mb-4 text-[13px] text-muted">Leads waiting on you. Each one has the next step ready.</p>
          <ul className="flex flex-col gap-3">
            {actions.map((a) => (
              <li
                key={a.key}
                className={cn(
                  'flex flex-wrap items-center gap-4 rounded-xl border bg-white p-3 pr-4 shadow-card',
                  a.tone === 'hot' ? 'border-hot-line ring-1 ring-hot-line' : 'border-[var(--brand-primary-border)] ring-1 ring-[var(--brand-primary-border)]',
                )}
              >
                <img src={img(a.o)} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                <button type="button" onClick={() => setOpenId(a.o.id)} className="min-w-0 flex-1 text-left">
                  <p className="text-[14.5px] font-semibold text-ink">{a.title}</p>
                  <p className="line-clamp-2 text-[13px] text-ink-2">{a.body}</p>
                </button>
                <Button className={cn('h-10 shrink-0', a.tone === 'hot' && 'bg-hot hover:bg-hot-ink')} onClick={a.run}>
                  {a.cta} <ArrowRight />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

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
          <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{engaged.length}</span>
        </div>
        <p className="mt-1.5 mb-4 text-[13px] text-muted">Homeowners engaging with your Revive AI reports and emails, from your opportunities.</p>
        {engaged.length ? (
          <ul className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
            {engaged.map(({ o, st }, i) => {
              const Icon = st.icon
              return (
                <li key={o.id} className={cn(i > 0 && 'border-t border-line-soft')}>
                  <button type="button" onClick={() => setOpenId(o.id)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-head/70">
                    <img src={img(o)} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                    <span className="w-56 min-w-0 shrink-0">
                      <span className="block truncate text-[14.5px] font-semibold text-ink">{o.property.address}</span>
                      <span className="block truncate text-[13px] text-muted">{o.person?.name ?? o.property.city}</span>
                    </span>
                    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-semibold', st.cls)}>
                      <Icon className="size-3.5" /> {st.label}
                    </span>
                    <span className="hidden min-w-0 flex-1 truncate text-[13px] text-ink-2 md:block">{st.text}</span>
                    {st.at && <span className="ml-auto shrink-0 text-[12.5px] text-muted">{ago(st.at, now)}</span>}
                  </button>
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
