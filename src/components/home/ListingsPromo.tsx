import { Check, Clock, KeyRound, Loader2, Search, Sparkles, TrendingUp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { cn } from '@/lib/utils'

// A looping "what you get" promo for the listings source, shown before the agent adds a license
// number: the number goes in, listings come in from the MLS, Revive reads each one (days on market,
// value now, value after a Revive project) and flags the opportunities. Three directions to compare.

export type ListingPromoVersion = 'table' | 'story' | 'pipeline'

const LICENSE = '02134589'
const LOOP = 12000
// phase start times (ms into the loop)
const T = { pull: 1700, analyze: 3600, potential: 5800, result: 7800 }

const SAMPLE = [
  { photo: 'comp-100-0', address: '123 Main St', city: 'South Pasadena', beds: 3, baths: 2, dom: 47, now: 1_180_000, after: 1_390_000, fit: 'Renovate to Sell', faster: '~3 weeks faster' },
  { photo: 'comp-111-2', address: '9 Cypress Ct', city: 'Pasadena', beds: 4, baths: 3, dom: 63, now: 1_520_000, after: 1_810_000, fit: 'Renovate to Sell', faster: '~4 weeks faster' },
  { photo: 'comp-105-2', address: '250 Elm St', city: 'Pasadena', beds: 3, baths: 2.5, dom: 12, now: 985_000, after: 1_010_000, fit: null, faster: null },
] as const
const TOTAL_GAIN = SAMPLE.filter((s) => s.fit).reduce((n, s) => n + s.after - s.now, 0)
const FLAGGED = SAMPLE.filter((s) => s.fit).length

/** Milliseconds into the loop. Holds on the finished frame for reduced motion, pauses off screen. */
function useLoop(ref: React.RefObject<HTMLElement | null>) {
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [t, setT] = useState(reduce ? LOOP - 1 : 0)
  useEffect(() => {
    if (reduce) return
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    if (ref.current) io.observe(ref.current)
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = now - last
      last = now
      if (visible) setT((x) => (x + dt) % LOOP)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [reduce, ref])
  return t
}

const prog = (t: number, start: number, dur = 700) => Math.max(0, Math.min(1, (t - start) / dur))
const ease = (x: number) => 1 - (1 - x) ** 3
/** a number counting up from 85% of its value */
const count = (t: number, start: number, v: number) => Math.round((v * (0.85 + 0.15 * ease(prog(t, start, 800)))) / 1000) * 1000

function stepOf(t: number) {
  return t >= T.result ? 3 : t >= T.analyze ? 2 : t >= T.pull ? 1 : 0
}

function LicenseField({ t, compact = false }: { t: number; compact?: boolean }) {
  const typed = LICENSE.slice(0, Math.floor(t / 160))
  const done = t >= T.pull
  return (
    <div className={cn('flex items-center gap-2 rounded-lg border bg-white px-3 text-[13px] shadow-sm', compact ? 'h-9' : 'h-10', done ? 'border-[var(--brand-primary-border)]' : 'border-brand')}>
      <KeyRound className="size-3.5 shrink-0 text-muted" />
      <span className="shrink-0 text-muted">DRE #</span>
      <span className="min-w-0 flex-1 font-medium text-ink tabular-nums">
        {typed}
        {!done && <span className="ml-px inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-ink" />}
      </span>
      {done && <Check className="size-4 shrink-0 text-[var(--green)]" />}
    </div>
  )
}

function Status({ t }: { t: number }) {
  const s = stepOf(t)
  const text = ['Add your license number', 'Pulling your listings from the MLS…', 'Revive is reading each listing…', `${FLAGGED} Revive opportunities found`][s]
  return (
    <p className={cn('flex items-center gap-1.5 text-[12.5px] font-medium', s === 3 ? 'text-[var(--brand-agent)]' : 'text-ink-2')} aria-hidden="true">
      {s === 0 ? <KeyRound className="size-3.5" /> : s === 3 ? <Sparkles className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
      {text}
    </p>
  )
}

function Example() {
  return <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-muted uppercase shadow-sm">Example</span>
}

/* ---------------- A · the real table, filling itself in ---------------- */

function TablePromo({ t }: { t: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-52">
          <LicenseField t={t} compact />
        </div>
        <Status t={t} />
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="grid grid-cols-[minmax(0,1.6fr)_0.7fr_0.9fr_1fr_1.1fr] gap-2 border-b border-line bg-head px-3 py-2 text-[11px] font-medium text-muted max-sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <span>Listing</span>
          <span className="max-sm:hidden">On market</span>
          <span className="max-sm:hidden">Value now</span>
          <span>After Revive</span>
          <span>Opportunity</span>
        </div>
        {SAMPLE.map((s, i) => {
          const shown = t >= T.pull + 250 + i * 450
          const read = t >= T.analyze + i * 450
          const pot = t >= T.potential + i * 450
          const flag = t >= T.result && !!s.fit
          return (
            <div
              key={s.address}
              className={cn(
                'relative grid grid-cols-[minmax(0,1.6fr)_0.7fr_0.9fr_1fr_1.1fr] items-center gap-2 border-b border-line px-3 py-2 text-[12.5px] transition-all duration-500 last:border-b-0 max-sm:grid-cols-[minmax(0,1fr)_auto_auto]',
                shown ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
                flag && 'bg-[var(--brand-agent-subtle)]/50',
              )}
            >
              {/* the scan line sweeping the row while Revive reads it */}
              {read && !pot && <span className="rv-scan pointer-events-none absolute inset-0" aria-hidden="true" />}
              <span className="flex min-w-0 items-center gap-2">
                <img src={photoUrl(s.photo)} alt="" className="size-8 shrink-0 rounded object-cover" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{s.address}</span>
                  <span className="block truncate text-[11px] text-muted">{s.city}</span>
                </span>
              </span>
              <span className={cn('tabular-nums max-sm:hidden', read ? (s.dom > 30 ? 'font-medium text-hot' : 'text-ink-2') : 'text-transparent')}>
                {read ? `${s.dom} days` : '—'}
                {!read && <span className="block h-2.5 w-10 rounded bg-line-soft" />}
              </span>
              <span className="text-ink-2 tabular-nums max-sm:hidden">{read ? money(count(t, T.analyze + i * 450, s.now)) : <span className="block h-2.5 w-12 rounded bg-line-soft" />}</span>
              <span className="tabular-nums">
                {pot ? (
                  <>
                    <span className="font-semibold text-ink">{money(count(t, T.potential + i * 450, s.after))}</span>
                    <span className={cn('ml-1 text-[11px] max-sm:hidden', s.fit ? 'text-[var(--green)]' : 'text-muted')}>{gain(s.after - s.now)}</span>
                  </>
                ) : (
                  <span className="block h-2.5 w-14 rounded bg-line-soft" />
                )}
              </span>
              <span>
                {flag ? (
                  <span className="rv-pop inline-flex items-center gap-1 rounded-full bg-[var(--brand-agent)] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white">
                    <Sparkles className="size-3" /> <span className="max-sm:hidden">{s.fit}</span>
                    <span className="sm:hidden">Revive</span>
                  </span>
                ) : t >= T.result ? (
                  <span className="text-[11.5px] text-muted">On track</span>
                ) : (
                  <span className="block h-2.5 w-16 rounded bg-line-soft" />
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- B · one listing, told as a story ---------------- */

const STORY = ['Add your license number', 'We pull your listings', 'Revive reads the market', 'You see the upside']

function StoryPromo({ t }: { t: number }) {
  const s = SAMPLE[0]
  const step = stepOf(t)
  const segStart = [0, T.pull, T.analyze, T.result, LOOP]
  return (
    <div className="flex flex-col gap-3">
      {/* story progress, like Instagram stories */}
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {STORY.map((label, i) => (
          <div key={label}>
            <div className="h-1 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-[var(--brand-primary)]" style={{ width: `${prog(t, segStart[i], segStart[i + 1] - segStart[i]) * 100}%` }} />
            </div>
            <p className={cn('mt-1.5 truncate text-[11px] font-medium', i === step ? 'text-ink' : 'text-faint')}>
              {i + 1}. {label}
            </p>
          </div>
        ))}
      </div>

      <div className="relative grid min-h-[176px] overflow-hidden rounded-xl sm:min-h-[205px] border border-line bg-white sm:grid-cols-[200px_minmax(0,1fr)]">
        <div className="relative h-36 sm:h-auto">
          <img
            src={photoUrl(s.photo)}
            alt=""
            className={cn('absolute inset-0 size-full object-cover transition-all duration-700', step === 0 ? 'scale-105 opacity-0 blur-sm' : 'scale-100 opacity-100 blur-0')}
          />
          {step === 0 && (
            <div className="absolute inset-0 grid place-items-center bg-[var(--brand-primary-subtle)] px-4">
              <div className="w-full">
                <LicenseField t={t} compact />
              </div>
            </div>
          )}
          {step >= 1 && (
            <span className="absolute top-2 left-2 rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-ink shadow-sm">From the MLS</span>
          )}
          {step === 2 && <span className="rv-scan pointer-events-none absolute inset-0" aria-hidden="true" />}
        </div>

        <div className="flex flex-col justify-center gap-2 p-4">
          {step === 0 ? (
            <>
              <p className="text-[15px] font-semibold text-ink">Your license number is all it takes</p>
              <p className="text-[13px] text-ink-2">Revive finds your active listings in the public record. No MLS login.</p>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">{s.address}</p>
                  <p className="text-[12px] text-muted">
                    {s.city} · {s.beds} bd · {s.baths} ba
                  </p>
                </div>
                <Example />
              </div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <Metric label="On market" show={step >= 2} value={`${s.dom} days`} tone="hot" icon={Clock} />
                <Metric label="Value now" show={step >= 2} value={money(count(t, T.analyze, s.now))} />
                <Metric label="After Revive" show={t >= T.potential} value={money(count(t, T.potential, s.after))} tone="good" icon={TrendingUp} />
              </div>
              <div className={cn('transition-all duration-500', step === 3 ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0')}>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-[var(--brand-agent-subtle)] px-3 py-2 text-[13px] text-ink">
                  <Sparkles className="size-4 text-[var(--brand-agent)]" />
                  <span className="font-semibold text-[var(--brand-agent)]">{gain(s.after - s.now)} upside</span>
                  <span className="text-ink-2">
                    with {s.fit}, and could sell {s.faster}
                  </span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, show, tone, icon: Icon }: { label: string; value: string; show: boolean; tone?: 'hot' | 'good'; icon?: typeof Clock }) {
  return (
    <div className="min-w-0 rounded-lg bg-head px-2 py-2 sm:px-2.5">
      <p className="text-[11px] whitespace-nowrap text-muted">{label}</p>
      {show ? (
        <p className={cn('mt-0.5 flex items-center gap-1 text-[13px] font-semibold whitespace-nowrap tabular-nums sm:text-[14px]', tone === 'hot' ? 'text-hot' : tone === 'good' ? 'text-[var(--green)]' : 'text-ink')}>
          {Icon && <Icon className="size-3.5 max-sm:hidden" />}
          {value}
        </p>
      ) : (
        <span className="mt-1.5 block h-3 w-14 animate-pulse rounded bg-line" />
      )}
    </div>
  )
}

/* ---------------- C · the pipeline beside the result ---------------- */

const PIPE = [
  { icon: KeyRound, label: 'License number added', at: T.pull },
  { icon: Search, label: `${SAMPLE.length} listings found in the MLS`, at: T.analyze },
  { icon: Clock, label: 'Days on market and value read', at: T.potential },
  { icon: TrendingUp, label: 'Value after a Revive project', at: T.result },
]

function PipelinePromo({ t }: { t: number }) {
  return (
    <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <ol className="flex flex-col gap-0.5">
        {PIPE.map((p, i) => {
          const done = t >= p.at
          const active = !done && (i === 0 || t >= PIPE[i - 1].at)
          return (
            <li key={p.label} className="relative flex items-center gap-2.5 py-1.5">
              {i < PIPE.length - 1 && (
                <span className="absolute top-8 left-[13px] h-[calc(100%-20px)] w-0.5 overflow-hidden rounded bg-line" aria-hidden="true">
                  <span className="block w-full bg-[var(--brand-primary)] transition-all duration-500" style={{ height: done ? '100%' : '0%' }} />
                </span>
              )}
              <span
                className={cn(
                  'relative grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors',
                  done ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : active ? 'border-[var(--brand-primary)] bg-white text-brand' : 'border-line bg-white text-faint',
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : active ? <Loader2 className="size-3.5 animate-spin" /> : <p.icon className="size-3.5" />}
              </span>
              <span className={cn('text-[13px]', done ? 'text-ink' : active ? 'font-medium text-ink' : 'text-faint')}>
                {i === 0 && !done ? (
                  <span className="inline-flex items-center gap-1">
                    DRE # <span className="font-medium tabular-nums">{LICENSE.slice(0, Math.floor(t / 160))}</span>
                    <span className="inline-block h-3.5 w-px animate-pulse bg-ink" />
                  </span>
                ) : (
                  p.label
                )}
              </span>
            </li>
          )
        })}
        <li className={cn('mt-2 rounded-lg bg-[var(--brand-agent-subtle)] px-3 py-2 transition-all duration-500', t >= T.result ? 'opacity-100' : 'opacity-0')}>
          <p className="text-[12px] text-ink-2">Revive opportunities in your listings</p>
          <p className="text-lg font-semibold text-[var(--brand-agent)] tabular-nums">
            {FLAGGED} listings · {gain(count(t, T.result, TOTAL_GAIN))}
          </p>
        </li>
      </ol>

      {/* the listings landing as a fanned stack, each card collecting its read-out */}
      <div className="relative mt-6 h-[204px] sm:mt-4 sm:mr-5">
        {SAMPLE.map((s, i) => {
          const shown = t >= T.pull + 300 + i * 400
          const flagged = t >= T.result && !!s.fit
          const offset = i
          const step = typeof window !== 'undefined' && window.innerWidth < 640 ? 0 : 10
          return (
            <div
              key={s.address}
              className={cn(
                'absolute inset-x-0 flex gap-3 rounded-xl border bg-white p-2.5 shadow-card transition-all duration-500',
                flagged ? 'border-[var(--brand-agent-border)]' : 'border-line',
                shown ? 'opacity-100' : 'opacity-0',
              )}
              style={{ top: offset * 70, transform: `translateX(${shown ? offset * step : 30}px)`, zIndex: 3 - i }}
            >
              <img src={photoUrl(s.photo)} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-ink">{s.address}</span>
                  {flagged && (
                    <span className="rv-pop inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--brand-agent)] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white">
                      <Sparkles className="size-3" /> {s.fit}
                    </span>
                  )}
                </p>
                <div className="mt-1 flex gap-1 overflow-hidden">
                  <Chip show={t >= T.analyze + i * 400} className={s.dom > 30 ? 'bg-hot-soft text-hot-ink' : 'bg-line-soft text-ink-2'}>
                    {s.dom} days<span className="max-sm:hidden"> on market</span>
                  </Chip>
                  <Chip show={t >= T.potential + i * 400} className="bg-ok-soft text-[var(--green)]">
                    {money(s.now)} → {money(s.after)}
                  </Chip>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Chip({ show, className, children }: { show: boolean; className?: string; children: React.ReactNode }) {
  if (!show) return <span className="h-5 w-20 animate-pulse rounded-full bg-line-soft" />
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap', className)}>{children}</span>
}

export function ListingsPromo({ version }: { version: ListingPromoVersion }) {
  const ref = useRef<HTMLDivElement>(null)
  const t = useLoop(ref)
  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Example: after you add your license number, Revive pulls in your listings, reads days on market and value, and flags ${FLAGGED} Revive opportunities worth ${gain(TOTAL_GAIN)}.`}
      className="relative overflow-hidden rounded-xl border border-[var(--brand-primary-border-subtle)] bg-gradient-to-br from-[var(--brand-primary-subtle)] via-white to-[var(--brand-agent-subtle)]/60 p-4"
    >
      {version !== 'story' && (
        <div className="absolute top-3 right-3 z-10">
          <Example />
        </div>
      )}
      <div aria-hidden="true">
        {version === 'table' ? <TablePromo t={t} /> : version === 'story' ? <StoryPromo t={t} /> : <PipelinePromo t={t} />}
      </div>
    </div>
  )
}
