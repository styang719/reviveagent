import { ArrowRight, Eye, FileText, Mail, MailCheck, Reply, Search, Send, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RevivePathCard } from '@/components/home/RevivePathCard'
import { img, leadSignal, OppDrawer } from '@/components/home/TopOpportunities'
import { MessageDialog } from '@/components/opportunity/MessageDialog'
import { SellerReferrals } from '@/components/property/SellerReferrals'
import { Button } from '@/components/ui/button'
import { useNow } from '@/hooks/useNow'
import { ago, firstName } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import type { Tier } from '@/data/types'
import { useDemo, type Outreach } from '@/store/demo'

// Lead tracking: seller referrals from Revive (their actions live on the cards), then Lead activity:
// every opportunity homeowner engaging with the agent, from Revive (emails sent from Opportunities, shared
// reports, the lead form) and synced from the CRM. Built to stay usable when it's long: filter by what
// happened, highlight replies waiting on the agent, and select many to send a quick follow-up at once.

type Kind = 'reply' | 'opened' | 'engaged' | 'sent' | 'answered'
interface Row {
  o: Opportunity
  kind: Kind
  label: string
  icon: typeof Mail
  text: string
  when: string
  at: number // for sorting; 0 when only a date label is known
  source: 'Revive' | 'Follow Up Boss'
}

const DAY = 86_400_000
const PILL: Record<Kind, string> = {
  reply: 'bg-[var(--brand-primary)] text-white',
  opened: 'bg-[var(--brand-primary-subtle)] text-brand',
  engaged: 'bg-ok-soft text-[var(--green)]',
  sent: 'bg-head text-ink-2',
  answered: 'bg-ok-soft text-[var(--green)]',
}

/** The latest thing a homeowner did, from Revive first and then what the CRM synced. */
function rowOf(o: Opportunity, out: Outreach | undefined, logged: string[] | undefined, now: number): Row | null {
  const first = o.person ? firstName(o.person.name) : 'The homeowner'
  const base = { o, source: 'Revive' as const }
  if (out?.reply && !out.answeredAt) return { ...base, kind: 'reply', label: 'Replied', icon: Reply, text: `“${out.reply.text}”`, when: ago(out.reply.at, now), at: out.reply.at }
  if (out?.answeredAt) return { ...base, kind: 'answered', label: 'You replied', icon: MailCheck, text: `Waiting on ${first}`, when: ago(out.answeredAt, now), at: out.answeredAt }
  if (out?.openedAt) return { ...base, kind: 'opened', label: 'Opened email', icon: Eye, text: `“${out.subject}”`, when: ago(out.openedAt, now), at: out.openedAt }
  if (out) return { ...base, kind: 'sent', label: 'Emailed', icon: Mail, text: `“${out.subject}” · not opened yet`, when: ago(out.sentAt, now), at: out.sentAt }
  const opened = logged?.find((l) => /opened the report/.test(l))
  if (opened) return { ...base, kind: 'opened', label: 'Opened report', icon: Eye, text: 'Opened the Revive AI report you shared', when: opened.split(' · ').pop() ?? '', at: now - DAY / 2 }
  const shared = logged?.find((l) => /shared the Revive AI report/.test(l))
  if (shared) return { ...base, kind: 'sent', label: 'Report shared', icon: Send, text: 'Revive AI report shared · not opened yet', when: shared.split(' · ').pop() ?? '', at: now - DAY }
  const signal = leadSignal(o, logged)
  if (signal) return { ...base, kind: 'engaged', label: 'Ran a report', icon: FileText, text: (() => { const t = signal.replace(new RegExp(`^${first} `), ''); return t.charAt(0).toUpperCase() + t.slice(1) })(), when: `${o.property.facts.leadFormDaysAgo ?? 2} days ago`, at: now - (o.property.facts.leadFormDaysAgo ?? 2) * DAY }
  // synced from the CRM: a recent reply or an email they opened
  const h = o.person?.history?.find((x) => x.daysAgo <= 90 && (x.inbound || (x.kind === 'email' && x.tag && /^Opened/.test(x.tag))))
  if (h) {
    const when = h.daysAgo < 14 ? `${h.daysAgo} days ago` : `${Math.round(h.daysAgo / 7)} weeks ago`
    return h.inbound
      ? { o, source: 'Follow Up Boss', kind: 'reply', label: 'Replied', icon: Reply, text: `“${(h.body ?? '').replace(/^"|"$/g, '')}”`, when, at: now - h.daysAgo * DAY }
      : { o, source: 'Follow Up Boss', kind: 'opened', label: /twice/.test(h.tag!) ? 'Opened 2×' : /(\d+) times/.test(h.tag!) ? `Opened ${/(\d+) times/.exec(h.tag!)![1]}×` : 'Opened email', icon: Eye, text: h.title.replace(/^Emailed: /, '“') + '”', when, at: now - h.daysAgo * DAY }
  }
  return null
}

