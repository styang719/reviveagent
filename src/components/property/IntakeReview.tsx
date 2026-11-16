import L from 'leaflet'
import { Check, CircleAlert, Minus, Plus } from 'lucide-react'
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

export function CompsReview({ home, comps, set, condition, sqft, fallback }: { home: [number, number]; comps: Comp[]; set: (c: Comp[]) => void; condition: number; sqft: number; fallback: number }) {
  const v = valuesOf(comps, condition, sqft, fallback)
  const picked = comps.filter((c) => c.picked)
  const left = comps.filter((c) => !c.picked)
  const toggle = (id: string) => set(comps.map((c) => (c.id === id ? { ...c, picked: !c.picked } : c)))
  const homeIcon = useMemo(() => L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-office"></span>', iconAnchor: [0, 0] }), [])
  return (
    <div>
      <Eyebrow n={2} />
      <h1 className="mt-2 text-[26px] leading-tight font-semibold text-ink sm:text-[32px]">How we picked the comps</h1>
      <p className="mt-2 text-[15px] text-ink-2">Sales within 0.6 mi, in the last 6 months, close in size. Add or remove any and the values update.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line px-5 py-4">
          <p className="text-[13px] font-medium text-muted">As-is value</p>
          <p className="mt-1 text-[28px] leading-none font-semibold text-ink">{money(v.asIs)}</p>
          <p className="mt-2 text-[13px] text-ink-2">
            From {v.same.length} {v.same.length === 1 ? 'sale' : 'sales'} in the same or worse condition ({CONDITIONS[condition].label.toLowerCase()} or below)
          </p>
        </div>
        <div className="rounded-xl border border-[var(--green)]/30 bg-[var(--green-soft,#e7f6ee)]/40 px-5 py-4">
          <p className="text-[13px] font-medium text-muted">Potential value</p>
          <p className="mt-1 flex items-baseline gap-2 text-[28px] leading-none font-semibold text-ink">
            {money(v.potential)}
            {v.potential > v.asIs && <span className="text-[15px] font-semibold text-[var(--green)]">+{short(v.potential - v.asIs)}</span>}
          </p>
          <p className="mt-2 text-[13px] text-ink-2">
            {v.better.length ? `From ${v.better.length} ${v.better.length === 1 ? 'sale' : 'sales'} in better condition than this home` : 'No sales in better condition picked yet. Add one below.'}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="h-[300px] overflow-hidden rounded-xl border border-line lg:sticky lg:top-6 lg:h-[520px]">
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

        <div className="space-y-6">
          <CompList title={`Comps we used (${picked.length})`} comps={picked} condition={condition} onToggle={toggle} used />
          <CompList title={`Comps we left out (${left.length})`} comps={left} condition={condition} onToggle={toggle} />
        </div>
      </div>
    </div>
  )
}

function CompList({ title, comps, condition, onToggle, used }: { title: string; comps: Comp[]; condition: number; onToggle: (id: string) => void; used?: boolean }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-ink">{title}</p>
      {comps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-3 text-[13px] text-muted">None.</p>
      ) : (
        <ul className="divide-y divide-line-soft overflow-hidden rounded-xl border border-line">
          {comps.map((c) => (
            <li key={c.id} className={cn('flex items-center gap-3 px-4 py-3', !used && 'bg-head/40')}>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <p className="truncate text-[14px] font-medium text-ink">{c.address}</p>
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[11px] font-medium', c.condition > condition ? 'bg-[var(--green-soft,#e7f6ee)] text-[var(--green)]' : 'bg-head text-ink-2')}>{CONDITIONS[c.condition].label}</span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-ink-2">
                  {money(c.price)} · {c.beds} bd · {c.baths} ba · {c.sqft.toLocaleString()} sq ft · {money(Math.round(c.price / c.sqft))}/sq ft
                </p>
                <p className="mt-0.5 text-[12px] text-muted">{c.why}</p>
              </div>
              <button
                onClick={() => onToggle(c.id)}
                aria-label={used ? `Remove ${c.address}` : `Add ${c.address}`}
                className={cn('inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-[12.5px] font-medium', used ? 'border-line text-ink-2 hover:text-ink' : 'border-[var(--brand-primary-border)] text-brand hover:bg-[var(--brand-primary-subtle)]')}
              >
                {used ? <Minus className="size-3.5" /> : <Plus className="size-3.5" />} {used ? 'Remove' : 'Add'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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
