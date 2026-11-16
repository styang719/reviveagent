import L from 'leaflet'
import { ArrowLeft, Check, CircleHelp, Hammer, Home, House, HousePlus, MapPin, Search, Sparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Marker } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { BaseMap } from '@/components/map/BaseMap'
import { properties } from '@/data/properties'
import type { Property } from '@/data/types'
import { money } from '@/lib/format'
import { buildReport, draftFromAddress, hash, reportIdFor, suggestAddresses, type ReportDraft } from '@/lib/flows'
import { revivePlan, type PlanKey, type RevivePlan } from '@/lib/plan'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

// Add a home: a full-screen intake (the sidebar stays). One question per screen, three paths after
// "what can Revive help with": sell, renovate, or build. Follows the Revive AI intake board in FigJam.
// It ends with Revive checking the home, then what fits, with a report made and a project one click away.

type Help = 'sell' | 'renovate' | 'build'
type StepId =
  | 'address' | 'details' | 'connection' | 'help'
  | 'situation' | 'listed'
  | 'areas' | 'maintenance' | 'budget' | 'start'
  | 'build' | 'buildWhen' | 'buildWhy' | 'process'
  | 'visit' | 'working' | 'result'

const CONNECTION = ['My client owns it', 'It’s my listing', 'I own it', 'Not in touch with the owner yet'] as const
const HELP: { k: Help; label: string; sub: string; icon: typeof Home }[] = [
  { k: 'sell', label: 'Sell the home', sub: 'Get it ready and sold for more', icon: House },
  { k: 'renovate', label: 'Renovate the home', sub: 'Upgrades for an owner who’s staying', icon: Hammer },
  { k: 'build', label: 'Build or expand', sub: 'An ADU, a second home, or more space', icon: HousePlus },
]
const SITUATION = [
  { k: 'Top sale price', label: 'Prep the home for market to get the most for it' },
  { k: 'Sell fast', label: 'Sell quickly and get the money fast' },
] as const
const AREAS = ['Kitchen', 'Bathroom', 'Paint', 'Flooring', 'Landscaping', 'Other']
const MAINTENANCE = ['Roof', 'Foundation', 'Plumbing', 'Electrical', 'Heating or AC', 'None that we know of']
const BUDGET = ['Under $50K', '$50K–$100K', '$100K–$250K', 'Over $250K', 'Not sure yet']
const START = ['As soon as possible', 'In 1–3 months', 'In 3–6 months', 'Just planning for now']
const BUILD = [
  { label: 'One or more ADUs', fit: 'adu' },
  { label: 'Tear down and rebuild', fit: 'build360' },
  { label: 'Build on vacant land', fit: 'build360' },
  { label: 'Split the lot (SB9)', fit: 'build360' },
  { label: 'Addition or second story', fit: null },
  { label: 'Something else', fit: null },
] as const
const BUILD_WHEN = ['Within 3 months', 'In 3–6 months', 'In 6–12 months', 'Not sure yet']
const BUILD_WHY = ['Rental income', 'Space for family', 'Home office or studio', 'Other']
const PROCESS = ['Just exploring', 'Talked to an architect or builder', 'Have plans drawn', 'Permits submitted']
const TIMES = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM']
const HOME_TYPES: Property['homeType'][] = ['Single family', 'Condo', 'Townhouse', 'Multi-family']
const CHECKS = ['Analyzing the property', 'Checking comps nearby', 'Local regulations and lot rules', 'Finding the best fit']

const TITLE: Record<StepId, string> = {
  address: 'What’s the property address?',
  details: 'Confirm the property details',
  connection: 'What’s your connection to this home?',
  help: 'What can Revive help with?',
  situation: 'Which best describes the situation?',
  listed: 'Is the home already listed on the market?',
  areas: 'Which areas need work?',
  maintenance: 'Any deferred maintenance?',
  budget: 'What’s the renovation budget?',
  start: 'When should work start?',
  build: 'What are they looking to build?',
  buildWhen: 'When should construction begin?',
  buildWhy: 'Why are they considering it?',
  process: 'Where are they in the process?',
  visit: 'Schedule a home visit',
  working: 'Finding the best solution…',
  result: '',
}
const SUB: Partial<Record<StepId, string>> = {
  details: 'From public records and the MLS. Fix anything that’s off.',
  areas: 'Pick all that apply.',
  maintenance: 'Pick all that apply. It helps Revive scope the work.',
  visit: 'A Revive specialist walks the home with you to firm up the numbers. Optional.',
}

