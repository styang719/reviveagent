import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, ArrowRight, Check, CheckCheck, Eye, Hammer, HousePlus, Mail, MailCheck, Reply, SearchCheck, Signpost, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AiLink } from '@/components/ai/AiLink'
import { ADVISOR } from '@/components/home/AdvisorCard'
import { ContactTimeline } from '@/components/opportunity/ContactTimeline'
import { MessageDialog } from '@/components/opportunity/MessageDialog'
import { useCta } from '@/components/opportunity/useCta'
import { Button, buttonVariants } from '@/components/ui/button'
import type { Source } from '@/data/types'
import { photoUrl } from '@/lib/assets'
import { ago, firstName, gain, money } from '@/lib/format'
import { useNow } from '@/hooks/useNow'
import { STAGE_LABEL, useIsProperty, useProgress, type Opportunity, type Tag } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo, type Outreach } from '@/store/demo'

// Home's weekly to-do: the top opportunities as a checklist of cards. Each card reads left to right
// (home, where it came from, status, value, upside, priority); clicking it opens the details drawer
// with the one next action.

const SOURCE: Record<Source, string> = {
  listings: 'MLS listing',
  contacts: 'Contact',
  leadform: 'Lead form',
  revive: 'Revive lead',
  search: 'Report you ran',
}

const PRIORITY = {
  high: { label: 'High', cls: 'border-hot-line bg-hot-soft text-hot-ink', dot: 'bg-hot' },
  medium: { label: 'Medium', cls: 'border-[var(--brand-primary-border)] bg-[var(--brand-primary-subtle)] text-brand', dot: 'bg-[var(--brand-primary)]' },
  low: { label: 'Low', cls: 'border-[var(--teal-soft)] bg-ok-soft text-[var(--green)]', dot: 'bg-[var(--green)]' },
}

/** Priority within the week's list, from the "why now" score (a strong trigger like an expired listing is High). */
const priorityOf = (o: Opportunity) => (o.score.score >= 65 || o.cta.kind === 'claim' ? 'high' : o.score.score >= 50 ? 'medium' : 'low')

function Priority({ o }: { o: Opportunity }) {
  const p = PRIORITY[priorityOf(o)]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-px text-[11px] font-medium whitespace-nowrap', p.cls)}>
      <span className={cn('size-1.5 rounded-full', p.dot)} aria-hidden="true" />
      {p.label}
    </span>
  )
}

/** Listed: days on market. Not listed: how likely they are to sell. */
function status(o: Opportunity): { main: string; sub?: string; hot?: boolean } {
  const dom = o.property.facts.daysOnMarket
  if (o.property.source === 'listings' && dom !== undefined) {
    return { main: 'Listed', sub: `${dom} DOM`, hot: dom > 30 }
  }
  const score = o.person?.sellScore
  if (score !== undefined) return { main: score >= 80 ? 'Likely seller' : score >= 70 ? 'Could sell' : 'Not listed', sub: `Selling score ${score}`, hot: score >= 80 }
  return { main: 'Not listed', sub: o.reasons[0] }
}

