import { ArrowUpDown, Check, ChevronRight, Home as HomeIcon, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '@/lib/assets'
import { hash } from '@/lib/flows'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'
import type { Home } from './HomesList'

// Your other listings, laid out like a table (shared columns, one header) but with each listing in its own card: days on market against the area average, list price and
// potential value, and the Revive opportunities with the extra commission. What sits under the prices follows
// the opportunity: a renovation shows the condition now and after; an ADU alone shows the square feet it adds;
// a listing selling well says so ("Selling on track"). Sitting longer than the area average surfaces Sell 360;
// just or newly listed surfaces Renovate to Sell. Condition scores are illustrative.

const AREA_DOM = 27 // average days on market nearby
const COMMISSION = 0.03
const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))
const usd = (n: number) => `$${n.toLocaleString('en-US')}`
const COLS = 'grid grid-cols-[minmax(140px,1fr)_96px_minmax(130px,1fr)_minmax(130px,1fr)_minmax(230px,1.3fr)] gap-x-4 2xl:gap-x-10' // fits a laptop beside the Homes nav; roomier on wide screens

function conditionLabel(n: number) {
  return n < 40 ? 'Poor' : n < 50 ? 'Fair' : n < 70 ? 'Great' : 'Excellent'
}

// five segments, the one the score falls in colored with the score on it
function Meter({ n }: { n: number }) {
  const color = n < 40 ? 'bg-[#f97316]' : n < 70 ? 'bg-[#fbbf24]' : 'bg-[#22c55e]'
  const seg = Math.min(4, Math.floor(n / 20))
  return (
    <span className="relative flex h-[6px] items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={cn('h-[6px] flex-1 first:rounded-l-lg last:rounded-r-lg', i === seg ? color : 'bg-[#b1b3b5]/30')} />
      ))}
      <span
        className={cn('absolute top-1/2 grid size-[22px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white text-[12px] leading-4 font-semibold text-white shadow-[0_1.3px_2.6px_1px_rgba(103,106,167,0.12),0_0.3px_1.3px_0_rgba(103,106,167,0.1)]', color)}
        style={{ left: `${seg * 20 + 10}%` }}
      >
        {n}
      </span>
    </span>
  )
}

/** A label and value under a meter; on narrower screens the label shortens ("Current condition:" → "Now"). */
function Detail({ label, short, value }: { label: string; short?: string; value: string }) {
  return (
    <span className="flex justify-between gap-2 text-[12px] leading-[18px] whitespace-nowrap text-[#5b5f6e]">
      {short ? (
        <>
          <span className="2xl:hidden">{short}</span>
          <span className="hidden 2xl:inline">{label}</span>
        </>
      ) : (
        label
      )}{' '}
      <b className="font-semibold">{value}</b>
    </span>
  )
}

function Badge({ tone, children }: { tone: 'primary' | 'accent' | 'agent' | 'secondary'; children: React.ReactNode }) {
  const bg = { primary: 'bg-[var(--brand-primary-subtle)]', accent: 'bg-[#effefa]', agent: 'bg-[var(--brand-agent-subtle)]', secondary: 'bg-[#f7f8f8]' }[tone]
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] leading-[18px] font-medium whitespace-nowrap text-ink', bg)}>{children}</span>
}

type Sort = 'dom' | 'price' | 'potential'

function Head({ k, sort, setSort, children }: { k: Sort; sort: Sort | null; setSort: (s: Sort | null) => void; children: React.ReactNode }) {
  return (
    <button onClick={() => setSort(sort === k ? null : k)} className={cn('inline-flex items-center gap-1 uppercase', sort === k && 'text-ink')}>
      {children} <ArrowUpDown className="size-2.5" strokeWidth={2.5} />
    </button>
  )
}

