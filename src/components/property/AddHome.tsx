import { ArrowLeft, Check, FileText, Hammer, MapPin, Plus, Search, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { Property } from '@/data/types'
import { money } from '@/lib/format'
import { buildReport, draftFromAddress, OCCUPANCY, reportIdFor, suggestAddresses, TIMELINES, type ReportDraft } from '@/lib/flows'
import { revivePlan } from '@/lib/plan'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Adding a home to Homes, in one place: find the address, check the facts Revive pulled, say what the
// owner wants, then make a Revive AI report (and, if they're ready, send it to Revive as a project).
// What Revive would recommend updates as the agent answers, so the last step is never a surprise.

export type AddIntent = 'report' | 'project'
const STEPS = ['Address', 'Home', 'Owner', 'Next step'] as const

const RELATIONS = [
  { k: 'listing', label: 'My listing', sub: 'I’m listing it, or about to' },
  { k: 'client', label: 'A client', sub: 'An owner I’m working with' },
  { k: 'prospect', label: 'Prospecting', sub: 'Not in touch with the owner yet' },
] as const
type Relation = (typeof RELATIONS)[number]['k']

const PLANS = [
  { k: 'sell', label: 'Selling soon', selling: 'Yes, in the next 6 months' },
  { k: 'later', label: 'Maybe later', selling: 'Maybe in a year or two' },
  { k: 'stay', label: 'Staying', selling: 'No, they plan to stay' },
  { k: 'unsure', label: 'Not sure', selling: 'Not sure yet' },
] as const
type PlanK = (typeof PLANS)[number]['k']
const SELL_GOALS = [
  { goal: 'Top sale price', sub: 'Worth renovating first' },
  { goal: 'Sell fast', sub: 'List in weeks, no construction' },
] as const
const STAY_GOALS = [
  { goal: 'Stay and improve', sub: 'Upgrade the home they live in' },
  { goal: 'Add rental income (ADU)', sub: 'A unit for rent or family' },
] as const
const HOME_TYPES: Property['homeType'][] = ['Single family', 'Condo', 'Townhouse', 'Multi-family']

export function AddHomeButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-4 text-[14px] font-medium text-white shadow-sm hover:opacity-90"
      >
        <Plus className="size-4" /> Add a home
      </button>
      <AddHomeDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export function AddHomeDialog({ open, onOpenChange, intent = 'report' }: { open: boolean; onOpenChange: (v: boolean) => void; intent?: AddIntent }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-32px)] max-w-[640px] flex-col overflow-hidden p-0">
        {open && <Intake intent={intent} done={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function Intake({ intent: start, done }: { intent: AddIntent; done: () => void }) {
  const navigate = useNavigate()
  const reports = useDemo((s) => s.reports)
  const projects = useDemo((s) => s.projects)
  const addReport = useDemo((s) => s.addReport)
  const addProject = useDemo((s) => s.addProject)

  const [step, setStep] = useState(0)
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState<ReportDraft | null>(null)
  const [relation, setRelation] = useState<Relation | null>(null)
  const [owner, setOwner] = useState('')
  const [plan, setPlan] = useState<PlanK | null>(null)
  const [goal, setGoal] = useState<string | undefined>()
  const [intent, setIntent] = useState<AddIntent>(start)
  const [timeline, setTimeline] = useState<string>(TIMELINES[1])
  const [occupancy, setOccupancy] = useState<string>(OCCUPANCY[0])
  const [working, setWorking] = useState(-1) // the "making the report" checklist, -1 when idle

  // a listing is being sold: skip "what are their plans"
  const planK: PlanK | null = relation === 'listing' ? 'sell' : plan
  const selling = PLANS.find((p) => p.k === planK)?.selling
  const report = useMemo(() => (draft ? buildReport({ ...draft, selling, goal }) : null), [draft, selling, goal])
  const preview = report
    ? revivePlan({ valueNow: report.valueNow, sqft: report.sqft, lot: report.lot, homeType: report.homeType, scenarios: report.scenarios, selling, goal, source: relation === 'listing' ? 'listings' : undefined })
    : null

  const id = draft ? reportIdFor(`${draft.address}, ${draft.city}`, draft.propertyId) : ''
  const existing = draft && (reports[id] || projects[id]) ? id : null

  const pick = (value: string) => {
    setDraft(draftFromAddress(value))
    setQ(value)
    setStep(1)
  }
  const patch = (p: Partial<ReportDraft>) => setDraft((d) => (d ? { ...d, ...p } : d))

  const canNext = [!!draft, !!draft?.sqft, !!relation && !!planK, true][step]
  const steps = ['Pulling sales nearby', 'Estimating today’s value', 'Checking the lot for an ADU', intent === 'project' ? 'Sending to Revive' : 'Writing the report']

  const finish = () => {
    if (!report || !preview) return
    setWorking(0)
    steps.forEach((_, i) => setTimeout(() => setWorking(i + 1), 450 * (i + 1)))
    setTimeout(() => {
      addReport({ ...report, createdAt: Date.now() }, intent === 'project')
      if (intent === 'project')
        addProject({ id: `pj-${Date.now()}`, createdAt: Date.now(), propertyId: report.id, address: report.address, city: report.city, product: preview.primary.name, timeline, occupancy, homeowner: owner.trim() || undefined })
      done()
      navigate(`/property/${report.id}${intent === 'project' ? '?tab=project' : ''}`)
    }, 450 * (steps.length + 1))
  }

  return (
    <>
      {/* header: title, steps */}
      <div className="border-b border-line px-6 pt-5 pb-4">
        <DialogTitle className="text-[18px]">Add a home</DialogTitle>
        <DialogDescription className="mt-0.5 text-[13.5px]">Any address. Revive pulls the facts and shows what it could do for the owner.</DialogDescription>
        <ol className="mt-4 flex items-center gap-1.5" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex min-w-0 flex-1 flex-col gap-1.5" aria-current={i === step ? 'step' : undefined}>
              <span className={cn('h-1 rounded-full', i <= step ? 'bg-[var(--brand-primary)]' : 'bg-line')} />
              <span className={cn('truncate text-[12px] font-medium', i === step ? 'text-ink' : i < step ? 'text-ink-2' : 'text-muted')}>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {working >= 0 ? (
          <Working steps={steps} at={working} address={draft?.address ?? ''} />
        ) : step === 0 ? (
          <AddressStep q={q} setQ={setQ} pick={pick} />
        ) : step === 1 && draft ? (
          <HomeStep draft={draft} patch={patch} value={report?.valueNow} existing={existing} open={() => (done(), navigate(`/property/${existing}`))} />
        ) : step === 2 ? (
          <div className="space-y-6">
            <Field label="Whose home is this?">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {RELATIONS.map((r) => (
                  <Choice key={r.k} on={relation === r.k} onClick={() => setRelation(r.k)} title={r.label} sub={r.sub} />
                ))}
              </div>
            </Field>
            {relation && relation !== 'prospect' && (
              <Field label="Owner’s name" hint="Optional. Goes on the report you share.">
                <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. Maria Chen" className={INPUT} />
              </Field>
            )}
            {relation && relation !== 'listing' && (
              <Field label={relation === 'prospect' ? 'What do you think they’ll do?' : 'What are their plans?'}>
                <div className="flex flex-wrap gap-2">
                  {PLANS.map((p) => (
                    <Pill key={p.k} on={plan === p.k} onClick={() => (setPlan(p.k), setGoal(undefined))}>
                      {p.label}
                    </Pill>
                  ))}
                </div>
              </Field>
            )}
            {(planK === 'sell' || planK === 'stay') && (
              <Field label="What matters most to them?">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(planK === 'sell' ? SELL_GOALS : STAY_GOALS).map((g) => (
                    <Choice key={g.goal} on={goal === g.goal} onClick={() => setGoal(goal === g.goal ? undefined : g.goal)} title={g.goal} sub={g.sub} />
                  ))}
                </div>
              </Field>
            )}
            {preview && planK && <PlanPreview plan={preview} />}
          </div>
        ) : step === 3 && preview && report ? (
          <div className="space-y-5">
            <PlanPreview plan={preview} value={report.valueNow} />
            <Field label="What would you like to do?">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Choice on={intent === 'report'} onClick={() => setIntent('report')} icon={FileText} title="Make the AI report" sub="Ready in seconds. Share it with the owner when you like." />
                <Choice on={intent === 'project'} onClick={() => setIntent('project')} icon={Hammer} title="Start a project" sub={`Send it to Revive for ${preview.primary.name}. Reviewed within 48 hours.`} />
              </div>
            </Field>
            {intent === 'project' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="When should work start?">
                  <select value={timeline} onChange={(e) => setTimeline(e.target.value)} className={INPUT}>
                    {TIMELINES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Who lives there?">
                  <select value={occupancy} onChange={(e) => setOccupancy(e.target.value)} className={INPUT}>
                    {OCCUPANCY.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* footer */}
      {working < 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-line bg-head/60 px-6 py-3.5">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-[14px] font-medium text-ink-2 hover:text-ink">
              <ArrowLeft className="size-4" /> Back
            </button>
          ) : (
            <span className="text-[12.5px] text-muted">Start typing a street number</span>
          )}
          {step > 0 && (
            <button
              disabled={!canNext}
              onClick={() => (step < 3 ? setStep(step + 1) : finish())}
              className="inline-flex h-10 items-center rounded-lg bg-[var(--brand-primary)] px-5 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              {step === 1 ? 'Looks right' : step === 2 ? 'Continue' : intent === 'project' ? 'Send to Revive' : 'Make the report'}
            </button>
          )}
        </div>
      )}
    </>
  )
}

const INPUT = 'h-10 w-full rounded-lg border border-line bg-white px-3 text-[14px] text-ink outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]'

function AddressStep({ q, setQ, pick }: { q: string; setQ: (v: string) => void; pick: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  const sugg = suggestAddresses(q, 6)
  const typed = q.trim()
  return (
    <div>
      <label className="relative block">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted" />
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && typed.length > 5 && pick(sugg[0]?.value ?? typed)}
          placeholder="Street address, city"
          aria-label="Address"
          className="h-12 w-full rounded-xl border border-line bg-white pr-3 pl-10 text-[15px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
        />
      </label>
      {sugg.length > 0 ? (
        <ul className="mt-2 divide-y divide-line-soft overflow-hidden rounded-xl border border-line">
          {sugg.map((s) => (
            <li key={s.value}>
              <button onClick={() => pick(s.value)} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-head">
                <MapPin className="size-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink">{s.line}</span>
                  <span className="block text-[12.5px] text-muted">{s.area}</span>
                </span>
                {s.known && <span className="rounded-full bg-[var(--brand-primary-subtle)] px-2 py-0.5 text-[11.5px] font-medium text-brand">On record</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : typed.length > 5 ? (
        <button onClick={() => pick(typed)} className="mt-2 flex w-full items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left hover:bg-head">
          <MapPin className="size-4 text-muted" />
          <span className="text-[14px] text-ink">
            Use “<span className="font-medium">{typed}</span>”
          </span>
        </button>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 text-[13px] text-ink-2 sm:grid-cols-3">
          {[
            ['1', 'Find the address', 'Revive pulls beds, baths, size and lot from public records.'],
            ['2', 'Tell us about the owner', 'Selling or staying, and what matters most.'],
            ['3', 'Get the report', 'Today’s value and what Revive could add. Start a project from it.'],
          ].map(([n, t, s]) => (
            <div key={n} className="rounded-xl bg-head px-3.5 py-3">
              <span className="grid size-5 place-items-center rounded-full bg-white text-[11.5px] font-semibold text-brand">{n}</span>
              <p className="mt-2 font-semibold text-ink">{t}</p>
              <p className="mt-0.5 text-muted">{s}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function HomeStep({ draft, patch, value, existing, open }: { draft: ReportDraft; patch: (p: Partial<ReportDraft>) => void; value?: number; existing: string | null; open: () => void }) {
  const num = (k: 'beds' | 'baths' | 'sqft' | 'lot' | 'yearBuilt', label: string) => (
    <Field label={label}>
      <input inputMode="numeric" value={draft[k] ?? ''} onChange={(e) => patch({ [k]: Number(e.target.value.replace(/\D/g, '')) || undefined })} className={INPUT} />
    </Field>
  )
  return (
    <div className="space-y-5">
      {existing && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--brand-primary-border)] bg-[var(--brand-primary-subtle)] px-4 py-3">
          <p className="text-[13.5px] text-ink">This home is already in your Homes.</p>
          <button onClick={open} className="text-[13.5px] font-semibold text-brand hover:underline">
            Open it
          </button>
        </div>
      )}
      <div className="flex gap-4">
        <div className="grid h-24 w-32 shrink-0 grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-xl bg-line-soft sm:h-28 sm:w-44">
          {draft.photos.slice(0, 3).map((src, i) => (
            <img key={i} src={src} alt="" className={cn('size-full object-cover', i === 0 && 'row-span-2')} />
          ))}
        </div>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold text-ink">{draft.address}</p>
          <p className="text-[13.5px] text-muted">{draft.city}, CA</p>
          {value && (
            <p className="mt-2 text-[13px] text-ink-2">
              Worth about <span className="font-semibold text-ink">{money(value)}</span> today
            </p>
          )}
          <p className="mt-1 text-[12.5px] text-muted">{draft.propertyId ? 'From Revive’s records and the MLS.' : 'From public records and nearby sales.'} Fix anything that’s off.</p>
        </div>
      </div>
      <Field label="Home type">
        <div className="flex flex-wrap gap-2">
          {HOME_TYPES.map((t) => (
            <Pill key={t} on={draft.homeType === t} onClick={() => patch({ homeType: t })}>
              {t}
            </Pill>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {num('beds', 'Beds')}
        {num('baths', 'Baths')}
        {num('sqft', 'Home sq ft')}
        {num('lot', 'Lot sq ft')}
        {num('yearBuilt', 'Built')}
      </div>
    </div>
  )
}

function PlanPreview({ plan, value }: { plan: ReturnType<typeof revivePlan>; value?: number }) {
  return (
    <div className="rounded-xl border border-line bg-head/60 p-4">
      <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-muted uppercase">
        <Sparkles className="size-3.5 text-brand" /> What Revive would suggest
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-[16px] font-semibold text-ink">{plan.primary.name}</p>
        <p className="text-[14px] font-semibold text-[var(--green)]">+{money(plan.primary.gain)}</p>
      </div>
      <p className="text-[13px] text-ink-2">
        {plan.path === 'sell' ? 'Selling' : 'Staying'} · {plan.why}
        {value ? ` · worth ${money(value)} today` : ''}
      </p>
      {plan.addons.length > 0 ? (
        <p className="mt-2 text-[13px] text-ink-2">
          Also possible on this lot: <span className="font-medium text-ink">{plan.addons.map((a) => `${a.name} (+${money(a.gain)})`).join(', ')}</span>
        </p>
      ) : (
        plan.noAddonReason && <p className="mt-2 text-[12.5px] text-muted">{plan.noAddonReason}</p>
      )}
    </div>
  )
}

function Working({ steps, at, address }: { steps: string[]; at: number; address: string }) {
  return (
    <div className="py-6">
      <p className="text-[15px] font-semibold text-ink">Working on {address}…</p>
      <ul className="mt-4 space-y-2.5">
        {steps.map((s, i) => (
          <li key={s} className={cn('flex items-center gap-2.5 text-[14px]', i < at ? 'text-ink' : i === at ? 'text-ink-2' : 'text-muted')}>
            <span className={cn('grid size-5 place-items-center rounded-full', i < at ? 'bg-[var(--brand-primary)] text-white' : 'border border-line')}>
              {i < at ? <Check className="size-3" /> : i === at ? <span className="size-2 animate-pulse rounded-full bg-[var(--brand-primary)]" /> : null}
            </span>
            {s}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-ink">
        {label}
        {hint && <span className="ml-1.5 font-normal text-muted">{hint}</span>}
      </p>
      {children}
    </div>
  )
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn('h-9 rounded-full border px-3.5 text-[13.5px] font-medium', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] text-brand' : 'border-line bg-white text-ink-2 hover:border-ink-2/40')}
    >
      {children}
    </button>
  )
}

function Choice({ on, onClick, title, sub, icon: Icon }: { on: boolean; onClick: () => void; title: string; sub: string; icon?: typeof FileText }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn('flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left', on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] ring-1 ring-[var(--brand-primary)]' : 'border-line bg-white hover:border-ink-2/40')}
    >
      {Icon && (
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', on ? 'bg-white text-brand' : 'bg-head text-ink-2')}>
          <Icon className="size-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{sub}</span>
      </span>
    </button>
  )
}
