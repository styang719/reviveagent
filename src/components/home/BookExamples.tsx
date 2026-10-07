import { AlarmClock, CircleAlert, CircleDollarSign, Clock, Eye, Hammer, Home, Phone, Scissors, TrendingDown, TriangleAlert, UserRound, Warehouse, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import avatarA from '@/assets/avatars/homeowner-a.svg'
import avatarB from '@/assets/avatars/homeowner-b.svg'
import avatarC from '@/assets/avatars/homeowner-c.svg'
import { photoUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// What each source brings in, shown with sample data before it's connected, under a label that
// marks it as an example. Sits on the source's tinted panel: listings as a stack of cards, the
// contact as one card.
// Both cards read the same way: who or what → the one number that matters → why now →
// the Revive opportunities.

function Sample({ label, banner, children }: { label: string; banner: string; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} className="flex h-full min-w-0 flex-col gap-2.5">
      {/* the label says up front that this is an example, not real data */}
      <p aria-hidden="true" className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
        <Eye className="size-3.5 text-muted" /> {banner}
      </p>
      <div aria-hidden="true" className="flex flex-1 flex-col gap-2.5">
        {children}
      </div>
    </div>
  )
}

function Who({ img, round, name, sub, badge }: { img?: string; round?: boolean; name: string; sub: string; badge: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {img ? (
        <img src={img} alt="" className={cn('size-11 shrink-0 object-cover', round ? 'rounded-full' : 'rounded-lg')} />
      ) : (
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--brand-primary-subtle)] text-brand">
          <UserRound className="size-5" />
        </span>
      )}
      <div className="min-w-[6rem] flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{name}</p>
        <p className="text-[12px] leading-4 text-muted">{sub}</p>
      </div>
      {badge}
    </div>
  )
}

/** "Revive opportunities" and the tags under it. */
function Opportunities({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-auto border-t border-line pt-3">
      <p className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">Revive opportunities</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Tag({ icon: Icon, tone, small = false, children }: { icon: typeof Clock; tone: 'agent' | 'warn' | 'teal'; small?: boolean; children: React.ReactNode }) {
  const tones = {
    agent: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]',
    warn: 'bg-warn-soft text-warn',
    teal: 'bg-[var(--teal-soft)] text-[var(--green)]',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap', small ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-[11.5px]', tones[tone])}>
      <Icon className="size-3" /> {children}
    </span>
  )
}

/** Why now: one line, the reason behind the number. */
function Why({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-[12.5px] leading-[18px] text-ink-2">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-hot" />
      <span>{children}</span>
    </p>
  )
}

const LISTINGS = [
  { photo: 'comp-100-0', address: '123 Sample St', days: 47, after: '$1.39M', gain: '+$210K', tag: { icon: Hammer, tone: 'agent', text: 'Renovate to Sell' } },
  { photo: 'comp-111-2', address: '456 Example Ave', days: 63, after: '$1.81M', gain: '+$290K', tag: { icon: TrendingDown, tone: 'warn', text: 'Stale listing' } },
  { photo: 'comp-104-0', address: '789 Sample Ln', days: 21, after: '$965K', gain: '+$95K', tag: { icon: CircleDollarSign, tone: 'teal', text: 'More commission' } },
  { photo: 'comp-105-2', address: '12 Example Ct', days: 34, after: '$1.12M', gain: '+$140K', tag: { icon: Warehouse, tone: 'agent', text: 'ADU room' } },
  { photo: 'comp-102-0', address: '48 Demo Rd', days: 55, after: '$1.46M', gain: '+$185K', tag: { icon: Scissors, tone: 'warn', text: 'Price cut' } },
  { photo: 'comp-106-1', address: '9 Placeholder Way', days: 18, after: '$890K', gain: '+$70K', tag: { icon: Zap, tone: 'teal', text: 'Sell faster' } },
] as const

