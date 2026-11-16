import L from 'leaflet'
import { Check, CircleAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Circle, Marker, useMap } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import { money } from '@/lib/format'
import type { ReportDraft } from '@/lib/flows'
import { CONDITIONS, short, valuesOf, type Comp, type Rule } from '@/lib/intake'
import { cn } from '@/lib/utils'

// "Finding the best solution…" for the intake: a map on the left that shows what Revive is reading, and
// what it's reading on the right, step by step.
//   1. Analyzing the property: zoom to the home, outline the lot, read its record.
//   2. Checking comps: sales nearby pop up one by one as they're read.
//   3. Local regulations: a radius scan over the area while the rules that apply are checked.
//   4. Finding the best fit: back to the home, the options weighed.
// The rules are summaries of California law (ADU: Gov. Code §66310–66342, SB 543; SB 9 lot splits) and
// common city rules (permits, Title 24 energy code, EPA lead-safe work for pre-1978 homes). Overlays and
// zoning are sample data for the prototype.

type Line = { text: string; tone?: 'ok' | 'flag' }

const STEP_MS = [3600, 6000, 5600, 2600]
const STEPS = ['Analyzing the property', 'Checking comps nearby', 'Checking local regulations', 'Working out the values']

/** Moves the map for each step. */
function Camera({ step, home }: { step: number; home: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    const z = [15, 13.5, 12.75, 14.5][step] ?? 14
    map.flyTo(home, z, { duration: step === 0 ? 2 : 1.2 })
  }, [step, home, map])
  return null
}

