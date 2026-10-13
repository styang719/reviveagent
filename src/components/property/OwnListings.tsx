import { ArrowUpDown, ChevronRight, Home as HomeIcon, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { photoUrl } from '@/lib/assets'
import { hash } from '@/lib/flows'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'
import type { Home } from './HomesList'

// Your listings, as in today's design: days on market against the area average, list price with the home's
// condition today, potential value after a Revive project, and the Revive products that fit with the extra
// commission. A listing selling well says so ("Selling on track"). The listing that needs the agent most is
// highlighted with a blue edge and a filled Details button. Condition scores are illustrative.

const AREA_DOM = 27 // average days on market nearby
const COMMISSION = 0.03
const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))

function conditionLabel(n: number) {
  return n < 40 ? 'Poor' : n < 50 ? 'Fair' : n < 70 ? 'Great' : 'Excellent'
}
function Meter({ n }: { n: number }) {
  const color = n < 40 ? 'bg-[#f97316]' : n < 70 ? 'bg-[#eab308]' : 'bg-[#22c55e]'
  const seg = Math.min(4, Math.floor(n / 20))
  return (
    <span className="relative mt-1.5 flex h-5 items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={cn('h-1.5 flex-1 rounded-full', i === seg ? 'opacity-0' : 'bg-line-soft')} />
      ))}
      <span className={cn('absolute grid size-5 -translate-x-1/2 place-items-center rounded-full text-[10px] font-bold text-white ring-2 ring-white', color)} style={{ left: `${seg * 20 + 10}%` }}>
        {n}
      </span>
    </span>
  )
}

type Sort = 'dom' | 'price' | 'potential'

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
    const now = 30 + (k % 35)
    const after = Math.min(92, now + 22 + (k % 12))
    const products = (h.listing!.product ?? 'Renovate to Sell').split(' + ')
    return { h, p, f, dom, upside, now, after, products, onTrack: upside < 15000 }
  })
  const sorted = sort ? [...rows].sort((a, b) => (sort === 'dom' ? b.dom - a.dom : sort === 'price' ? b.p.valueNow - a.p.valueNow : b.p.valueNow + b.upside - (a.p.valueNow + a.upside))) : [...rows].sort((a, b) => Number(!!b.h.needsYou) - Number(!!a.h.needsYou))
  const Head = ({ k, children }: { k: Sort; children: React.ReactNode }) => (
    <button onClick={() => setSort(sort === k ? null : k)} className={cn('inline-flex items-center gap-1 uppercase', sort === k && 'text-ink')}>
      {children} <ArrowUpDown className="size-3" />
    </button>
  )
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] table-fixed text-left">
          <thead className="border-b border-line bg-head text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap text-muted uppercase">
            <tr>
              <th className="w-[170px] px-3 py-2.5 font-semibold">Address</th>
              <th className="w-[96px] px-3 py-2.5 font-semibold"><Head k="dom">DOM</Head></th>
              <th className="w-[128px] px-3 py-2.5 font-semibold"><Head k="price">List price</Head></th>
              <th className="w-[128px] px-3 py-2.5 font-semibold"><Head k="potential">Potential</Head></th>
              <th className="px-3 py-2.5 font-semibold">
                <span className="inline-flex items-center gap-1"><Sparkles className="size-3.5" /> Revive</span>
              </th>
              <th className="w-[104px] px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(({ h, p, f, dom, upside, now, after, products, onTrack }) => {
              const hot = !!h.needsYou
              const vs = dom - AREA_DOM
              const coming = dom === 0 && !f.priceCutDaysAgo
              return (
                <tr key={h.id} className={cn('relative border-t border-line-soft first:border-t-0 align-top', hot && 'bg-[var(--brand-primary-subtle)]/50')}>
                  <td className="relative px-3 py-4">
                    {hot && <span className="absolute inset-y-0 left-0 w-[3px] bg-[var(--brand-primary)]" aria-hidden="true" />}
                    <Link to={`/property/${h.id}`} className="flex items-center gap-3">
                      <span className="block size-11 shrink-0 overflow-hidden rounded-lg bg-line-soft shadow-sm">{h.photo && <img src={img(h.photo)} alt="" className="size-full object-cover" />}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-ink hover:text-brand">{p.address}</span>
                        <span className="block truncate text-[12.5px] text-muted">{p.city}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <span className="block text-[14.5px] font-semibold text-ink tabular-nums">{dom} days</span>
                    <span className={cn('block text-[12.5px]', coming ? 'text-muted' : vs > 0 ? 'font-medium text-[#dc2626]' : 'text-muted')}>
                      {coming ? 'Coming soon' : vs > 0 ? `+${vs} over avg` : `${-vs} under avg`}
                    </span>
                  </td>
                  <td className="px-3 py-4">
                    <span className="block text-[14.5px] font-semibold text-ink tabular-nums">{money(p.valueNow)}</span>
                    {onTrack ? (
                      <span className="block text-[12.5px] text-muted">Optimally priced</span>
                    ) : (
                      <>
                        <Meter n={now} />
                        <span className="mt-1 flex justify-between text-[11.5px] text-muted">
                          Now <b className="font-semibold text-ink-2">{conditionLabel(now)}</b>
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    <span className="block text-[14.5px] font-semibold text-ink tabular-nums">{money(p.valueNow + upside)}</span>
                    {onTrack ? (
                      <span className="block text-[12.5px] text-muted">No action needed</span>
                    ) : (
                      <>
                        <Meter n={after} />
                        <span className="mt-1 flex justify-between text-[11.5px] text-muted">
                          After <b className="font-semibold text-ink-2">{conditionLabel(after)}</b>
                        </span>
                      </>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {onTrack ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-line-soft px-3 py-1 text-[12.5px] font-medium text-ink-2">✓ Selling on track</span>
                    ) : (
                      <span className="flex flex-wrap gap-1.5">
                        {products.map((x) => (
                          <span key={x} className="rounded-full bg-head px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-ink-2">{x}</span>
                        ))}
                        <span className="rounded-full bg-[var(--brand-agent-subtle)] px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap text-[var(--brand-agent)]">+{money(Math.max(1000, Math.round((upside * COMMISSION) / 1000) * 1000))} commission</span>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-right">
                    <Link
                      to={h.needsYou?.to ?? `/property/${h.id}`}
                      className={cn('inline-flex h-9 items-center gap-0.5 rounded-lg px-2.5 text-[13px] font-medium whitespace-nowrap', hot ? 'bg-[var(--brand-primary)] text-white hover:opacity-90' : 'text-ink-2 hover:bg-line-soft hover:text-ink')}
                    >
                      Details <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-head px-4 py-3.5">
        <div>
          <p className="text-[14px] font-semibold text-ink">Not listed yet?</p>
          <p className="text-[13px] text-ink-2">Run a report on any address to see its potential before it hits the MLS.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (addr.trim()) requestAi(`/ai?flow=report&address=${encodeURIComponent(addr.trim())}`)
          }}
          className="flex w-full gap-2 sm:w-auto"
        >
          <label className="relative flex-1 sm:w-72">
            <HomeIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="Enter a property address" className="h-9 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[13.5px] outline-none focus:border-[var(--brand-primary-border)]" />
          </label>
          <button className="h-9 rounded-lg border border-line bg-white px-3.5 text-[13px] font-medium text-ink hover:border-[var(--brand-primary-border)]">Run report</button>
        </form>
      </div>
    </div>
  )
}