function weekdays(n: number) {
  const out: Date[] = []
  const d = new Date()
  while (out.length < n) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d))
  }
  return out
}

export default function AddHome() {
  const navigate = useNavigate()
  const addReport = useDemo((s) => s.addReport)
  const addProject = useDemo((s) => s.addProject)
  const reports = useDemo((s) => s.reports)
  const setDock = useUi((s) => s.setDock)

  const [at, setAt] = useState<StepId>('address')
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState<ReportDraft | null>(null)
  const [connection, setConnection] = useState<string>()
  const [help, setHelp] = useState<Help>()
  const [situation, setSituation] = useState<string>()
  const [listed, setListed] = useState<boolean>()
  const [areas, setAreas] = useState<string[]>([])
  const [maintenance, setMaintenance] = useState<string[]>([])
  const [budget, setBudget] = useState<string>()
  const [start, setStart] = useState<string>()
  const [build, setBuild] = useState<string>()
  const [buildWhen, setBuildWhen] = useState<string>()
  const [buildWhy, setBuildWhy] = useState<string>()
  const [process, setProcess] = useState<string>()
  const [visit, setVisit] = useState<{ day?: number; time?: string }>({})
  const [checked, setChecked] = useState(0)

  const myListing = connection === 'It’s my listing'
  const path: StepId[] = [
    'address', 'details', 'connection', 'help',
    ...(help === 'sell' ? (['situation', ...(myListing ? [] : ['listed']), 'visit'] as StepId[]) : []),
    ...(help === 'renovate' ? (['areas', 'maintenance', 'budget', 'start', 'visit'] as StepId[]) : []),
    ...(help === 'build' ? (['build', 'buildWhen', 'buildWhy', 'process'] as StepId[]) : []),
    'working', 'result',
  ]
  const i = path.indexOf(at)
  const go = (d: 1 | -1) => setAt(path[Math.max(0, Math.min(path.length - 1, i + d))])
  // the path changes with some answers (sell, renovate, build), so moving on reads it after the answer lands
  const pathRef = useRef(path)
  pathRef.current = path
  const pickThen = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setTimeout(() => setAt((cur) => pathRef.current[pathRef.current.indexOf(cur) + 1] ?? cur), 180)
  }

  // what Revive would suggest, from everything answered so far
  const buildPick = BUILD.find((b) => b.label === build)
  const selling = help === 'sell' ? 'Yes, in the next 6 months' : help ? 'No, they plan to stay' : undefined
  const goal = help === 'sell' ? situation : help === 'build' && buildPick?.fit === 'adu' ? 'Add rental income (ADU)' : help ? 'Stay and improve' : undefined
  const report = useMemo(() => (draft ? buildReport({ ...draft, selling, goal }) : null), [draft, selling, goal])
  const plan: RevivePlan | null = report
    ? revivePlan({ valueNow: report.valueNow, sqft: report.sqft, lot: report.lot, homeType: report.homeType, scenarios: report.scenarios, selling, goal, source: myListing || listed ? 'listings' : undefined })
    : null

  // checking the home, then the result; the report is saved as it finishes
  useEffect(() => {
    if (at !== 'working') return
    setChecked(0)
    const ts = CHECKS.map((_, k) => setTimeout(() => setChecked(k + 1), 650 * (k + 1)))
    ts.push(
      setTimeout(() => {
        if (report) addReport({ ...report, createdAt: Date.now() }, true)
        setAt('result')
      }, 650 * (CHECKS.length + 1)),
    )
    return () => ts.forEach(clearTimeout)
  }, [at]) // eslint-disable-line react-hooks/exhaustive-deps

  const days = useMemo(() => weekdays(6), [])
  const can: Partial<Record<StepId, boolean>> = {
    address: !!draft,
    details: !!draft?.sqft,
    connection: !!connection,
    help: !!help,
    situation: !!situation,
    listed: listed !== undefined,
    areas: areas.length > 0,
    maintenance: maintenance.length > 0,
    budget: !!budget,
    start: !!start,
    build: !!build,
    buildWhen: !!buildWhen,
    buildWhy: !!buildWhy,
    process: !!process,
    visit: true,
  }
  const exit = () => navigate('/properties')
  const existing = draft && reports[reportIdFor(`${draft.address}, ${draft.city}`, draft.propertyId)] && at === 'details'

  const startProject = () => {
    if (!report || !plan) return
    const product = fits && chosen ? chosen.name : plan.primary.name
    const when = visit.time && visit.day !== undefined ? `Home visit ${days[visit.day].toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${visit.time}` : (start ?? buildWhen ?? 'In 1–3 months')
    addProject({ id: `pj-${Date.now()}`, createdAt: Date.now(), propertyId: report.id, address: report.address, city: report.city, product, timeline: when, occupancy: 'Owner lives there' })
    navigate(`/property/${report.id}?tab=project`)
  }

  // the build path: does what they want fit this lot?
  const chosen = help === 'build' && buildPick?.fit ? plan?.addons.find((a) => a.key === (buildPick.fit as PlanKey)) : undefined
  const fits = help !== 'build' || !!chosen

  return (
    <div className="flex min-h-[calc(100dvh-var(--demo-h,0px))] flex-col bg-white">
      {/* top: where you are, help, exit */}
      <header className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <p className="text-[13.5px] text-muted">
          <button onClick={exit} className="hover:text-ink">
            Homes
          </button>
          <span className="mx-1.5">/</span>
          <span className="font-medium text-ink">Add a home</span>
        </p>
        <div className="flex items-center gap-2">
          <button onClick={() => setDock(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13.5px] font-medium text-ink hover:bg-head">
            <CircleHelp className="size-4 text-muted" /> Questions?
          </button>
          <button onClick={exit} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13.5px] font-medium text-ink hover:bg-head">
            <X className="size-4 text-muted sm:hidden" /> <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      <section data-intake className="flex-1 px-5 pt-6 pb-10 sm:px-8 sm:pt-12">
        <div className="mx-auto w-full max-w-[680px]">
          {at === 'result' && plan && report ? (
            <Result plan={plan} report={report} fits={fits} chosen={chosen} build={build} visit={visit.time && visit.day !== undefined ? `${days[visit.day].toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} at ${visit.time}` : undefined} onProject={startProject} onReport={() => navigate(`/property/${report.id}`)} />
          ) : (
            <>
              <h1 className="text-[26px] leading-tight font-semibold text-ink sm:text-[34px]">{TITLE[at]}</h1>
              {SUB[at] && <p className="mt-2 text-[15px] text-ink-2">{SUB[at]}</p>}
              <div className="mt-7">
                {at === 'address' && <AddressStep q={q} setQ={setQ} draft={draft} pick={(v) => (setDraft(draftFromAddress(v)), setQ(v))} />}
                {at === 'details' && draft && (
                  <>
                    {existing && (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-subtle)] px-4 py-3">
                        <p className="text-[14px] text-ink">This home is already in your Homes.</p>
                        <button onClick={() => navigate(`/property/${reportIdFor(`${draft.address}, ${draft.city}`, draft.propertyId)}`)} className="text-[14px] font-semibold text-brand hover:underline">
                          Open it
                        </button>
                      </div>
                    )}
                    <Details draft={draft} patch={(p) => setDraft((d) => (d ? { ...d, ...p } : d))} value={report?.valueNow} />
                  </>
                )}
                {at === 'connection' && <Options items={CONNECTION} value={connection} onPick={pickThen(setConnection)} />}
                {at === 'help' && (
                  <div className="space-y-3">
                    {HELP.map((h) => (
                      <Option key={h.k} on={help === h.k} onClick={() => pickThen(setHelp)(h.k)} icon={h.icon} label={h.label} sub={h.sub} />
                    ))}
                  </div>
                )}
                {at === 'situation' && (
                  <div className="space-y-3">
                    {SITUATION.map((s) => (
                      <Option key={s.k} on={situation === s.k} onClick={() => pickThen(setSituation)(s.k)} label={s.label} />
                    ))}
                  </div>
                )}
                {at === 'listed' && <Options items={['Yes', 'No']} value={listed === undefined ? undefined : listed ? 'Yes' : 'No'} onPick={(v) => pickThen(setListed)(v === 'Yes')} />}
                {at === 'areas' && <Multi items={AREAS} value={areas} set={setAreas} />}
                {at === 'maintenance' && <Multi items={MAINTENANCE} value={maintenance} set={(v) => setMaintenance(v.includes('None that we know of') && !maintenance.includes('None that we know of') ? ['None that we know of'] : v.filter((x) => x !== 'None that we know of' || v.length === 1))} />}
                {at === 'budget' && <Options items={BUDGET} value={budget} onPick={pickThen(setBudget)} />}
                {at === 'start' && <Options items={START} value={start} onPick={pickThen(setStart)} />}
                {at === 'build' && <Options items={BUILD.map((b) => b.label)} value={build} onPick={pickThen(setBuild)} />}
                {at === 'buildWhen' && <Options items={BUILD_WHEN} value={buildWhen} onPick={pickThen(setBuildWhen)} />}
                {at === 'buildWhy' && <Options items={BUILD_WHY} value={buildWhy} onPick={pickThen(setBuildWhy)} />}
                {at === 'process' && <Options items={PROCESS} value={process} onPick={pickThen(setProcess)} />}
                {at === 'visit' && <Visit days={days} value={visit} set={setVisit} />}
                {at === 'working' && <Working at={checked} address={draft?.address ?? ''} />}
              </div>
            </>
          )}
        </div>
      </section>

      {/* bottom: progress, back, next */}
      {at !== 'result' && (
        <footer className="sticky bottom-0 bg-white px-5 pb-5 sm:px-8">
          <div className="h-1 overflow-hidden rounded-full bg-[var(--brand-primary-subtle)]">
            <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-300" style={{ width: `${Math.max(4, ((i + 1) / path.length) * 100)}%` }} />
          </div>
          <div className="mt-4 flex items-center justify-between">
            {i > 0 && at !== 'working' ? (
              <button onClick={() => go(-1)} className="inline-flex h-10 items-center gap-1.5 rounded-lg px-1 text-[14px] font-medium text-ink-2 hover:text-ink">
                <ArrowLeft className="size-4" /> Back
              </button>
            ) : (
              <span />
            )}
            {at !== 'working' && (
              <button
                disabled={!can[at]}
                onClick={() => go(1)}
                className="inline-flex h-10 items-center rounded-lg bg-[var(--brand-primary)] px-6 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-40"
              >
                {at === 'details' ? 'Looks right' : at === 'visit' && !visit.time ? 'Skip for now' : path[i + 1] === 'working' ? 'See what fits' : 'Next'}
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}

// ---------- steps ----------

const PIN = L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-office"></span>', iconAnchor: [0, 0] })

function coordsOf(d: ReportDraft | null): [number, number] | null {
  if (!d) return null
  const p = d.propertyId ? properties.find((x) => x.id === d.propertyId) : undefined
  if (p?.lat && p.lng) return [p.lat, p.lng]
  const h = hash(`${d.address} ${d.city}`)
  return [34.13 + (h % 400) / 10000, -118.16 + ((h >>> 9) % 800) / 10000]
}

function AddressStep({ q, setQ, draft, pick }: { q: string; setQ: (v: string) => void; draft: ReportDraft | null; pick: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  const typed = q.trim()
  const sugg = open ? suggestAddresses(q, 5) : []
  const at = coordsOf(draft)
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => (setQ(e.target.value), setOpen(true))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && typed.length > 5) {
              pick(sugg[0]?.value ?? typed)
              setOpen(false)
            }
          }}
          placeholder="Enter the address"
          aria-label="Address"
          className="h-14 w-full rounded-xl border border-line bg-white pr-4 pl-11 text-[16px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
        />
        {open && typed.length > 1 && (
          <ul className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-line bg-white shadow-[0_16px_40px_rgba(28,46,88,0.14)]">
            {sugg.map((s) => (
              <li key={s.value}>
                <button onClick={() => (pick(s.value), setOpen(false))} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-head">
                  <MapPin className="size-4 shrink-0 text-muted" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-medium text-ink">{s.line}</span>
                    <span className="block text-[12.5px] text-muted">{s.area}</span>
                  </span>
                  {s.known && <span className="rounded-full bg-[var(--brand-primary-subtle)] px-2 py-0.5 text-[11.5px] font-medium text-brand">On record</span>}
                </button>
              </li>
            ))}
            {typed.length > 5 && (
              <li className="border-t border-line-soft">
                <button onClick={() => (pick(typed), setOpen(false))} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] text-brand hover:bg-head">
                  <span className="grid size-4 place-items-center font-semibold">+</span> Use “{typed}”
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      <div className="mt-6 h-[300px] overflow-hidden rounded-xl border border-line sm:h-[380px]">
        <BaseMap key={at ? at.join() : 'area'} center={at ?? [34.147, -118.13]} zoom={at ? 14 : 12} wheelZoom={false}>
          {at && <Marker position={at} icon={PIN} title={draft?.address} />}
        </BaseMap>
      </div>
    </div>
  )
}

function Details({ draft, patch, value }: { draft: ReportDraft; patch: (p: Partial<ReportDraft>) => void; value?: number }) {
  const num = (k: 'beds' | 'baths' | 'sqft' | 'lot' | 'yearBuilt', label: string) => (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      <input inputMode="numeric" value={draft[k] ?? ''} onChange={(e) => patch({ [k]: Number(e.target.value.replace(/\D/g, '')) || undefined })} className={INPUT} />
    </label>
  )
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-line">
        <div className="grid h-44 grid-cols-4 grid-rows-2 gap-0.5 bg-line-soft sm:h-56">
          {draft.photos.slice(0, 5).map((src, k) => (
            <img key={k} src={src} alt="" className={cn('size-full object-cover', k === 0 && 'col-span-2 row-span-2')} />
          ))}
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-[16px] font-semibold text-ink">{draft.address}</p>
            <p className="text-[13.5px] text-muted">{draft.city}, CA · MLS photos</p>
          </div>
          {value && (
            <p className="text-[14px] text-ink-2">
              Worth about <span className="font-semibold text-ink">{money(value)}</span>
            </p>
          )}
        </div>
      </div>
      <div>
        <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Home type</span>
        <div className="flex flex-wrap gap-2">
          {HOME_TYPES.map((t) => (
            <button key={t} onClick={() => patch({ homeType: t })} aria-pressed={draft.homeType === t} className={cn('h-10 rounded-full border px-4 text-[14px] font-medium', draft.homeType === t ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] text-brand' : 'border-line text-ink-2 hover:border-ink-2/40')}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {num('beds', 'Beds')}
        {num('baths', 'Baths')}
        {num('sqft', 'Home sq ft')}
        {num('lot', 'Lot sq ft')}
        {num('yearBuilt', 'Year built')}
      </div>
    </div>
  )
}

function Visit({ days, value, set }: { days: Date[]; value: { day?: number; time?: string }; set: (v: { day?: number; time?: string }) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {days.map((d, k) => (
          <button key={k} onClick={() => set({ day: k, time: value.time })} aria-pressed={value.day === k} className={cn('rounded-xl border px-2 py-3 text-center', value.day === k ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] ring-1 ring-[var(--brand-primary)]' : 'border-line hover:border-ink-2/40')}>
            <span className="block text-[12px] font-medium text-muted uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span className="mt-0.5 block text-[18px] font-semibold text-ink">{d.getDate()}</span>
            <span className="block text-[12px] text-muted">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
          </button>
        ))}
      </div>
      {value.day !== undefined && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TIMES.map((t) => (
            <button key={t} onClick={() => set({ ...value, time: t })} aria-pressed={value.time === t} className={cn('h-11 rounded-xl border text-[14px] font-medium', value.time === t ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] text-brand' : 'border-line text-ink hover:border-ink-2/40')}>
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Working({ at, address }: { at: number; address: string }) {
  return (
    <div>
      <p className="text-[15px] text-ink-2">Revive is looking at {address}.</p>
      <div className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--brand-primary-subtle)]">
        <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-500" style={{ width: `${(at / CHECKS.length) * 100}%` }} />
      </div>
      <ul className="mt-6 space-y-3">
        {CHECKS.map((s, k) => (
          <li key={s} className={cn('flex items-center gap-3 text-[15px]', k < at ? 'text-ink' : k === at ? 'text-ink-2' : 'text-muted')}>
            <span className={cn('grid size-5 place-items-center rounded-full', k < at ? 'bg-[var(--brand-primary)] text-white' : 'border border-line')}>
              {k < at ? <Check className="size-3" /> : k === at ? <span className="size-2 animate-pulse rounded-full bg-[var(--brand-primary)]" /> : null}
            </span>
            {s}…
          </li>
        ))}
      </ul>
    </div>
  )
}

function Result({ plan, report, fits, chosen, build, visit, onProject, onReport }: { plan: RevivePlan; report: ReturnType<typeof buildReport>; fits: boolean; chosen?: RevivePlan['addons'][number]; build?: string; visit?: string; onProject: () => void; onReport: () => void }) {
  const main = fits && chosen ? chosen : plan.primary
  const others = [plan.primary, ...plan.addons].filter((o) => o.key !== main.key)
  return (
    <div>
      {fits ? (
        <>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold tracking-wide text-brand uppercase">
            <Sparkles className="size-4" /> Revive recommends
          </p>
          <h1 className="mt-2 text-[26px] leading-tight font-semibold text-ink sm:text-[34px]">{main.name}</h1>
          <p className="mt-2 text-[15px] text-ink-2">{main.intro}</p>
        </>
      ) : (
        <>
          <h1 className="text-[26px] leading-tight font-semibold text-ink sm:text-[34px]">{build ?? 'That'} may not fit.</h1>
          <p className="mt-2 text-[15px] text-ink-2">
            {BUILD.find((b) => b.label === build)?.fit ? plan.noAddonReason ?? 'This lot doesn’t have room for it.' : 'Revive doesn’t take on this kind of project yet.'} Here’s what does fit {report.address}.
          </p>
        </>
      )}

      <div className="mt-7 rounded-xl border border-line p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="text-[17px] font-semibold text-ink">{fits ? main.name : plan.primary.name}</p>
          <p className="text-[17px] font-semibold text-[var(--green)]">+{money((fits ? main : plan.primary).gain)}</p>
        </div>
        <p className="mt-1 text-[14px] text-ink-2">
          {(fits ? main : plan.primary).note ?? plan.why} · worth {money(report.valueNow)} today
        </p>
        {(fits ? others : plan.addons).length > 0 && (
          <div className="mt-4 border-t border-line-soft pt-3">
            <p className="text-[12.5px] font-semibold text-muted uppercase">Also possible</p>
            <ul className="mt-1.5 space-y-1">
              {(fits ? others : plan.addons).map((o) => (
                <li key={o.key} className="flex justify-between gap-4 text-[14px]">
                  <span className="text-ink">{o.name}</span>
                  <span className="font-medium text-ink-2">+{money(o.gain)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {visit && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-head px-4 py-3 text-[14px] text-ink">
          <Check className="size-4 text-[var(--green)]" /> Home visit requested for {visit}. Revive confirms by email.
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <button onClick={onProject} className="inline-flex h-11 items-center rounded-lg bg-[var(--brand-primary)] px-5 text-[14.5px] font-medium text-white hover:opacity-90">
          Start {fits ? main.name : plan.primary.name} with Revive
        </button>
        <button onClick={onReport} className="inline-flex h-11 items-center rounded-lg border border-line px-5 text-[14.5px] font-medium text-ink hover:bg-head">
          {fits ? 'Open the AI report' : 'Explore other opportunities'}
        </button>
      </div>
      <p className="mt-3 text-[13px] text-muted">The Revive AI report is saved to Homes. Share it with the owner when you’re ready.</p>
    </div>
  )
}

// ---------- pieces ----------

const INPUT = 'h-11 w-full rounded-lg border border-line bg-white px-3 text-[14.5px] text-ink outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]'

function Option({ on, onClick, label, sub, icon: Icon, check }: { on: boolean; onClick: () => void; label: string; sub?: string; icon?: typeof Home; check?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn('flex min-h-14 w-full items-center gap-3.5 rounded-xl border px-5 py-3 text-left transition-colors', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] ring-1 ring-[var(--brand-primary)]' : 'border-line hover:border-ink-2/40 hover:bg-head/50')}
    >
      {check && (
        <span className={cn('grid size-5 shrink-0 place-items-center rounded-md border', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' : 'border-line')}>
          {on && <Check className="size-3.5" />}
        </span>
      )}
      {Icon && (
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', on ? 'bg-white text-brand' : 'bg-head text-ink-2')}>
          <Icon className="size-5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        {sub && <span className="mt-0.5 block text-[13.5px] text-muted">{sub}</span>}
      </span>
    </button>
  )
}

function Options({ items, value, onPick }: { items: readonly string[]; value?: string; onPick: (v: string) => void }) {
  return (
    <div className="space-y-3">
      {items.map((it) => (
        <Option key={it} on={value === it} onClick={() => onPick(it)} label={it} />
      ))}
    </div>
  )
}

function Multi({ items, value, set }: { items: string[]; value: string[]; set: (v: string[]) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((it) => (
        <Option key={it} check on={value.includes(it)} onClick={() => set(value.includes(it) ? value.filter((x) => x !== it) : [...value, it])} label={it} />
      ))}
    </div>
  )
}