const FILTERS: { k: 'all' | Kind; label: string }[] = [
  { k: 'all', label: 'All' },
  { k: 'reply', label: 'Replied' },
  { k: 'opened', label: 'Opened' },
  { k: 'engaged', label: 'Ran a report' },
  { k: 'sent', label: 'Waiting to open' },
]
const SHOW = 8

export default function LeadTracking() {
  const opps = useOpportunities()
  const tier = useDemo((s) => s.tier)
  const outreach = useDemo((s) => s.outreach)
  const activity = useDemo((s) => s.activity)
  const now = useNow(20_000)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | Kind>('all')
  const [all, setAll] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [msgId, setMsgId] = useState<string | null>(null)

  const needle = q.trim().toLowerCase()
  const match = (o: Opportunity) => !needle || [o.property.address, o.property.city, o.person?.name].some((f) => f?.toLowerCase().includes(needle))
  const refs = opps.filter((o) => o.referral && match(o))
  const rows = opps
    .filter((o) => !o.referral && match(o))
    .map((o) => rowOf(o, outreach[o.id], activity[o.id], now))
    .filter((r): r is Row => !!r)
    // a reply waiting on you first, then newest
    .sort((a, b) => Number(b.kind === 'reply') - Number(a.kind === 'reply') || b.at - a.at)
  const shown = rows.filter((r) => filter === 'all' || r.kind === filter)
  const visible = all ? shown : shown.slice(0, SHOW)
  const waiting = rows.filter((r) => r.kind === 'reply').length


  const open = opps.find((o) => o.id === openId) ?? null
  const msg = opps.find((o) => o.id === msgId)

  return (
    <div className={PAGE}>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Lead tracking</h1>
          <p className="mt-1 text-[15px] text-ink-2">Seller referrals from Revive, and every homeowner opening your reports and emails.</p>
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
        !needle && <ReferralsEmpty tier={tier} opps={opps} />
      )}

      <section className="mt-10" aria-labelledby="lead-activity-all">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
            <Eye className="size-4" />
          </span>
          <h2 id="lead-activity-all" className="text-xl font-semibold text-ink">
            Lead activity
          </h2>
          <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">{rows.length}</span>
          {waiting > 0 && <span className="rounded-full bg-[var(--brand-primary)] px-2 py-0.5 text-[12px] font-semibold text-white tabular-nums">{waiting} waiting on you</span>}
        </div>
        <p className="mt-1.5 text-[13px] text-muted">From your opportunities: emails and reports you sent with Revive, the lead form, and activity synced from Follow Up Boss.</p>

        <div className={cn('mt-4 flex flex-wrap items-center justify-between gap-3', !rows.length && 'hidden')}>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filter lead activity">
            {FILTERS.map((f) => {
              const n = f.k === 'all' ? rows.length : rows.filter((r) => r.kind === f.k).length
              if (!n && f.k !== 'all') return null
              const on = filter === f.k
              return (
                <button
                  key={f.k}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setFilter(f.k)}
                  className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-line bg-white text-ink hover:border-[var(--brand-primary-border)]')}
                >
                  {f.label} <span className={cn('text-[12px] tabular-nums', on ? 'text-white/85' : 'text-muted')}>{n}</span>
                </button>
              )
            })}
          </div>
        </div>

        {shown.length ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <ul>
              {visible.map((r, i) => {
                const Icon = r.icon
                const reply = r.kind === 'reply'
                return (
                  <li key={r.o.id} className={cn('relative flex items-center gap-3 py-2.5 pr-3 pl-4', i > 0 && 'border-t border-line-soft', reply && 'bg-[var(--brand-primary-subtle)]')}>
                    {reply && <span className="absolute top-0 bottom-0 left-0 w-[3px] bg-[var(--brand-primary)]" aria-hidden="true" />}
                    <button type="button" onClick={() => setOpenId(r.o.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <img src={img(r.o)} alt="" className="size-9 shrink-0 rounded-md object-cover" />
                      <span className="w-48 min-w-0 shrink-0">
                        <span className="block truncate text-[14px] font-semibold text-ink">{r.o.property.address}</span>
                        <span className="block truncate text-[12.5px] text-muted">{r.o.person?.name ?? r.o.property.city}</span>
                      </span>
                      <span className={cn('inline-flex w-[128px] shrink-0 items-center gap-1.5 truncate rounded-md px-2 py-1 text-[12px] font-semibold', PILL[r.kind])}>
                        <Icon className="size-3.5 shrink-0" /> <span className="truncate">{r.label}</span>
                      </span>
                      <span className="hidden min-w-0 flex-1 truncate text-[13px] text-ink-2 md:block">{r.text}</span>
                      <span className="hidden w-[112px] shrink-0 text-right text-[12px] text-muted lg:block">
                        {r.when}
                        <span className="block text-[11px] text-faint">{r.source}</span>
                      </span>
                    </button>
                    {r.o.person ? (
                      reply && r.source === 'Revive' ? (
                        <Button size="sm" className="h-8 w-[104px] shrink-0" onClick={() => setMsgId(r.o.id)}>
                          <Reply /> Reply
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 w-[104px] shrink-0 text-brand" onClick={() => setMsgId(r.o.id)}>
                          <Mail /> {reply ? 'Reply' : 'Follow up'}
                        </Button>
                      )
                    ) : (
                      <span className="w-[104px] shrink-0" />
                    )}
                  </li>
                )
              })}
            </ul>
            {shown.length > SHOW && (
              <button type="button" onClick={() => setAll((v) => !v)} className="w-full border-t border-line-soft py-2.5 text-[13px] font-medium text-brand hover:bg-head">
                {all ? 'Show less' : `Show all ${shown.length}`}
              </button>
            )}
          </div>
        ) : (
          needle || rows.length ? (
            <p className="mt-3 rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">{needle ? `No leads match “${q.trim()}”.` : 'Nothing in this filter yet.'}</p>
          ) : (
            <ActivityEmpty />
          )
        )}
      </section>

      <OppDrawer o={open} onClose={() => setOpenId(null)} />
      {msg?.person && <MessageDialog o={msg} open onOpenChange={(v) => !v && setMsgId(null)} />}
    </div>
  )
}