function ListingCard({ l }: { l: (typeof LISTINGS)[number] }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-white bg-white px-3 py-2.5 shadow-card">
      <img src={photoUrl(l.photo)} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        {/* line 1: the listing and its Revive opportunity; line 2: the numbers */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="truncate text-[13.5px] font-semibold text-ink">{l.address}</p>
          <Tag icon={l.tag.icon} tone={l.tag.tone} small>
            {l.tag.text}
          </Tag>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
          <p className={cn('text-[11.5px] whitespace-nowrap tabular-nums', l.days > 30 ? 'text-hot' : 'text-muted')}>{l.days} days on market</p>
          <p className="text-[11.5px] whitespace-nowrap text-muted tabular-nums">
            <span className="text-[13px] font-semibold text-ink">{l.after}</span> <span className="font-semibold text-[var(--green)]">{l.gain}</span>
          </p>
        </div>
      </div>
    </li>
  )
}

/** Your listings, read by Revive: a slow, endless upward scroll through sample listings. */
export function ListingExample() {
  return (
    <Sample
      banner="Example of your listings"
      label="Example with sample data: your listings scroll by, each with the value after a Revive project and its Revive opportunity, such as 123 Sample St, $1.39M after Revive, up $210K, Renovate to Sell. $990K potential across 6 listings."
    >
      {/* the list is drawn twice and moves up by one copy, so the loop never shows an end */}
      <div className="rv-fade-y rv-marquee-y relative min-h-72 flex-1 overflow-hidden">
        <div className="rv-marquee-y-track absolute inset-x-0 top-0 flex flex-col">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex flex-col gap-2.5 px-1 pb-2.5">
              {LISTINGS.map((l) => (
                <ListingCard key={l.address} l={l} />
              ))}
            </ul>
          ))}
        </div>
      </div>
      <p className="flex flex-wrap items-center justify-between gap-x-2 px-1 text-[12.5px] text-ink-2">
        <span className="whitespace-nowrap">6 Revive opportunities</span>
        <span className="font-semibold whitespace-nowrap text-[var(--green)] tabular-nums">+$990K potential</span>
      </p>
    </Sample>
  )
}

function ScoreRing({ value }: { value: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  const color = value >= 65 ? 'var(--green)' : 'var(--amber)'
  return (
    <span className="relative grid size-14 shrink-0 place-items-center">
      <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90">
        <circle cx="26" cy="26" r={r} fill="none" stroke="var(--line)" strokeWidth="5" />
        <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} />
      </svg>
      <span className="relative text-[18px] font-semibold text-ink tabular-nums">{value}</span>
    </span>
  )
}

type Opp = { icon: typeof Clock; tone: 'agent' | 'warn' | 'teal'; text: string }
const CONTACTS: {
  avatar: string
  town: string
  when: { text: string; tone: 'now' | 'soon' | 'later' }
  score: number
  outlook: string
  potential: string
  why: string
  opps: Opp[]
  last: string
}[] = [
  {
    avatar: avatarA,
    town: 'Anytown, CA',
    when: { text: 'Call this week', tone: 'soon' },
    score: 79,
    outlook: 'Likely to sell',
    potential: '+$148K',
    why: 'Their listing expired 23 days ago, and they’re leaning toward selling.',
    opps: [
      { icon: TriangleAlert, tone: 'warn', text: 'Listing issue' },
      { icon: Warehouse, tone: 'agent', text: 'ADU room' },
      { icon: CircleDollarSign, tone: 'teal', text: 'More commission' },
    ],
    last: 'Called 2 mo ago',
  },
  {
    avatar: avatarB,
    town: 'Sampleville, CA',
    when: { text: 'Call today', tone: 'now' },
    score: 91,
    outlook: 'Ready to sell',
    potential: '+$212K',
    why: 'Viewed two homes out of state this month and asked about their home’s value.',
    opps: [
      { icon: Hammer, tone: 'agent', text: 'Renovate to Sell' },
      { icon: CircleDollarSign, tone: 'teal', text: 'More commission' },
    ],
    last: 'Texted 3 wks ago',
  },
  {
    avatar: avatarC,
    town: 'Exampleton, CA',
    when: { text: 'Reach out this month', tone: 'later' },
    score: 58,
    outlook: 'Thinking about it',
    potential: '+$96K',
    why: 'Owned the home 18 years and the kids have moved out. A natural time to downsize.',
    opps: [
      { icon: Home, tone: 'warn', text: 'Downsizing' },
      { icon: Warehouse, tone: 'agent', text: 'ADU room' },
    ],
    last: 'Emailed 5 mo ago',
  },
]

