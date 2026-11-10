import { AlertTriangle, Bookmark, CircleCheck, CircleHelp, Clock, Hammer, Info, Share2, Sparkles, TrendingDown, X } from 'lucide-react'
import markSvg from '@/assets/revive-mark.svg?raw'
import { cn } from '@/lib/utils'
import { costsOf, marginOf, ppsf, profitOf, profitRange, renoMid, TIER_LABEL, type Listing } from './data'
import { short } from './pins'

// The opportunity summary: what the agent sees when they tap a pin. The header is the peek (price, address,
// and Revive's answer in three numbers, or in one line for a plain listing); the body is the full case.

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`
const pct = (n: number) => `${(n * 100).toFixed(1)}%`
/** $150–185K (same unit) or $890K–1.05M */
const range = ([a, b]: [number, number]) => {
  const [x, y] = [short(a), short(b)]
  return x.slice(-1) === y.slice(-1) ? `${x.slice(0, -1)}–${y.slice(1)}` : `${x}–${y.slice(1)}`
}

export function ReviveMark({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block [&>svg]:size-full', className)} dangerouslySetInnerHTML={{ __html: markSvg.replace('fill="#fff"', 'fill="currentColor"') }} />
}

export function TierBadge({ l, done, small }: { l: Listing; done?: boolean; small?: boolean }) {
  const size = cn('whitespace-nowrap', small ? 'h-[22px] px-2 text-[11.5px] gap-1' : 'h-7 px-2.5 text-[12.5px] gap-1.5')
  if (l.tier === 'qualified')
    return (
      <span className={cn('inline-flex shrink-0 items-center rounded-full bg-[var(--green)] font-semibold text-white', size)}>
        {done ? <CircleCheck className="size-3.5" /> : <ReviveMark className="h-3 w-[11px]" />}
        {done ? 'Submitted to Flip360' : TIER_LABEL.qualified}
      </span>
    )
  if (l.tier === 'potential')
    return (
      <span className={cn('inline-flex shrink-0 items-center rounded-full border-[1.5px] border-[var(--green)] bg-white font-semibold text-[var(--green)]', size)}>
        {done ? <CircleCheck className="size-3.5" /> : <ReviveMark className="h-3 w-[11px]" />}
        {done ? 'Review requested' : small ? 'Potential' : TIER_LABEL.potential}
      </span>
    )
  return <span className={cn('inline-flex shrink-0 items-center rounded-full bg-line-soft font-medium text-ink-2', size)}>{TIER_LABEL.standard}</span>
}

function Metric({ label, value, tone, hint }: { label: string; value: string; tone?: 'go' | 'maybe'; hint?: string }) {
  return (
    <div className={cn('min-w-0 rounded-xl px-3 py-2.5', tone === 'go' ? 'bg-[var(--green-soft)]' : 'bg-head')}>
      <dt className="truncate text-[11.5px] text-muted">{label}</dt>
      <dd className={cn('truncate text-[16px] leading-6 font-semibold tabular-nums', tone === 'go' ? 'text-[var(--green)]' : 'text-ink')}>{value}</dd>
      {hint && <dd className="truncate text-[11px] text-muted">{hint}</dd>}
    </div>
  )
}

/** The peek: always visible while a home is selected. */
export function SummaryHeader({ l, done, distMi, onClose }: { l: Listing; done: boolean; distMi?: number; onClose: () => void }) {
  const f = l.flip
  return (
    <div className="px-4">
      <div className="flex items-center justify-between gap-2">
        <TierBadge l={l} done={done} />
        <button onClick={onClose} aria-label="Close" className="-mr-1.5 grid size-9 place-items-center rounded-full text-muted active:bg-head">
          <X className="size-5" />
        </button>
      </div>

      <div className="mt-2 flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline gap-2">
            <span className="text-[24px] leading-8 font-semibold tracking-[-0.01em] text-ink tabular-nums">{usd(l.price)}</span>
            {l.priceCut && (
              <span className="inline-flex items-center gap-0.5 text-[12.5px] font-medium text-[var(--green)] tabular-nums">
                <TrendingDown className="size-3.5" />
                {short(l.priceCut)}
              </span>
            )}
          </p>
          <p className="truncate text-[15px] font-medium text-ink">{l.address}</p>
          <p className="truncate text-[13px] text-muted tabular-nums">
            {l.beds} bd · {l.baths} ba · {l.sqft.toLocaleString()} sqft{distMi != null ? ` · ${distMi < 0.1 ? '<0.1' : distMi.toFixed(1)} mi` : ''}
          </p>
        </div>
        <img src={l.photos[0]} alt="" className="size-[76px] shrink-0 rounded-xl object-cover" />
      </div>

      {f && l.tier === 'qualified' && (
        <dl className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="Est. profit" value={short(profitOf(l))} tone="go" />
          <Metric label="Margin" value={pct(marginOf(l))} />
          <Metric label="Renovation" value={range(f.reno)} />
        </dl>
      )}
      {f && l.tier === 'potential' && (
        <dl className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="Est. profit" value={range(profitRange(l))} tone="maybe" />
          <Metric label="Renovation" value={range(f.reno)} />
          <Metric label="Confidence" value="Low" hint="Needs review" />
        </dl>
      )}
      {l.check && (
        <div className="mt-3 flex gap-2.5 rounded-xl bg-head px-3 py-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-muted" />
          <p className="text-[13px] leading-[18px] text-ink-2">
            <span className="font-semibold text-ink">Not a Flip360 fit: {l.check.verdict.toLowerCase()}.</span> {l.check.note}
          </p>
        </div>
      )}
    </div>
  )
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border-t border-line-soft px-4 py-4">
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

/** Where the after-repair value goes: purchase, renovation, costs, and what's left. */
function DealMath({ l }: { l: Listing }) {
  const f = l.flip!
  const buy = l.tier === 'potential' && f.targetOffer ? f.targetOffer : l.price
  const reno = renoMid(f)
  const costs = costsOf(f)
  const profit = profitOf(l, buy)
  const parts = [
    { k: 'Purchase', v: buy, c: 'bg-[#c9ced8]' },
    { k: 'Renovation', v: reno, c: 'bg-[#8e96a5]' },
    { k: 'Holding & selling', v: costs, c: 'bg-[#5d6677]' },
    { k: 'Profit', v: Math.max(profit, 0), c: l.tier === 'qualified' ? 'bg-[var(--green)]' : 'bg-[#7cc4b8]' },
  ]
  return (
    <>
      <div className="flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={`Of the ${usd(f.arv)} after-repair value: ${parts.map((p) => `${p.k} ${usd(p.v)}`).join(', ')}`}>
        {parts.map((p) => (
          <span key={p.k} className={cn('h-full border-r-2 border-white last:border-r-0', p.c)} style={{ width: `${(p.v / f.arv) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px] tabular-nums">
        <div className="flex justify-between">
          <dt className="text-muted">After-repair value (Revive)</dt>
          <dd className="font-semibold text-ink">{usd(f.arv)}</dd>
        </div>
        {parts.slice(0, 3).map((p) => (
          <div key={p.k} className="flex justify-between">
            <dt className="flex items-center gap-2 text-muted">
              <span className={cn('size-2 rounded-full', p.c)} />
              {p.k === 'Purchase' && buy !== l.price ? `Purchase at ${short(buy)} offer` : p.k === 'Renovation' ? `Renovation (mid of ${range(f.reno)})` : p.k === 'Holding & selling' ? 'Holding & selling (8%)' : 'Purchase at list'}
            </dt>
            <dd className="text-ink">−{usd(p.v)}</dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-line-soft pt-2">
          <dt className="flex items-center gap-2 font-semibold text-ink">
            <span className={cn('size-2 rounded-full', parts[3].c)} />
            Projected profit
          </dt>
          <dd className={cn('font-semibold', l.tier === 'qualified' ? 'text-[var(--green)]' : 'text-ink')}>
            {usd(profit)} <span className="font-normal text-muted">· {pct(marginOf(l, buy))}</span>
          </dd>
        </div>
      </dl>
      {l.tier === 'potential' && f.targetOffer && (
        <p className="mt-2.5 text-[12.5px] leading-[18px] text-muted">At the {short(l.price)} list price: {usd(profitOf(l))} ({pct(marginOf(l))}). Flip360 needs at least 10%.</p>
      )}
    </>
  )
}

/** The full case: everything below the peek. */
export function SummaryBody({ l, onAsk }: { l: Listing; onAsk: () => void }) {
  const f = l.flip
  const rows: [string, string][] = [
    ['Listed', `${l.dom} days ago`],
    ['Price per sqft', `$${ppsf(l)}`],
    ['Built', String(l.built)],
    ['Lot', l.lot ? `${l.lot.toLocaleString()} sqft` : '—'],
    ['Type', l.type],
    ['MLS #', l.mls],
  ]
  return (
    <div className="pt-3">
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
        {l.photos.map((p, i) => (
          <img key={i} src={p} alt={i ? '' : l.address} className="h-36 w-[78%] shrink-0 snap-center rounded-2xl object-cover" />
        ))}
      </div>

      {f && (
        <>
          <Section title={l.tier === 'qualified' ? 'Why Revive flagged it' : 'Promising signals'} aside={<span className="text-[12px] text-muted">{f.confidence === 'Preliminary' ? 'Preliminary read' : `${f.confidence} confidence`}</span>}>
            <ul className="flex flex-col gap-3">
              {f.reasons.map((r) => (
                <li key={r.title} className="flex gap-3">
                  <span className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full', l.tier === 'qualified' ? 'bg-[var(--green-soft)] text-[var(--green)]' : 'border border-[var(--green)] text-[var(--green)]')}>
                    <Sparkles className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-ink">{r.title}</span>
                    <span className="block text-[13px] leading-[19px] text-muted">{r.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={l.tier === 'qualified' ? 'Deal math' : 'Deal math (preliminary)'}>
            <DealMath l={l} />
          </Section>

          <Section title={l.tier === 'qualified' ? 'Before you submit' : 'What Revive needs to qualify it'}>
            <ul className="flex flex-col gap-2">
              {f.verify.map((v) => (
                <li key={v} className="flex gap-2.5 text-[13.5px] leading-[19px] text-ink-2">
                  {l.tier === 'qualified' ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" /> : <CircleHelp className="mt-0.5 size-4 shrink-0 text-[var(--green)]" />}
                  {v}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Hammer className="size-3.5" /> {f.scope} scope
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" /> ~{f.weeks} weeks to list
              </span>
            </p>
          </Section>

          <Section title="Renovated comps" aside={<span className="text-[12px] text-muted">Sold, last 120 days</span>}>
            <ul className="-mx-1 flex flex-col">
              {f.comps.map((c) => (
                <li key={c.address} className="flex items-center justify-between gap-3 px-1 py-2 text-[13.5px] tabular-nums">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{c.address}</span>
                    <span className="block text-[12.5px] text-muted">
                      {c.distMi} mi · {c.sqft.toLocaleString()} sqft · {c.soldDaysAgo} days ago
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold text-ink">{short(c.price)}</span>
                    <span className="block text-[12.5px] text-muted">${Math.round(c.price / c.sqft)}/sqft</span>
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}

      {l.check && (
        <Section title="Revive’s read">
          <p className="text-[13.5px] leading-[20px] text-ink-2">
            Revive checks every active listing against renovated sales, likely scope and Flip360’s 10% margin floor. This one doesn’t clear it: <span className="font-medium text-ink">{l.check.note}</span>
          </p>
          <button onClick={onAsk} className="mt-3 text-[13.5px] font-semibold text-brand">
            Think Revive got it wrong? Ask Revive AI
          </button>
        </Section>
      )}

      <Section title="Listing details">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[13.5px]">
          {rows.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[12px] text-muted">{k}</dt>
              <dd className="truncate text-ink tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[12px] text-muted">
          {l.area}, Los Angeles {l.zip}. Revive estimates are for discovery and are confirmed by a Revive underwriter before any offer.
        </p>
      </Section>
    </div>
  )
}

/** The actions, pinned to the bottom of the screen while a home is open. */
export function SummaryActions({ l, done, saved, onPrimary, onSave, onShare, onAsk }: { l: Listing; done: boolean; saved: boolean; onPrimary: () => void; onSave: () => void; onShare: () => void; onAsk: () => void }) {
  const icon = 'grid size-12 shrink-0 place-items-center rounded-full border border-line bg-white text-ink active:bg-head'
  return (
    <div className="flex items-center gap-2 border-t border-line-soft bg-white px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
      {l.tier === 'standard' ? (
        <button onClick={onAsk} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-line text-[15px] font-semibold text-ink active:bg-head">
          <Sparkles className="size-[18px] text-brand" /> Ask Revive AI about it
        </button>
      ) : done ? (
        <div className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--green-soft)] text-[14.5px] font-semibold text-[var(--green)]">
          <CircleCheck className="size-[18px]" /> {l.tier === 'qualified' ? 'Submitted · reply within 24 hrs' : 'Review requested'}
        </div>
      ) : l.tier === 'qualified' ? (
        <button onClick={onPrimary} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--green)] text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(5,128,113,0.35)] active:bg-[#03594f]">
          <ReviveMark className="h-4 w-[14px]" /> Submit to Flip360
        </button>
      ) : (
        <button onClick={onPrimary} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--green)] bg-white text-[15px] font-semibold text-[var(--green)] active:bg-[var(--green-soft)]">
          Request a Revive review
        </button>
      )}
      <button onClick={onSave} aria-label={saved ? 'Saved' : 'Save'} aria-pressed={saved} className={icon}>
        <Bookmark className={cn('size-5', saved && 'fill-ink')} />
      </button>
      <button onClick={onShare} aria-label="Share with a client" className={icon}>
        <Share2 className="size-5" />
      </button>
    </div>
  )
}