/** No referrals yet: keep the section, and show the path to Partner (same card as the dashboard). */
function ReferralsEmpty({ tier, opps }: { tier: Tier; opps: Opportunity[] }) {
  const partner = tier === 'partner'
  return (
    <section className="mt-8" aria-labelledby="referrals-title">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
          <UserRound className="size-4" />
        </span>
        <h2 id="referrals-title" className="text-xl font-semibold text-ink">
          Your seller referrals from Revive
        </h2>
        <span className="rounded-full bg-line-soft px-2 py-0.5 text-[12px] font-medium text-ink-2 tabular-nums">0</span>
      </div>
      <p className="mt-1.5 mb-5 text-[13px] text-muted">
        {partner ? 'New referrals from Revive show up here first, exclusive to you for 24 hours.' : 'Homeowners nearby who are ready to sell, sent to Revive Partners first.'}
      </p>
      {partner ? (
        <p className="rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">No referrals right now.</p>
      ) : (
        <div className="max-w-xl">
          <RevivePathCard tier={tier} opps={opps} />
        </div>
      )}
    </section>
  )
}

const SAMPLES: { addr: string; who: string; kind: Kind; label: string; icon: typeof Mail; text: string; when: string }[] = [
  { addr: '2210 Hillcrest Rd', who: 'Maria Lopez', kind: 'reply', label: 'Replied', icon: Reply, text: '“Thanks! Could we talk this week about the kitchen?”', when: '12 min ago' },
  { addr: '87 Ashby Ct', who: 'Tom Reyes', kind: 'opened', label: 'Opened report', icon: Eye, text: 'Opened the Revive AI report you shared, 3 times', when: '2 hours ago' },
  { addr: '415 Grove St', who: 'Priya Shah', kind: 'engaged', label: 'Ran a report', icon: FileText, text: 'Ran a Revive AI report through your lead form', when: 'Yesterday' },
  { addr: '960 Marin Ave', who: 'Ben Carter', kind: 'sent', label: 'Emailed', icon: Mail, text: '“What your home could sell for after a refresh” · not opened yet', when: '2 days ago' },
]

/** No activity yet: show what will land here, faded, with one clear way to start. */
function ActivityEmpty() {
  return (
    <div className="relative mt-3 overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <ul aria-hidden="true" className="pointer-events-none select-none opacity-55">
        {SAMPLES.map((r, i) => {
          const Icon = r.icon
          return (
            <li key={r.addr} className={cn('flex items-center gap-3 py-2.5 pr-3 pl-4', i > 0 && 'border-t border-line-soft')}>
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[var(--brand-primary-subtle)] text-[12px] font-semibold text-brand">
                {r.who.split(' ').map((w) => w[0]).join('')}
              </span>
              <span className="w-48 min-w-0 shrink-0">
                <span className="block truncate text-[14px] font-semibold text-ink">{r.addr}</span>
                <span className="block truncate text-[12.5px] text-muted">{r.who}</span>
              </span>
              <span className={cn('inline-flex w-[128px] shrink-0 items-center gap-1.5 truncate rounded-md px-2 py-1 text-[12px] font-semibold', PILL[r.kind])}>
                <Icon className="size-3.5 shrink-0" /> <span className="truncate">{r.label}</span>
              </span>
              <span className="hidden min-w-0 flex-1 truncate text-[13px] text-ink-2 md:block">{r.text}</span>
              <span className="hidden w-[112px] shrink-0 text-right text-[12px] text-muted lg:block">{i > 0 && r.when}</span>
            </li>
          )
        })}
      </ul>
      <span className="absolute top-3 right-3 rounded-full bg-line-soft px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted uppercase">Example</span>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-[var(--brand-primary-subtle)] px-5 py-4">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">See who’s ready to talk</p>
          <p className="mt-0.5 text-[13.5px] text-ink-2">Share a Revive AI report or email a homeowner, and you’ll see here the moment they open it or reply.</p>
        </div>
        <Button asChild className="shrink-0">
          <Link to="/opportunities">
            Send your first report <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  )
}