/** A small ring gauge: the number in the middle, the ring filled to pct. */
function Ring({ value, pct, color }: { value: number; pct: number; color: string }) {
  const r = 15
  const c = 2 * Math.PI * r
  return (
    <span className="relative grid size-10 shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--line-soft, #eef0f4)" strokeWidth="3.5" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${c * Math.min(1, pct)} ${c}`} />
      </svg>
      <span className="text-[13px] font-bold text-ink tabular-nums">{value}</span>
    </span>
  )
}

/** Not listed: the selling score as a ring. Your listing: a Listed badge with days on market. */
function ScoreCell({ o }: { o: Opportunity }) {
  const dom = o.property.facts.daysOnMarket
  // already on the market: a selling score means nothing here, so show where the listing stands
  if (o.property.source === 'listings' && dom !== undefined)
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary-subtle)] px-2 py-1 text-[12px] font-semibold text-brand">
          <Signpost className="size-3.5" /> Listed
        </span>
        <span className={cn('text-[12.5px] whitespace-nowrap tabular-nums', dom > 30 ? 'font-medium text-hot' : 'text-muted')}>{dom} days on market</span>
      </div>
    )
  const score = o.person?.sellScore
  if (score === undefined) return <span className="text-[13px] text-muted">No score yet</span>
  // worded apart from the High / Medium / Low priority badge on the same card
  const [label, color] = score >= 80 ? ['Likely', 'var(--green)'] : score >= 60 ? ['Could sell', 'var(--teal)'] : ['Unlikely', 'var(--amber)']
  return (
    <div className="flex items-center gap-2.5" title="Selling score: how likely the owner is to sell">
      <Ring value={score} pct={score / 100} color={color} />
      <span className="text-[13px] leading-4 font-medium whitespace-nowrap text-ink-2">
        {label}
        <span className="block text-[11px] font-normal text-faint">Selling score</span>
      </span>
    </div>
  )
}

const TAG: Record<Tag, { icon: typeof Hammer; cls: string }> = {
  'Listing issue': { icon: AlertTriangle, cls: 'bg-[var(--amber-soft)] text-[var(--amber)]' },
  'ADU room': { icon: HousePlus, cls: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]' },
  Renovation: { icon: Hammer, cls: 'bg-[var(--brand-primary-subtle)] text-brand' },
  'Data check': { icon: SearchCheck, cls: 'bg-head text-ink-2' },
}

function TagPill({ tag }: { tag: Tag }) {
  const t = TAG[tag]
  const Icon = t.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold whitespace-nowrap', t.cls)}>
      <Icon className="size-3.5" /> {tag}
    </span>
  )
}

/** What Revive spots on the home: listing issue first (it's the reason to call), then ADU room, then renovation. */
const ORDER: Tag[] = ['Listing issue', 'ADU room', 'Renovation', 'Data check']
const tagsOf = (o: Opportunity) => [...o.tags].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)).slice(0, 2)

const img = (o: Opportunity) => o.photo ?? photoUrl(o.property.photo)

/** The one thing to do next, worded for the relationship: your seller vs. someone you're winning. */
function NextAction({ o, onDone }: { o: Opportunity; onDone?: () => void }) {
  const runCta = useCta()
  const share = useDemo((s) => s.shareReport)
  const progress = useProgress()(o)
  const isProperty = useIsProperty()
  const name = o.person ? firstName(o.person.name) : 'the homeowner'
  const cls = cn(buttonVariants(), 'h-10 flex-1')
  const arrow = <ArrowRight />

  if (progress?.kind === 'share')
    return (
      <button
        className={cls}
        onClick={() => {
          share(o.id, o.property.address, o.person?.name)
          toast.success(`Report shared with ${o.person?.name ?? 'the homeowner'}`, { description: 'You’ll see on Home when it’s opened.' })
          onDone?.()
        }}
      >
        {progress.next} {arrow}
      </button>
    )
  if (progress?.kind === 'project')
    return (
      <AiLink to={`/ai?flow=project&property=${o.id}`} className={cls} onClick={onDone}>
        Propose a Revive project {arrow}
      </AiLink>
    )
  if (progress?.kind === 'open')
    return (
      <Link to={`/property/${o.id}?tab=project`} className={cls}>
        Open project {arrow}
      </Link>
    )
  if (o.cta.kind === 'claim' || o.cta.kind === 'followup' || isProperty(o))
    return (
      <button
        className={cls}
        onClick={() => {
          runCta(o)
          onDone?.()
        }}
      >
        {o.cta.label} {arrow}
      </button>
    )
  return (
    <AiLink to={`/ai?flow=report&property=${o.id}`} className={cls} onClick={onDone}>
      {o.property.source === 'listings' ? `Show ${name} what Revive adds` : `Send ${name} their home’s value`} {arrow}
    </AiLink>
  )
}

function OppDrawer({ o, onClose }: { o: Opportunity | null; onClose: () => void }) {
  const progress = useProgress()
  const isProperty = useIsProperty()
  const checked = useDemo((s) => s.checked)
  const toggle = useDemo((s) => s.toggleChecked)
  const [msg, setMsg] = useState(false)
  return (
    <DialogPrimitive.Root open={!!o} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy-3/30" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(480px,100vw)] flex-col bg-white shadow-2xl focus:outline-none" aria-describedby={undefined}>
          {o && (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="relative h-52 bg-line-soft">
                  {img(o) && <img src={img(o)} alt={`Photo of ${o.property.address}`} className="size-full object-cover" />}
                  <DialogPrimitive.Close className="absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-white/95 text-ink shadow-sm hover:bg-white" aria-label="Close">
                    <X className="size-4" />
                  </DialogPrimitive.Close>
                </div>
                <div className="flex flex-col gap-6 p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Priority o={o} />
                      <span className="rounded-lg bg-head px-2.5 py-1 text-[12.5px] font-medium text-ink-2">{SOURCE[o.property.source]}</span>
                      <span className="rounded-lg bg-head px-2.5 py-1 text-[12.5px] font-medium text-ink-2">{progress(o)?.label ?? (o.stage === 'spotted' ? 'Not started' : STAGE_LABEL[o.stage])}</span>
                    </div>
                    <DialogPrimitive.Title className="mt-3 text-xl font-semibold text-ink">{o.property.address}</DialogPrimitive.Title>
                    <p className="text-[13.5px] text-muted">
                      {o.property.city} · {o.property.homeType}
                      {o.property.beds ? ` · ${o.property.beds} bd` : ''}
                      {o.property.baths ? ` · ${o.property.baths} ba` : ''} · {o.property.sqft.toLocaleString()} sqft
                    </p>
                  </div>

                  {o.property.scenarios.length > 0 && (
                    <section className="rounded-2xl border border-[var(--brand-agent-border-subtle,#e0caf2)] bg-[var(--brand-agent-subtle)] p-4">
                      <h3 className="flex items-center gap-1.5 text-[14px] font-semibold text-[var(--brand-agent)]">
                        <Sparkles className="size-4" /> Revive insights
                      </h3>
                      <ul className="mt-3 flex flex-col gap-2.5">
                        {o.property.scenarios.map((s) => (
                          <li key={s.product} className="flex items-baseline justify-between gap-3 rounded-xl bg-white px-3.5 py-2.5 text-[13.5px]">
                            <span className="min-w-0">
                              <span className="font-semibold text-ink">{s.product}</span>
                              <span className="block text-[12.5px] text-muted">{s.note}</span>
                            </span>
                            <span className={cn('shrink-0 font-semibold tabular-nums', s.gain ? 'text-[var(--green)]' : 'text-faint')}>{s.gain ? gain(s.gain) : 'Not eligible'}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {o.person && (
                    <div className="flex items-center gap-3 rounded-xl bg-head px-4 py-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-[13px] font-semibold text-brand">
                        {o.person.name
                          .split(' ')
                          .map((x) => x[0])
                          .slice(0, 2)
                          .join('')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-ink">{o.person.name}</p>
                        <p className="text-[12.5px] text-muted">
                          {o.property.ownerRole === 'Seller' ? 'Your seller' : o.person.relationship} · {o.person.source}
                        </p>
                      </div>
                      <Link to={`/person/${o.person.id}`} className="text-[13px] font-medium text-brand hover:underline">
                        Contact
                      </Link>
                    </div>
                  )}

                  <dl className="grid grid-cols-2 gap-3">
                    {[
                      ['Status', status(o).main, status(o).sub],
                      ['Value today', money(o.property.valueNow), undefined],
                      ['Potential value', o.gain ? money(o.property.valueNow + o.gain) : '—', o.gain ? `${gain(o.gain)} with Revive` : undefined],
                      ['Opportunity', o.product ?? '—', undefined],
                    ].map(([k, v, sub]) => (
                      <div key={k} className="rounded-xl border border-line px-4 py-3">
                        <dt className="text-[11.5px] text-muted">{k}</dt>
                        <dd className="mt-0.5 text-[15px] font-semibold text-ink tabular-nums">{v}</dd>
                        {sub && <dd className={cn('text-[12px]', k === 'Potential value' ? 'font-medium text-[var(--green)]' : 'text-muted')}>{sub}</dd>}
                      </div>
                    ))}
                  </dl>

                  <section>
                    <h3 className="text-[14px] font-semibold text-ink">Why now</h3>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {o.reasons.map((r) => (
                        <li key={r} className="flex gap-2 text-[13.5px] text-ink-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--brand-agent)]" aria-hidden="true" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </section>


                  <ContactTimeline o={o} onMessage={() => setMsg(true)} />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-line bg-white p-4">
                <NextAction o={o} onDone={onClose} />
                {isProperty(o) && (
                  <Button variant="outline" className="h-10" asChild>
                    <Link to={`/property/${o.id}`}>View property</Link>
                  </Button>
                )}
                <Button variant="ghost" className="h-10" onClick={() => toggle(o.id)}>
                  <Check /> {checked[o.id] ? 'Done' : 'Mark done'}
                </Button>
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
      {o?.person && msg && <MessageDialog o={o} open={msg} onOpenChange={setMsg} />}
    </DialogPrimitive.Root>
  )
}

const INTENT: Record<NonNullable<Outreach['reply']>['intent'], { label: string; cls: string }> = {
  interested: { label: 'Interested', cls: 'bg-ok-soft text-[var(--green)]' },
  question: { label: 'Has a question', cls: 'bg-[var(--brand-primary-subtle)] text-brand' },
  'not-now': { label: 'Not now', cls: 'bg-head text-ink-2' },
}

/** Sent → Opened → Replied, as three small steps. */
function Steps({ out }: { out: Outreach }) {
  const steps = [
    ['Sent', true],
    ['Opened', !!out.openedAt],
    ['Replied', !!out.reply],
  ] as const
  return (
    <span className="hidden items-center gap-1.5 text-[11.5px] sm:flex" aria-label="Email progress">
      {steps.map(([label, on], i) => (
        <span key={label} className="flex items-center gap-1.5">
          {i > 0 && <span className={cn('h-px w-4', on ? 'bg-[var(--brand-primary)]' : 'bg-line')} />}
          <span className={cn('size-1.5 rounded-full', on ? 'bg-[var(--brand-primary)]' : 'bg-line')} />
          <span className={on ? 'font-medium text-ink-2' : 'text-faint'}>{label}</span>
        </span>
      ))}
    </span>
  )
}

/**
 * What happened after the agent emailed: waiting, opened, a reply (with what Revive reads in it and the
 * next steps), or answered. Replaces crossing the card out: the to-do isn't done until there's an outcome.
 */
function OutreachStrip({ o, out, onReply }: { o: Opportunity; out: Outreach; onReply: () => void }) {
  const now = useNow(20_000)
  const toggle = useDemo((s) => s.toggleChecked)
  const answer = useDemo((s) => s.answerReply)
  const done = !!useDemo((s) => s.checked[o.id])
  const first = o.person ? firstName(o.person.name) : 'They'
  const stop = (e: React.SyntheticEvent) => e.stopPropagation()

  if (out.reply && !out.answeredAt) {
    const intent = INTENT[out.reply.intent]
    return (
      <div onClick={stop} onKeyDown={stop} className="col-span-full cursor-default rounded-xl border border-[var(--brand-agent-border-subtle,#e0caf2)] bg-[var(--brand-agent-subtle)] p-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <Reply className="size-4 text-[var(--brand-agent)]" />
          <p className="text-[13.5px] font-semibold text-ink">
            {first} replied <span className="font-normal text-muted">· {ago(out.reply.at, now)}</span>
          </p>
          <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-semibold', intent.cls)}>{intent.label}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-5 text-ink-2">“{out.reply.text}”</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={onReply}>
            <Reply /> Reply with Revive’s draft
          </Button>
          {out.reply.intent === 'not-now' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!done) toggle(o.id)
                answer(o.id, `Reminder set: follow up with ${first} in March`)
                toast.success(`We’ll remind you about ${first} in March`)
              }}
            >
              Remind me in spring
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.success(`Call request sent to ${ADVISOR.first} at Revive`, { description: `He’ll reach out within one business day to walk through ${o.property.address} with you.` })
              }
            >
              Book a call with Revive
            </Button>
          )}
        </div>
      </div>
    )
  }
  const [Icon, text, tone] = out.answeredAt
    ? out.reply?.intent === 'not-now'
      ? [CheckCheck, `${first} said not now · reminder set for March`, 'text-[var(--green)]']
      : [CheckCheck, `You replied · ${ago(out.answeredAt, now)} · waiting on ${first}`, 'text-[var(--green)]']
    : out.openedAt
      ? [Eye, `${first} opened your email · ${ago(out.openedAt, now)}`, 'text-brand']
      : [MailCheck, `Emailed · ${ago(out.sentAt, now)} · “${out.subject}”`, 'text-muted']
  return (
    <div className="col-span-full flex items-center justify-between gap-3 rounded-xl bg-head px-3 py-2">
      <p className="flex min-w-0 items-center gap-2 text-[12.5px] text-ink-2">
        <Icon className={cn('size-4 shrink-0', tone)} />
        <span className="truncate">{text}</span>
      </p>
      {!out.answeredAt && <Steps out={out} />}
    </div>
  )
}

function OppRow({ o, onOpen }: { o: Opportunity; onOpen: () => void }) {
  const done = !!useDemo((s) => s.checked[o.id])
  const toggle = useDemo((s) => s.toggleChecked)
  const [msg, setMsg] = useState(false)
  const out = useDemo((s) => s.outreach[o.id])
  const waiting = !!out?.reply && !out.answeredAt
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
        aria-label={`Open ${o.property.address}`}
        className={cn(
          'group grid cursor-pointer grid-cols-[auto_56px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 rounded-2xl border border-line bg-white p-3 pr-4 shadow-card transition-shadow hover:shadow-md',
          'lg:grid-cols-[auto_56px_minmax(0,1.35fr)_minmax(0,0.95fr)_minmax(0,0.7fr)_minmax(0,1fr)_44px] lg:gap-x-3.5',
          waiting && 'border-[var(--brand-agent-border)] ring-1 ring-[var(--brand-agent-border)]',
          done && 'bg-head shadow-none',
        )}
      >
        <button
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark ${o.property.address} done`}
          onClick={(e) => {
            e.stopPropagation()
            toggle(o.id)
          }}
          className={cn(
            'grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
            done ? 'border-[var(--green)] bg-[var(--green)] text-white' : 'border-line bg-white hover:border-brand',
          )}
        >
          {done && <Check className="size-3" strokeWidth={3} />}
        </button>
        <span className="size-14 overflow-hidden rounded-xl bg-line-soft">{img(o) && <img src={img(o)} alt="" className="size-full object-cover" />}</span>
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-semibold text-ink">{o.property.address}</p>
          <p className="truncate text-[13px] text-muted">{o.person?.name ?? o.property.city}</p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="rounded-md bg-head px-1.5 py-0.5 text-[11px] font-medium text-ink-2">{SOURCE[o.property.source]}</span>
            <Priority o={o} />
          </div>
        </div>
        {o.person ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMsg(true)
            }}
            onKeyDown={(e) => e.stopPropagation()}
            aria-label={`Message ${o.person.name}`}
            title={`Message ${firstName(o.person.name)}`}
            className="relative grid size-11 place-items-center justify-self-end rounded-xl border border-line bg-white text-brand transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-subtle)] lg:order-last"
          >
            {out ? <MailCheck className="size-[18px]" /> : <Mail className="size-[18px]" />}
            {waiting && <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-white bg-[var(--brand-agent)]" aria-label="New reply" />}
          </button>
        ) : (
          <span className="lg:order-last" />
        )}
        {/* below lg the numbers wrap to a second row under the home */}
        <div className="col-span-4 flex flex-wrap items-center gap-x-6 gap-y-3 lg:contents">
          <ScoreCell o={o} />
          <div className="min-w-0">
            <p className="text-[16px] font-bold text-ink tabular-nums">{money(o.property.valueNow)}</p>
            {o.gain > 0 && <p className="text-[13px] font-semibold text-[var(--green)] tabular-nums">{gain(o.gain)}</p>}
          </div>
          <div className="flex min-w-0 flex-row flex-wrap items-start gap-1.5 lg:flex-col">
            {tagsOf(o).length ? tagsOf(o).map((t) => <TagPill key={t} tag={t} />) : <span className="text-[13px] text-muted">{o.product ?? '—'}</span>}
          </div>
        </div>
        {out && (
          <div className="col-span-full lg:order-last">
            <OutreachStrip o={o} out={out} onReply={() => setMsg(true)} />
          </div>
        )}
      </div>
      {o.person && msg && <MessageDialog o={o} open={msg} onOpenChange={setMsg} />}
    </li>
  )
}