const WHEN = {
  now: 'bg-hot text-white',
  soon: 'bg-[var(--brand-primary)] text-white',
  later: 'bg-line-soft text-ink-2',
}

function ContactCard({ c }: { c: (typeof CONTACTS)[number] }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden rounded-xl border border-white bg-white p-4 shadow-card">
      <Who
        img={c.avatar}
        round
        name="Homeowner"
        sub={c.town}
        badge={
          <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', WHEN[c.when.tone])}>
            <AlarmClock className="size-3" /> {c.when.text}
          </span>
        }
      />

      {/* the number that matters */}
      <div className="flex items-center gap-3">
        <ScoreRing value={c.score} />
        <div>
          <p className="text-[11.5px] text-muted">Selling score</p>
          <p className="text-[15px] leading-5 font-semibold text-ink">{c.outlook}</p>
          <p className="text-[12px] text-muted">
            <span className="font-semibold text-[var(--green)]">{c.potential}</span> potential with Revive
          </p>
        </div>
      </div>

      <Why icon={CircleAlert}>{c.why}</Why>

      <Opportunities>
        {c.opps.map((o) => (
          <Tag key={o.text} icon={o.icon} tone={o.tone}>
            {o.text}
          </Tag>
        ))}
      </Opportunities>

      <div className="-mx-4 -mb-4 flex items-center justify-between gap-2 border-t border-line bg-head px-4 py-2.5">
        <span className="text-[12.5px] text-ink-2">{c.last}</span>
        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--brand-primary-border)] bg-white px-2.5 py-1 text-[12.5px] font-semibold text-brand">
          <Phone className="size-3.5" /> Call
        </span>
      </div>
    </div>
  )
}

const SLIDE_MS = 1100 // how long a slide takes
const HOLD_MS = 4200 // how long each contact stays put

/** Homeowners from your CRM: slides right to left, one contact at a time, then back to the first. */
export function ContactExample() {
  // the first contact is repeated at the end; sliding onto it and jumping back to 0 keeps the loop seamless
  const slides = [...CONTACTS, CONTACTS[0]]
  const [i, setI] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setTimeout(() => {
      setAnimate(true)
      setI((x) => x + 1)
    }, HOLD_MS)
    return () => clearTimeout(t)
  }, [i, paused])
  const onEnd = () => {
    if (i === CONTACTS.length) {
      setAnimate(false)
      setI(0)
    }
  }
  const dot = i % CONTACTS.length
  return (
    <Sample
      banner="Example of your contacts"
      label="Example with sample data: homeowners from your CRM, one at a time. A selling score of 79, likely to sell, listing expired 23 days ago, call this week. A score of 91, ready to sell, call today. A score of 58, thinking about it, reach out this month. Each shows the Revive opportunities and potential."
    >
      <div className="rv-fade-x -mx-1 flex-1 overflow-hidden px-1 pb-2" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <div
          className="flex h-full"
          onTransitionEnd={onEnd}
          style={{ transform: `translateX(-${i * 100}%)`, transition: animate ? `transform ${SLIDE_MS}ms cubic-bezier(0.45, 0, 0.2, 1)` : 'none' }}
        >
          {slides.map((c, k) => (
            <div key={k} className="w-full shrink-0 px-1">
              <ContactCard c={c} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5">
        {CONTACTS.map((_, k) => (
          <span key={k} className={cn('h-1.5 rounded-full transition-all duration-500', k === dot ? 'w-4 bg-[var(--brand-primary)]' : 'w-1.5 bg-[var(--brand-primary-border)]')} />
        ))}
      </div>
    </Sample>
  )
}