export function OwnListings({ homes }: { homes: Home[] }) {
  const [sort, setSort] = useState<Sort | null>(null)
  const [addr, setAddr] = useState('')
  const requestAi = useUi((s) => s.requestAi)
  const rows = homes.map((h) => {
    const p = h.listing!.property
    const f = p.facts
    const k = hash(p.address)
    const dom = f.daysOnMarket ?? 0
    const upside = Math.max(0, h.upside ?? 0)
    const reno = p.scenarios.some((s) => /renovate|360/i.test(s.product) && !/adu/i.test(s.product) && (s.gain ?? 0) > 0)
    const adu = p.scenarios.find((s) => /adu/i.test(s.product) && (s.gain ?? 0) > 0)
    const onTrack = upside < 15000 || (!reno && !adu)
    const now = 30 + (k % 35)
    const after = Math.min(92, now + 22 + (k % 12))
    const aduSqft = Math.round((450 + (k % 5) * 60) / 2) * 2
    const products = onTrack ? [] : [...(reno ? [dom > AREA_DOM ? 'Sell 360' : 'Renovate to Sell'] : []), ...(adu ? ['ADU'] : [])]
    return { h, p, f, dom, upside, now, after, reno, aduSqft, products, onTrack }
  })
  const sorted = sort
    ? [...rows].sort((a, b) => (sort === 'dom' ? b.dom - a.dom : sort === 'price' ? b.p.valueNow - a.p.valueNow : b.p.valueNow + b.upside - (a.p.valueNow + a.upside)))
    : [...rows].sort((a, b) => Number(!!b.h.needsYou) - Number(!!a.h.needsYou))
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="flex min-w-[780px] flex-col gap-3 p-px pb-1">
          <div className={cn(COLS, 'items-center px-4 2xl:px-6 text-[11.5px] leading-4 font-semibold tracking-[0.04em] whitespace-nowrap text-[#5b5f6e] uppercase')}>
            <span className="pl-[52px]">Address</span>
            <Head k="dom" sort={sort} setSort={setSort}>DOM</Head>
            <Head k="price" sort={sort} setSort={setSort}>List price</Head>
            <Head k="potential" sort={sort} setSort={setSort}>Potential value</Head>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="size-3" /> Revive opportunities
            </span>
          </div>
          {sorted.map(({ h, p, f, dom, upside, now, after, reno, aduSqft, products, onTrack }) => {
            const vs = dom - AREA_DOM
            const coming = dom === 0 && !f.priceCutDaysAgo
            return (
              <div key={h.id} className={cn(COLS, 'min-h-[114px] items-center rounded-2xl border border-line bg-white px-4 py-5 shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)] 2xl:p-6')}>
                <Link to={`/property/${h.id}`} className="group flex min-w-0 items-start gap-3 self-start">
                  <span className="block size-10 shrink-0 overflow-hidden rounded-lg border-2 border-white bg-line-soft shadow-[0_2px_8px_rgba(27,31,79,0.1)]">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-[15px] leading-6 font-semibold text-[#1b2b4b] group-hover:text-brand">{p.address}</span>
                    <span className="truncate text-[12px] leading-[18px] text-[#5b5f6e]">{p.city}</span>
                  </span>
                </Link>
                <span className="flex flex-col gap-1 self-start">
                  <span className="text-[16px] leading-6 font-medium whitespace-nowrap text-[#1b1c1e] tabular-nums">{dom} days</span>
                  <span className={cn('text-[12px] leading-[18px]', !coming && vs > 0 ? 'text-[#dc2626]' : 'text-[#5b5f6e]')}>
                    {coming ? 'Coming soon' : f.priceCutDaysAgo !== undefined ? `Price cut ${f.priceCutDaysAgo} ${f.priceCutDaysAgo === 1 ? 'day' : 'days'} ago` : vs > 0 ? `+${vs} over avg` : `${-vs} under avg`}
                  </span>
                </span>
                <span className="flex flex-col gap-2 self-start">
                  <span className="text-[16px] leading-6 font-medium text-ink tabular-nums">{usd(p.valueNow)}</span>
                  {onTrack ? (
                    <span className="-mt-1 text-[12px] leading-[18px] text-[#5b5f6e]">Optimally priced</span>
                  ) : reno ? (
                    <span className="flex flex-col gap-3 pt-1">
                      <Meter n={now} />
                      <Detail label="Current condition:" short="Now" value={conditionLabel(now)} />
                    </span>
                  ) : (
                    <Detail label="Current sqft:" short="Now" value={`${p.sqft.toLocaleString()} sqft`} />
                  )}
                </span>
                <span className="flex flex-col gap-2 self-start">
                  <span className="text-[16px] leading-6 font-medium text-ink tabular-nums">{usd(p.valueNow + upside)}</span>
                  {onTrack ? (
                    <span className="-mt-1 text-[12px] leading-[18px] text-[#5b5f6e]">No action needed</span>
                  ) : reno ? (
                    <span className="flex flex-col gap-3 pt-1">
                      <Meter n={after} />
                      <Detail label="After renovation:" short="After" value={conditionLabel(after)} />
                    </span>
                  ) : (
                    <Detail label="Additional sqft:" short="Added" value={`+${aduSqft.toLocaleString()} sqft`} />
                  )}
                </span>
                <span className="flex items-center justify-between gap-2">
                  {onTrack ? (
                    <Badge tone="secondary">
                      <Check className="size-3.5" /> Selling on track
                    </Badge>
                  ) : (
                    <span className="flex flex-col items-start gap-2">
                      <span className="flex flex-wrap gap-2">
                        {products.map((x) => (
                          <Badge key={x} tone={x === 'ADU' ? 'accent' : 'primary'}>
                            {x}
                          </Badge>
                        ))}
                      </span>
                      <Badge tone="agent">+{money(Math.max(1000, Math.round((upside * COMMISSION) / 1000) * 1000))} Commission</Badge>
                    </span>
                  )}
                  <Link to={h.needsYou?.to ?? `/property/${h.id}`} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[14px] 2xl:px-4 leading-5 font-medium text-[#5b5f6e] hover:bg-line-soft hover:text-ink">
                    Details <ChevronRight className="size-4" />
                  </Link>
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-line bg-white px-5 py-4 2xl:px-6">
        <div className="flex flex-col gap-[5px]">
          <p className="text-[16px] leading-6 font-semibold text-ink">Not listed yet?</p>
          <p className="text-[14px] leading-5 text-[#5b5f6e]">Run a report on any address to see its potential before it hits the MLS.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (addr.trim()) requestAi(`/ai?flow=report&address=${encodeURIComponent(addr.trim())}`)
          }}
          className="flex w-full gap-3 sm:w-auto"
        >
          <label className="relative flex-1 sm:w-72">
            <HomeIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8f94a1]" />
            <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Enter a property address" className="h-9 w-full rounded-lg border border-[#e5e7eb] bg-white pr-3 pl-9 text-[14px] outline-none placeholder:text-[#8f94a1] focus:border-[var(--brand-primary-border)]" />
          </label>
          <button className="h-9 rounded-lg border border-[#b6b9c3] bg-white px-4 text-[14px] font-medium text-ink hover:border-[var(--brand-primary-border)]">Run report</button>
        </form>
      </div>
    </div>
  )
}