export function TopOpportunities({ opps }: { opps: Opportunity[] }) {
  const checked = useDemo((s) => s.checked)
  const [openId, setOpenId] = useState<string | null>(null)
  const outreach = useDemo((s) => s.outreach)
  const done = opps.filter((o) => checked[o.id]).length
  const emailed = opps.filter((o) => outreach[o.id]).length
  const replied = opps.filter((o) => outreach[o.id]?.reply && !outreach[o.id]?.answeredAt).length
  const open = opps.find((o) => o.id === openId) ?? null
  // a reply waiting on the agent comes first; everything else keeps its rank
  const rows = [...opps].sort((a, b) => Number(!!(outreach[b.id]?.reply && !outreach[b.id]?.answeredAt)) - Number(!!(outreach[a.id]?.reply && !outreach[a.id]?.answeredAt)))

  return (
    <section aria-labelledby="top-opps">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 id="top-opps" className="text-xl font-semibold text-ink">
            Top opportunities this week
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {done} of {opps.length} done
            {emailed > 0 && ` · ${emailed} emailed`}
            {replied > 0 && (
              <span className="font-semibold text-[var(--brand-agent)]">
                {' '}
                · {replied} {replied === 1 ? 'reply' : 'replies'} waiting
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" className="h-10 shrink-0 px-3 text-[14px] text-brand" asChild>
          <Link to="/opportunities">
            See all opportunities <ArrowRight />
          </Link>
        </Button>
      </div>
      <ul className="flex flex-col gap-3">
        {rows.map((o) => (
          <OppRow key={o.id} o={o} onOpen={() => setOpenId(o.id)} />
        ))}
      </ul>
      <OppDrawer o={open} onClose={() => setOpenId(null)} />
    </section>
  )
}