export function IntakeScan({ draft, home, value, comps, rules: ruleList, condition, onDone }: { draft: ReportDraft; home: [number, number]; value: number; comps: Comp[]; rules: Rule[]; condition: number; onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [tick, setTick] = useState(0) // what's been read within the step
  const rules: Line[] = ruleList.map((r) => ({ text: r.title, tone: r.tone }))
  const vals = valuesOf(comps, condition, draft.sqft ?? 1600, value)
  const open = (draft.lot ?? 0) - (draft.sqft ?? 0)
  const record: Line[] = [
    { text: `Public record: ${draft.beds ?? '–'} bd · ${draft.baths ?? '–'} ba · ${(draft.sqft ?? 0).toLocaleString()} sq ft` },
    { text: `Lot: ${(draft.lot ?? 0).toLocaleString()} sq ft · ${Math.max(0, open).toLocaleString()} sq ft open` },
    { text: `Built ${draft.yearBuilt ?? '—'} · ${draft.homeType}` },
    { text: `MLS photos: condition looks ${CONDITIONS[condition].label.toLowerCase()}` },
  ]
  const picked = comps.filter((c) => c.picked)
  const avgPpsf = Math.round(picked.reduce((s, c) => s + c.price / c.sqft, 0) / Math.max(1, picked.length))
  const fit: Line[] = [
    { text: `As-is value: ${vals.same.length} sales in the same or worse condition` },
    { text: `Potential value: ${vals.better.length} sales in better condition` },
    { text: 'What the lot and the rules allow' },
  ]
  const lists: Line[][] = [record, comps.map((c) => ({ text: `${c.address} · sold ${short(c.price)} · ${CONDITIONS[c.condition].label.toLowerCase()}`, tone: c.picked ? 'ok' : undefined })), rules, fit]
  const per = [record.length, comps.length, rules.length, fit.length]

  useEffect(() => {
    const every = STEP_MS[step] / (per[step] + 1)
    const t = setInterval(() => setTick((n) => Math.min(n + 1, per[step])), every)
    const next = setTimeout(() => {
      if (step === STEPS.length - 1) onDone()
      else {
        setStep(step + 1)
        setTick(0)
      }
    }, STEP_MS[step])
    return () => {
      clearInterval(t)
      clearTimeout(next)
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // the regulations scan: a ring that sweeps out over the area
  const [ring, setRing] = useState(0)
  useEffect(() => {
    if (step !== 2) return
    let raf = 0
    const t0 = performance.now()
    const run = (t: number) => {
      setRing(((t - t0) % 2400) / 2400)
      raf = requestAnimationFrame(run)
    }
    raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [step])

  // the home: pulses while Revive reads it
  const pulsing = step === 0 || step === 3
  const homeIcon = useMemo(() => L.divIcon({ className: 'rv-pinwrap', html: `<span class="rv-office${pulsing ? ' rv-reading' : ''}"></span>`, iconAnchor: [0, 0] }), [pulsing])
  const reading = step === 1 ? comps[Math.max(0, tick - 1)] : undefined
  const done = (k: number) => (k === 0 ? `${record.length} facts read` : k === 1 ? `${comps.length} sales read · ${picked.length} close matches` : k === 2 ? `${rules.length} rules checked` : 'Done')

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-10">
      {/* the map */}
      <div className="relative h-[280px] overflow-hidden rounded-2xl border border-line sm:h-[420px] lg:h-[min(560px,calc(100dvh-260px))]">
        <BaseMap center={home} zoom={11.5} interactive={false} zoomControl={false} overzoom={1}>
          <Camera step={step} home={home} />
          {step === 2 && (
            <>
              <Circle center={home} radius={1600} pathOptions={{ color: '#3e62b6', weight: 1, dashArray: '4 6', fillOpacity: 0.04 }} />
              <Circle center={home} radius={1600 * ring} pathOptions={{ color: '#3e62b6', weight: 2, opacity: 1 - ring, fillColor: '#3e62b6', fillOpacity: 0.12 * (1 - ring) }} />
            </>
          )}
          {step === 1 &&
            comps.slice(0, tick).map((c, k) => (
              <Marker key={k} position={c.at} icon={L.divIcon({ className: 'rv-pinwrap', html: `<span class="rv-pill${c === reading ? ' on' : ''}${c.picked ? '' : ' k-off'}">${short(c.price)}</span>`, iconAnchor: [0, 0] })} />
            ))}
          <Marker position={home} icon={homeIcon} zIndexOffset={1000} />
        </BaseMap>

        {/* what's being read, over the map */}
        {step === 0 && tick > 0 && (
          <div className="pointer-events-none absolute top-4 left-4 w-64 rounded-xl border border-line bg-white/95 p-3.5 shadow-lg backdrop-blur">
            <p className="text-[13.5px] font-semibold text-ink">{draft.address}</p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12.5px]">
              {[
                ['Beds / baths', `${draft.beds ?? '–'} / ${draft.baths ?? '–'}`],
                ['Home', `${(draft.sqft ?? 0).toLocaleString()} sq ft`],
                ['Lot', `${(draft.lot ?? 0).toLocaleString()} sq ft`],
                ['Built', `${draft.yearBuilt ?? '—'}`],
              ]
                .slice(0, Math.min(4, tick))
                .map(([k, v]) => (
                  <div key={k} className="rv-fade">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-semibold text-ink">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        )}
        {reading && (
          <div key={reading.address} className="rv-fade pointer-events-none absolute top-4 left-4 w-64 rounded-xl border border-line bg-white/95 p-3.5 shadow-lg backdrop-blur">
            <p className="text-[11.5px] font-semibold tracking-wide text-muted uppercase">Reading comp {tick} of {comps.length}</p>
            <p className="mt-1 text-[13.5px] font-semibold text-ink">{reading.address}</p>
            <p className="mt-0.5 text-[12.5px] text-ink-2">
              Sold {money(reading.price)} · {reading.months} mo ago · {reading.miles} mi
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-2">
              {reading.sqft.toLocaleString()} sq ft · {money(Math.round(reading.price / reading.sqft))}/sq ft
            </p>
            <span className={cn('mt-2 inline-block rounded-full px-2 py-0.5 text-[11.5px] font-medium', reading.condition > condition ? 'bg-[var(--green-soft,#e7f6ee)] text-[var(--green)]' : 'bg-head text-ink-2')}>{CONDITIONS[reading.condition].label}</span>
          </div>
        )}
        {step === 2 && (
          <div className="pointer-events-none absolute top-4 left-4 rounded-full border border-line bg-white/95 px-3 py-1.5 text-[12.5px] font-medium text-ink shadow-lg">Scanning a 1-mile radius · {draft.city || 'Pasadena'}</div>
        )}
      </div>

      {/* what's being read, in words */}
      <div>
        <h1 className="text-[26px] leading-tight font-semibold text-ink sm:text-[32px]">Finding the best solution…</h1>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--brand-primary-subtle)]">
          <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-700" style={{ width: `${((step + tick / (per[step] || 1)) / STEPS.length) * 100}%` }} />
        </div>
        <ol className="mt-6 space-y-4">
          {STEPS.map((s, k) => (
            <li key={s}>
              <p className={cn('flex items-center gap-3 text-[15px] font-medium', k <= step ? 'text-ink' : 'text-muted')}>
                <span className={cn('grid size-5 shrink-0 place-items-center rounded-full', k < step ? 'bg-[var(--brand-primary)] text-white' : 'border border-line')}>
                  {k < step ? <Check className="size-3" /> : k === step ? <span className="size-2 animate-pulse rounded-full bg-[var(--brand-primary)]" /> : null}
                </span>
                {s}
                {k < step && <span className="ml-auto text-[12.5px] font-normal text-muted">{done(k)}</span>}
              </p>
              {k === step && (
                <ul className="mt-2.5 ml-8 space-y-1.5">
                  {lists[k].slice(0, Math.max(1, tick)).map((l, j) => (
                    <li key={j} className="rv-fade flex items-start gap-2 text-[13.5px] leading-snug text-ink-2">
                      {l.tone === 'flag' ? <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-[var(--amber)]" /> : <Check className={cn('mt-0.5 size-3.5 shrink-0', l.tone === 'ok' ? 'text-[var(--green)]' : 'text-muted')} />}
                      {l.text}
                    </li>
                  ))}
                  {k === 1 && tick === comps.length && (
                    <li className="rv-fade text-[13.5px] font-medium text-ink">
                      {picked.length} close matches · about {money(avgPpsf)}/sq ft
                    </li>
                  )}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
