import L from 'leaflet'
import { CalendarDays, Check, CircleAlert, MapPin, Plus, Ruler } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Marker } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { mlsPhotos, type ReportDraft } from '@/lib/flows'
import { money } from '@/lib/format'
import { CONDITIONS, short, valuesOf, type Comp, type Rule } from '@/lib/intake'
import { cn } from '@/lib/utils'

// After the analysis, the intake walks the agent through how Revive got its numbers, one screen each:
// the home's condition, the sales it compared against (and the values they give), and the rules that
// apply. Each can be changed. No product is named here: that's for the report.

function Eyebrow({ n }: { n: number }) {
  return <p className="text-[12.5px] font-semibold tracking-wide text-brand uppercase">How we got here · {n} of 3</p>
}

const AREAS = ['Kitchen', 'Bathrooms', 'Floors', 'Exterior']

export function ConditionReview({ draft, condition, estimated, set, comps }: { draft: ReportDraft; condition: number; estimated: number; set: (c: number) => void; comps: Comp[] }) {
  const [asking, setAsking] = useState<number | null>(null) // a condition the agent wants to switch to
  return (
    <div>
      <Eyebrow n={1} />
      <h1 className="mt-2 text-[26px] leading-tight font-semibold text-ink sm:text-[32px]">
        We think the home is in {CONDITIONS[condition].label.toLowerCase()} condition.
      </h1>
      <p className="mt-2 text-[15px] text-ink-2">Based on the listing photos. If it doesn’t look right, change it: it sets which sales we compare against.</p>
      {asking !== null && <ConditionCheck target={asking} current={condition} comps={comps} close={() => setAsking(null)} set={set} />}

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-8">
        <div>
          <div className="grid h-56 grid-cols-3 grid-rows-2 gap-1 overflow-hidden rounded-xl sm:h-72">
            {draft.photos.slice(0, 3).map((src, k) => (
              <img key={k} src={src} alt="" className={cn('size-full object-cover', k === 0 && 'col-span-2 row-span-2')} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {AREAS.map((a, k) => {
              const c = Math.max(0, Math.min(4, estimated + [0, 0, 1, 0][k]))
              return (
                <li key={a} className="flex items-center justify-between rounded-lg bg-head px-3 py-2 text-[13px]">
                  <span className="text-ink-2">{a}</span>
                  <span className="font-medium text-ink">{CONDITIONS[c].label}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink">Condition</p>
          <div className="space-y-2">
            {CONDITIONS.map((c, k) => (
              <button
                key={c.label}
                onClick={() => k !== condition && setAsking(k)}
                aria-pressed={condition === k}
                className={cn('flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left', condition === k ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] ring-1 ring-[var(--brand-primary)]' : 'border-line hover:border-ink-2/40')}
              >
                <span className={cn('grid size-4.5 shrink-0 place-items-center rounded-full border', condition === k ? 'border-[var(--brand-primary)]' : 'border-line')}>{condition === k && <span className="size-2.5 rounded-full bg-[var(--brand-primary)]" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-medium text-ink">{c.label}</span>
                  <span className="block text-[12.5px] text-muted">{c.sub}</span>
                </span>
                {k === estimated && <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11.5px] font-medium text-brand ring-1 ring-[var(--brand-primary-border)]">Our read</span>}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

// Changing the condition: compare the home with a few sales nearby in the condition the agent picked,
// one at a time, then say whether that condition holds up or the current one still fits.
const ANSWERS = ['Better', 'About the same', 'Not as nice'] as const
type Answer = (typeof ANSWERS)[number]

function ConditionCheck({ target, current, comps, close, set }: { target: number; current: number; comps: Comp[]; close: () => void; set: (c: number) => void }) {
  const examples = useMemo(() => [...comps].sort((a, b) => Math.abs(a.condition - target) - Math.abs(b.condition - target) || a.miles - b.miles).slice(0, 3), [comps, target])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const done = examples.every((c) => answers[c.id])
  const up = target > current
  // raising it holds up when the home is as good or better than most; lowering it, when it's as good or worse
  const agree = examples.filter((c) => (up ? answers[c.id] !== 'Not as nice' : answers[c.id] !== 'Better')).length
  const verdict = agree >= 2 ? target : current
  const T = CONDITIONS[target].label
  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-[640px]">
        <DialogTitle>{up ? `Is the home in better shape than these?` : `Is the home in worse shape than these?`}</DialogTitle>
        <DialogDescription>
          {examples.length} homes sold nearby that look {T.toLowerCase()}. Compare each with this home.
        </DialogDescription>
        <ul className="mt-5 space-y-3">
          {examples.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-2.5 sm:flex-nowrap">
              <img src={mlsPhotos(c.address)[0]} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">{c.address}</p>
                <p className="text-[12.5px] text-muted">
                  {CONDITIONS[c.condition].label} · sold {short(c.price)} · {c.sqft.toLocaleString()} sq ft
                </p>
              </div>
              <div className="flex w-full gap-1 sm:w-auto">
                {ANSWERS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAnswers({ ...answers, [c.id]: a })}
                    aria-pressed={answers[c.id] === a}
                    className={cn('h-8 flex-1 rounded-lg border px-2.5 text-[12.5px] font-medium whitespace-nowrap sm:flex-none', answers[c.id] === a ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] text-brand' : 'border-line text-ink-2 hover:border-ink-2/40')}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        {done && (
          <div className="rv-fade mt-5 rounded-xl bg-head px-4 py-3">
            <p className="text-[14.5px] font-semibold text-ink">
              {verdict === target ? `Then ${T.toLowerCase()} fits. We’ll update it.` : `We still recommend ${CONDITIONS[current].label.toLowerCase()}.`}
            </p>
            <p className="mt-0.5 text-[13px] text-ink-2">
              {verdict === target ? `The home compares well with homes rated ${T.toLowerCase()}.` : `From your answers, the home is closer to ${CONDITIONS[current].label.toLowerCase()} than ${T.toLowerCase()}.`}
            </p>
          </div>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {done && verdict !== target && (
            <button onClick={() => (set(target), close())} className="h-10 rounded-lg px-3 text-[14px] font-medium text-ink-2 hover:text-ink">
              Use {T.toLowerCase()} anyway
            </button>
          )}
          <button
            disabled={!done}
            onClick={() => (set(verdict), close())}
            className="h-10 rounded-lg bg-[var(--brand-primary)] px-5 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            {!done ? 'Answer all three' : verdict === target ? `Update to ${T.toLowerCase()}` : `Keep ${CONDITIONS[current].label.toLowerCase()}`}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// How the home's value is worked out: price per sq ft from sales nearby, times this home's size.
// Sales in the same or worse condition set the as-is value; sales in better condition set the potential.
// Each sale is a photo card that says, at a glance, why it counts (close by, recent, similar size).
const ppsfOf = (c: Comp) => Math.round(c.price / c.sqft)
const medianOf = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? Math.round(s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0
}

export function CompsReview({ home, comps, set, condition, sqft, fallback }: { home: [number, number]; comps: Comp[]; set: (c: Comp[]) => void; condition: number; sqft: number; fallback: number }) {
  const v = valuesOf(comps, condition, sqft, fallback)
  const toggle = (id: string) => set(comps.map((c) => (c.id === id ? { ...c, picked: !c.picked } : c)))
  const homeIcon = useMemo(() => L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-office"></span>', iconAnchor: [0, 0] }), [])
  const asIsPpsf = medianOf(v.same.map(ppsfOf)) || Math.round(v.asIs / sqft)
  const potPpsf = medianOf(v.better.map(ppsfOf)) || asIsPpsf
  const C = CONDITIONS[condition].label.toLowerCase()
  return (
    <div>
      <Eyebrow n={2} />
      <h1 className="mt-2 text-[26px] leading-tight font-semibold text-ink sm:text-[32px]">How we worked out the home’s value</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        What similar homes nearby sold for per sq ft, times this home’s {sqft.toLocaleString()} sq ft. Homes in {C} condition or below give today’s value; homes in better condition show what it could sell for.
      </p>

      <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <ValueCard label="As-is value" value={v.asIs} ppsf={asIsPpsf} sqft={sqft} n={v.same.length} what={`in ${C} condition or below`} />
          <ValueCard label="Potential value" value={v.potential} ppsf={potPpsf} sqft={sqft} n={v.better.length} what="in better condition" up={v.potential - v.asIs} />
          <div className="sm:col-span-2">
            <Spread comps={comps} condition={condition} asIs={asIsPpsf} potential={potPpsf} />
          </div>
        </div>
        <div className="h-[260px] overflow-hidden rounded-xl border border-line lg:h-auto lg:min-h-[300px]">
          <BaseMap center={home} zoom={13.5} wheelZoom={false}>
            {comps.map((c) => (
              <Marker
                key={c.id}
                position={c.at}
                eventHandlers={{ click: () => toggle(c.id) }}
                icon={L.divIcon({ className: 'rv-pinwrap', html: `<span class="rv-pill${!c.picked ? ' k-off' : c.condition > condition ? ' k-revive' : ''}">${short(c.price)}</span>`, iconAnchor: [0, 0] })}
              />
            ))}
            <Marker position={home} icon={homeIcon} zIndexOffset={1000} />
          </BaseMap>
        </div>
      </div>

      {/* every sale goes by its condition: same or worse sets the as-is value, better sets the potential.
          Within each, the ones in use first, then the ones left out (they can be added). */}
      <CompGroup title="Sets the as-is value" sub={`Sold in ${C} condition or below`} comps={comps.filter((c) => c.condition <= condition)} condition={condition} onToggle={toggle} />
      <CompGroup title="Sets the potential value" sub="Sold in better condition than this home" comps={comps.filter((c) => c.condition > condition)} condition={condition} onToggle={toggle} good />
    </div>
  )
}

function ValueCard({ label, value, ppsf, sqft, n, what, up }: { label: string; value: number; ppsf: number; sqft: number; n: number; what: string; up?: number }) {
  return (
    <div className={cn('rounded-xl border px-5 py-4', up !== undefined ? 'border-[var(--green)]/30 bg-[var(--green-soft,#e7f6ee)]/40' : 'border-line')}>
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-2 text-[28px] leading-none font-semibold text-ink">
        {money(value)}
        {up ? <span className="text-[14px] font-semibold text-[var(--green)]">+{short(up)}</span> : null}
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-2">
        <span className="rounded-md bg-white px-1.5 py-0.5 font-semibold text-ink ring-1 ring-line">{money(ppsf)}/sq ft</span>
        <span className="text-muted">×</span>
        <span className="rounded-md bg-white px-1.5 py-0.5 font-semibold text-ink ring-1 ring-line">{sqft.toLocaleString()} sq ft</span>
      </p>
      <p className="mt-2 text-[12.5px] text-muted">
        {n ? `Median of ${n} ${n === 1 ? 'sale' : 'sales'} ${what}` : `No sales ${what} yet. Add one below.`}
      </p>
    </div>
  )
}

/** Every sale on one line by price per sq ft, with where the two values land. */
function Spread({ comps, condition, asIs, potential }: { comps: Comp[]; condition: number; asIs: number; potential: number }) {
  const xs = comps.map(ppsfOf)
  const lo = Math.min(...xs, asIs) * 0.97
  const hi = Math.max(...xs, potential) * 1.03
  const at = (x: number) => `${((x - lo) / (hi - lo)) * 100}%`
  return (
    <div className="rounded-xl border border-line px-5 pt-4 pb-3">
      <p className="text-[13px] font-semibold text-ink">Price per sq ft of sales nearby</p>
      <div className="relative mt-6 mb-9 h-2 rounded-full bg-line-soft">
        {comps.map((c) => (
          <span
            key={c.id}
            title={`${c.address}: ${money(ppsfOf(c))}/sq ft`}
            className={cn('absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white', !c.picked ? 'bg-line' : c.condition > condition ? 'bg-[var(--green)]' : 'bg-navy')}
            style={{ left: at(ppsfOf(c)) }}
          />
        ))}
        {[
          { x: asIs, label: 'As-is', cls: 'text-ink' },
          { x: potential, label: 'Potential', cls: 'text-[var(--green)]' },
        ].map((m) => (
          <span key={m.label} className="absolute top-1/2 -translate-x-1/2" style={{ left: at(m.x) }}>
            <span className="absolute left-1/2 h-6 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-ink/70" />
            <span className={cn('absolute top-3 left-1/2 -translate-x-1/2 text-[11.5px] font-semibold whitespace-nowrap', m.cls)}>
              {m.label} {money(m.x)}
            </span>
          </span>
        ))}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-navy" /> Same or worse condition</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-[var(--green)]" /> Better condition</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-line" /> Not used</span>
      </p>
    </div>
  )
}

function CompGroup({ title, sub, comps, condition, onToggle, good }: { title: string; sub: string; comps: Comp[]; condition: number; onToggle: (id: string) => void; good?: boolean }) {
  const used = comps.filter((c) => c.picked)
  const out = comps.filter((c) => !c.picked)
  const grid = (cs: Comp[], off?: boolean) => (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cs.map((c) => (
        <CompCard key={c.id} c={c} condition={condition} onToggle={() => onToggle(c.id)} good={good} off={off} />
      ))}
    </div>
  )
  return (
    <section className="mt-9">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-[17px] font-semibold text-ink">
          {title} <span className="font-normal text-muted">· {used.length} used</span>
        </h2>
        <p className="text-[13.5px] text-muted">{sub}</p>
      </div>
      {used.length ? grid(used) : <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-3 text-[13.5px] text-muted">None in use. Add one from below.</p>}
      {out.length > 0 && (
        <>
          <p className="mt-5 text-[13px] font-medium text-ink-2">
            Not used · {out.length} <span className="font-normal text-muted">Too far, too long ago, or too different in size. Add any you think compare.</span>
          </p>
          {grid(out, true)}
        </>
      )}
    </section>
  )
}

function CompCard({ c, condition, onToggle, good, off }: { c: Comp; condition: number; onToggle: () => void; good?: boolean; off?: boolean }) {
  // the three tests a sale has to pass; the one it fails is what keeps it out
  const near = c.miles <= 0.6
  const recent = c.months <= 6
  const sized = !/too (big|small)/.test(c.why)
  const tags = [
    { ok: near, icon: MapPin, text: `${c.miles} mi away` },
    { ok: recent, icon: CalendarDays, text: `Sold ${c.months} mo ago` },
    { ok: sized, icon: Ruler, text: sized ? 'Similar size' : c.sqft > 0 && /big/.test(c.why) ? 'Much bigger' : 'Much smaller' },
  ]
  return (
    <article className={cn('flex flex-col overflow-hidden rounded-xl border bg-white', off ? 'border-line' : good ? 'border-[var(--green)]/40' : 'border-line')}>
      <div className="relative">
        <img src={mlsPhotos(c.address)[0]} alt="" className={cn('h-32 w-full object-cover', off && 'opacity-60 grayscale')} />
        <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[12.5px] font-semibold text-ink shadow-sm">{short(c.price)}</span>
        <span className={cn('absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[11.5px] font-semibold shadow-sm', c.condition > condition ? 'bg-[var(--green)] text-white' : 'bg-white/95 text-ink')}>{CONDITIONS[c.condition].label}</span>
        <button
          onClick={onToggle}
          aria-label={off ? `Use ${c.address}` : `Don’t use ${c.address}`}
          title={off ? 'Use this sale' : 'Don’t use this sale'}
          className={cn('absolute top-2 right-2 grid size-7 place-items-center rounded-full border-2 border-white shadow-sm', off ? 'bg-white/90 text-ink hover:bg-white' : 'bg-[var(--brand-primary)] text-white hover:opacity-90')}
        >
          {off ? <Plus className="size-4" /> : <Check className="size-4" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col px-3.5 pt-3 pb-3.5">
        <p className="truncate text-[14px] font-semibold text-ink">{c.address}</p>
        <p className="mt-0.5 text-[12.5px] text-muted">
          {c.beds} bd · {c.baths} ba · {c.sqft.toLocaleString()} sq ft
        </p>
        <p className="mt-2 text-[16px] font-semibold text-ink">
          {money(Math.round(c.price / c.sqft))}
          <span className="text-[12.5px] font-normal text-muted">/sq ft</span>
        </p>
        <ul className="mt-2.5 space-y-1">
          {tags.map((t) => (
            <li key={t.text} className={cn('flex items-center gap-1.5 text-[12.5px]', t.ok ? 'text-ink-2' : 'font-medium text-[var(--amber)]')}>
              <t.icon className={cn('size-3.5', t.ok ? 'text-[var(--green)]' : 'text-[var(--amber)]')} />
              {t.text}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}

export function RulesReview({ draft, rules }: { draft: ReportDraft; rules: Rule[] }) {
  const groups = ['Zoning', 'Renovation', 'ADU and lot'] as const
  const flags = rules.filter((r) => r.tone === 'flag').length
  return (
    <div>
      <Eyebrow n={3} />
      <h1 className="mt-2 text-[26px] leading-tight font-semibold text-ink sm:text-[32px]">What the rules allow here</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        {rules.length} rules checked for {draft.address}, {draft.city}
        {flags ? `. ${flags} to plan around.` : '. Nothing in the way.'}
      </p>
      <div className="mt-7 space-y-6">
        {groups.map((g) => {
          const rs = rules.filter((r) => r.group === g)
          if (!rs.length) return null
          return (
            <div key={g}>
              <p className="mb-2 text-[13px] font-semibold text-ink">{g}</p>
              <ul className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line">
                {rs.map((r) => (
                  <li key={r.title} className="flex gap-3 px-4 py-3">
                    {r.tone === 'flag' ? <CircleAlert className="mt-0.5 size-4.5 shrink-0 text-[var(--amber)]" /> : <Check className="mt-0.5 size-4.5 shrink-0 text-[var(--green)]" />}
                    <div>
                      <p className="text-[14.5px] font-medium text-ink">{r.title}</p>
                      <p className="mt-0.5 text-[13.5px] text-ink-2">{r.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      <p className="mt-5 text-[12.5px] text-muted">From California law and city rules. Confirm with the city before work starts.</p>
    </div>
  )
}
