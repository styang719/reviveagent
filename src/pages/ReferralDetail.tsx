import { ArrowLeft, Bath, BedDouble, Check, ChartColumn, CircleAlert, CircleX, House, Mail, Megaphone, Paperclip, Phone, Ruler, Send, Signature, Signpost, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import michelle from '@/assets/avatar-michelle.jpg'
import mark from '@/assets/revive-mark.svg'
import { REACHED, REFERRAL_STATUS } from '@/components/property/SellerReferrals'
import { Button } from '@/components/ui/button'
import { AGENT } from '@/data/tiers'
import { photoUrl } from '@/lib/assets'
import { money, plural } from '@/lib/format'
import { useOpportunities } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { Placeholder } from './Placeholder'

// One seller referral from Revive (Figma "Sub-Page"): the homeowner and how to reach them, a nudge when Revive
// is waiting on an update, a box to post one, the conversation so far, and on the right where the referral
// stands (referral to on market) and the home with its values and report.

const STEPS = [
  { label: 'Referral received', icon: Check },
  { label: 'Home visit set', icon: Check },
  { label: 'Met with homeowner', icon: UserRound },
  { label: 'Signed listing agreement', icon: Signature },
  { label: 'On market', icon: Signpost },
]

const initials = (s: string) =>
  s
    .split(' ')
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
// sample contact details, stable per homeowner
const phoneOf = (name: string) => `(626) 555-01${String([...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 90 + 10)}`
const emailOf = (name: string) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`

function Entry({ avatar, who, when, children }: { avatar: React.ReactNode; who: string; when: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-6 border-b border-[var(--brand-primary-border-subtle)] pb-8 last:border-0">
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="text-[16px] font-medium text-ink">{who}</span>
          <span className="size-1 rounded-full bg-[var(--brand-primary)]" aria-hidden="true" />
          <span className="text-[14px] font-medium text-brand">{when}</span>
        </p>
        <div className="mt-1 text-[15px] leading-6 text-ink-2">{children}</div>
      </div>
    </li>
  )
}

export default function ReferralDetail() {
  const { id = '' } = useParams()
  const o = useOpportunities().find((x) => x.id === id && x.referral)
  const logged = useDemo((s) => s.activity[id])
  const post = useDemo((s) => s.postReferralUpdate)
  const [text, setText] = useState('')
  const [more, setMore] = useState(false)
  if (!o) return <Placeholder title="Referral not found" intro="It may not be visible at this tier. Try the Partner demo view." phase={2} />

  const r = o.referral!
  const p = o.property
  const name = o.person?.name ?? p.address
  const first = name.split(' ')[0]
  const reached = REACHED[r.status]
  const st = REFERRAL_STATUS[r.status]
  const referredOn = r.referredDaysAgo === 0 ? 'Today' : (o.person?.since.split(' · ').pop() ?? '')
  const timing = p.signals.find((s) => /sell/i.test(s) && !/referral/i.test(s)) ?? 'Within the next 6 months'
  const products = [...new Set(p.scenarios.filter((s) => s.gain).map((s) => s.product))].slice(0, 2).join(', ')
  // updates the agent posted here (newest first), then their notes on record
  const posts = (logged ?? [])
    .filter((l) => l.startsWith('You shared an update: “'))
    .map((l) => {
      const i = l.lastIndexOf(' · ')
      return { text: l.slice('You shared an update: “'.length, i).replace(/”$/, ''), when: l.slice(i + 3) }
    })
  const notes = o.person?.notes ?? []
  const quiet = o.person?.lastTouchDays ?? r.referredDaysAgo

  const submit = () => {
    const t = text.trim()
    if (!t) return
    post(o.id, t)
    setText('')
    toast.success('Update shared with Revive', { description: `${AGENT.firstName}, thanks. Keeping ${first}’s status current keeps referrals coming.` })
  }

  const you = <img src={michelle} alt="" className="size-14 shrink-0 rounded-full object-cover" />
  const revive = (
    <span className="grid size-14 shrink-0 place-items-center rounded-full bg-[var(--brand-primary)]">
      <img src={mark} alt="" className="size-6 brightness-0 invert" />
    </span>
  )

  return (
    <div className={PAGE}>
      <Link to="/leads/referrals" className="inline-flex items-center gap-1.5 text-[13px] text-ink hover:text-brand">
        <ArrowLeft className="size-3.5" /> Your seller referrals
      </Link>
      <header className="mt-4 flex flex-wrap items-center gap-6 border-b border-line pb-8">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-[22px] text-ink">{initials(name)}</span>
        <div className="min-w-[220px] flex-1">
          <h1 className="flex flex-wrap items-center gap-3 text-[22px] leading-8 font-semibold text-ink">
            {name}
            <span className={cn('inline-flex h-8 items-center gap-2 rounded-xl border px-3 text-[13px] font-normal', st.cls)}>
              <st.icon className="size-3.5" /> {st.label}
            </span>
          </h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-medium text-brand">
            <span className="inline-flex items-center gap-2 break-all sm:break-normal">
              <House className="size-4" /> {p.address}, {p.city}
            </span>
            <a href={`tel:${phoneOf(name)}`} className="inline-flex items-center gap-2 whitespace-nowrap hover:underline">
              <Phone className="size-4" /> {phoneOf(name)}
            </a>
            <a href={`mailto:${emailOf(name)}`} className="inline-flex items-center gap-2 whitespace-nowrap hover:underline">
              <Mail className="size-4" /> {emailOf(name)}
            </a>
          </p>
        </div>
        <Button className="h-12 w-full rounded-xl px-4 text-[15px] sm:w-auto" asChild>
          <Link to={`/property/${o.id}?tab=marketing`}>
            <Megaphone /> Marketing center
          </Link>
        </Button>
      </header>

      <div className="mt-10 grid gap-x-16 gap-y-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-12">
          <div className="flex flex-col gap-2">
            {r.status === 'new' && !r.claimedAt ? (
              <div className="flex items-center gap-5 rounded-[20px] border border-hot-line bg-hot-soft p-5">
                <CircleAlert className="size-5 shrink-0 text-hot" />
                <div>
                  <p className="text-[16px] font-medium text-hot-ink">New referral: reach out within 24 hours</p>
                  <p className="text-[14px] text-ink-2">{first} asked Revive for a local agent and is expecting your call.</p>
                </div>
              </div>
            ) : (
              r.needsUpdateNow && (
                <div className="flex items-center gap-5 rounded-[20px] border border-[#ffe5c8] bg-[#fffbeb] p-5">
                  <CircleAlert className="size-5 shrink-0 text-[#d97706]" />
                  <div>
                    <p className="text-[16px] font-medium text-[#d97706]">Last update was {plural(quiet, 'day')} ago</p>
                    <p className="text-[14px] text-ink-2">Agents who consistently follow up with their leads are more likely to win the listing.</p>
                  </div>
                </div>
              )
            )}
            <form
              className="flex h-40 flex-col justify-between rounded-3xl bg-[#f6f6f6] p-4 focus-within:ring-2 focus-within:ring-[var(--brand-primary-subtle)]"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <label className="sr-only" htmlFor="update">
                Share an update with Revive
              </label>
              <textarea
                id="update"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && submit()}
                placeholder="Share an update…"
                className="w-full flex-1 resize-none bg-transparent p-2 text-[16px] text-ink outline-none placeholder:text-faint"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" className="h-12 rounded-xl px-6 text-[15px] text-ink" onClick={() => toast('Attachments aren’t in the prototype yet')}>
                  <Paperclip /> Attach
                </Button>
                <Button type="submit" className="h-12 rounded-xl pr-3 pl-6 text-[15px]" disabled={!text.trim()}>
                  Post <Send />
                </Button>
              </div>
            </form>
          </div>

          <ol className="flex flex-col gap-8" aria-label="Updates">
            {posts.map((u, i) => (
              <Entry key={`p${i}`} avatar={you} who={`${AGENT.name} (you)`} when={u.when}>
                {u.text}
              </Entry>
            ))}
            {notes.map((n, i) => (
              <Entry key={`n${i}`} avatar={you} who={`${AGENT.name} (you)`} when={n.date}>
                {n.text}
              </Entry>
            ))}
            <Entry avatar={revive} who="Revive" when={referredOn}>
              <p>
                New {o.product ?? 'Revive'} referral assigned to you. {first} ran a Revive AI report and asked Revive to connect them with a local agent. Here are the notes:
              </p>
              <dl className="mt-4 flex flex-col gap-4">
                <div>
                  <dt className="font-medium text-ink">Property address</dt>
                  <dd>
                    {p.address}, {p.city}, CA
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">How soon are you looking to sell?</dt>
                  <dd>{timing}</dd>
                </div>
                {more && (
                  <>
                    <div>
                      <dt className="font-medium text-ink">The home</dt>
                      <dd>
                        {p.beds} beds · {p.baths} baths · {p.sqft.toLocaleString()} sqft · built {p.yearBuilt}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink">Revive AI estimate</dt>
                      <dd>
                        {money(p.valueNow)} today, {money(p.valueAfter)} after {o.product ?? 'a Revive project'}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
              <button type="button" onClick={() => setMore((v) => !v)} className="mt-4 font-medium text-brand hover:underline">
                {more ? 'See less' : 'See more…'}
              </button>
            </Entry>
          </ol>
        </div>

        <aside className="flex flex-col gap-6" aria-label="Referral status and home">
          <section className="flex flex-col gap-6 rounded-[28px] border border-[var(--brand-primary-border-subtle)] bg-white p-6">
            <div>
              <p className="text-[12px] font-medium tracking-wide text-brand uppercase">Status</p>
              <h2 className="text-[22px] leading-8 font-semibold text-ink">Listing progress</h2>
              <p className="mt-1 text-[15px] leading-6 text-ink-2">Track this lead from referral to listing, and see where the opportunity stands.</p>
            </div>
            <ol className="relative flex flex-col gap-4">
              <span className="absolute top-4 bottom-4 left-4 w-px bg-[var(--brand-primary-border-subtle)]" aria-hidden="true" />
              {STEPS.map((s, i) => {
                const done = i <= reached
                const lostHere = r.status === 'lost' && i === reached + 1
                const Icon = lostHere ? CircleX : done ? Check : s.icon
                return (
                  <li key={s.label} className="relative flex items-center gap-4">
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full',
                        lostHere ? 'border border-[#fecaca] bg-bad-soft text-bad' : done ? 'bg-[var(--brand-primary)] text-white' : 'border border-[var(--brand-primary-border-subtle)] bg-[var(--brand-primary-subtle)] text-brand',
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className={cn('text-[14px]', lostHere ? 'font-medium text-bad' : done ? 'font-medium text-brand' : 'text-ink-2')}>{lostHere ? 'Another agent won the listing' : s.label}</span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section className="overflow-hidden rounded-[28px] bg-[var(--brand-primary-subtle)]">
            <div className="relative h-56">
              <img src={photoUrl(p.photo)} alt={`Photo of ${p.address}`} className="size-full object-cover" />
              <p className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-4 rounded-full bg-white/80 px-4 py-3 text-[14px] font-medium whitespace-nowrap text-brand backdrop-blur-sm">
                <span className="inline-flex items-center gap-2">
                  <Bath className="size-3.5" /> {p.baths} baths
                </span>
                <span className="inline-flex items-center gap-2">
                  <BedDouble className="size-3.5" /> {p.beds} beds
                </span>
                <span className="inline-flex items-center gap-2">
                  <Ruler className="size-3.5" /> {p.sqft.toLocaleString()} sqft
                </span>
              </p>
            </div>
            <dl className="flex flex-col gap-6 p-6 text-brand">
              {[
                ['As-is', money(p.valueNow)],
                ['After renovation', money(p.valueAfter)],
                ['Opportunity', products || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="text-[14px] font-medium">{k}</dt>
                  <dd className="text-right text-[16px] font-semibold">{v}</dd>
                </div>
              ))}
              <Button className="h-12 rounded-xl text-[15px]" asChild>
                <Link to={`/property/${o.id}?tab=report`}>
                  <ChartColumn /> View report
                </Link>
              </Button>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  )
}
