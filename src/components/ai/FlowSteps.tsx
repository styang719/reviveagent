import { ArrowRight, Check, ExternalLink, FileText, Hammer, ImagePlus, Loader2, PanelRight, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { FlowStep } from '@/lib/ai'
import { answerQuestions, chooseProduct, confirmDetails, confirmPhotos, projectDetails, projectProperty, startProject, submitProject } from '@/lib/flowEngine'
import { GOALS, OCCUPANCY, PRODUCTS, PROJECT_STEPS, recommendProduct, SELLING, TIMELINES } from '@/lib/flows'
import { gain, money } from '@/lib/format'
import { useOpportunities } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

// The interactive cards inside a guided Revive AI conversation. Once a step is answered its card
// goes away (the agent's answer stays in the thread as their message).

const card = 'rounded-xl border border-line bg-white p-4'
const chip = (on: boolean) =>
  cn(
    'rounded-full border px-3 py-1.5 text-[13px] transition-colors',
    on ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] font-medium text-[var(--brand-primary)]' : 'border-line bg-white text-ink-2 hover:border-[var(--brand-primary-border)]',
  )

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-[12px] font-medium text-muted">
      {label}
      {children}
    </label>
  )
}
const input = 'h-9 w-full rounded-lg border border-line bg-white px-2.5 text-sm text-ink tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'

function ReportDetails() {
  const r = useUi((s) => s.flow?.report)
  const [v, setV] = useState({ beds: r?.beds ?? '', baths: r?.baths ?? '', sqft: r?.sqft ?? '', yearBuilt: r?.yearBuilt ?? '', lot: r?.lot ?? '' })
  if (!r) return null
  const num = (x: string | number) => (x === '' ? undefined : Number(x))
  return (
    <div className={card}>
      <div className="flex gap-3">
        {r.photos[0] && <img src={r.photos[0]} alt="" className="size-16 shrink-0 rounded-lg object-cover" />}
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-ink">
            {r.address}
            <span className="font-normal text-muted">, {r.city}</span>
          </p>
          <p className="text-[13px] text-muted">{r.homeType} · from public records</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(
          [
            ['beds', 'Beds'],
            ['baths', 'Baths'],
            ['sqft', 'Sq ft'],
            ['yearBuilt', 'Year built'],
            ['lot', 'Lot sq ft'],
          ] as const
        ).map(([k, label]) => (
          <Field key={k} id={`d-${k}`} label={label}>
            <input id={`d-${k}`} inputMode="numeric" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, '') })} className={input} />
          </Field>
        ))}
      </div>
      <Button
        size="sm"
        className="mt-3"
        onClick={() => confirmDetails({ beds: num(v.beds), baths: num(v.baths), sqft: num(v.sqft), yearBuilt: num(v.yearBuilt), lot: num(v.lot) })}
      >
        <Check /> Looks right
      </Button>
    </div>
  )
}

function ReportPhotos() {
  const photos = useUi((s) => s.flow?.report?.photos ?? [])
  const [list, setList] = useState(photos)
  const [on, setOn] = useState<Set<string>>(() => new Set(photos))
  const fileRef = useRef<HTMLInputElement>(null)
  const add = (files: FileList | null) => {
    for (const f of Array.from(files ?? []).slice(0, 6)) {
      const reader = new FileReader()
      reader.onload = () => {
        const url = String(reader.result)
        setList((l) => [...l, url])
        setOn((s) => new Set(s).add(url))
      }
      reader.readAsDataURL(f)
    }
  }
  const chosen = list.filter((u) => on.has(u))
  return (
    <div className={card}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {list.map((u, i) => {
          const sel = on.has(u)
          return (
            <button
              key={u.slice(-40) + i}
              type="button"
              aria-pressed={sel}
              aria-label={`Photo ${i + 1}${sel ? ', selected' : ''}`}
              onClick={() => setOn((s) => { const n = new Set(s); if (n.has(u)) n.delete(u); else n.add(u); return n })}
              className={cn('relative aspect-square overflow-hidden rounded-lg ring-2 transition', sel ? 'ring-[var(--brand-primary)]' : 'opacity-50 ring-transparent')}
            >
              <img src={u} alt="" className="size-full object-cover" />
              <span className={cn('absolute top-1 right-1 grid size-5 place-items-center rounded-full border-2 border-white', sel ? 'bg-[var(--brand-primary)] text-white' : 'bg-white/70')}>
                {sel && <Check className="size-3" strokeWidth={3} />}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-[12px] text-muted hover:border-[var(--brand-primary-border)] hover:text-ink"
        >
          <ImagePlus className="size-5" /> Add photos
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
      </div>
      <p className="mt-2 text-[12px] text-muted">MLS photos from the last listing. Tap to leave one out.</p>
      <Button size="sm" className="mt-3" disabled={!chosen.length} onClick={() => confirmPhotos(chosen)}>
        Use {chosen.length} photo{chosen.length === 1 ? '' : 's'}
      </Button>
    </div>
  )
}

function ReportQuestions() {
  const [selling, setSelling] = useState<string>()
  const [goal, setGoal] = useState<string>()
  return (
    <div className={card}>
      <p className="text-sm font-medium text-ink">Is your client thinking of selling?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SELLING.map((x) => (
          <button key={x} type="button" className={chip(selling === x)} onClick={() => setSelling(x)}>
            {x}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm font-medium text-ink">What matters most to them?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {GOALS.map((x) => (
          <button key={x} type="button" className={chip(goal === x)} onClick={() => setGoal(x)}>
            {x}
          </button>
        ))}
      </div>
      <Button size="sm" className="mt-4" disabled={!selling || !goal} onClick={() => answerQuestions(selling!, goal!)}>
        <Sparkles /> Generate report
      </Button>
    </div>
  )
}

function Progress({ steps, ms, answered }: { steps: string[]; ms: number; answered?: boolean }) {
  const [n, setN] = useState(answered ? steps.length : 0)
  useEffect(() => {
    if (answered) return
    const t = setInterval(() => setN((x) => Math.min(steps.length, x + 1)), ms / steps.length)
    return () => clearInterval(t)
  }, [answered, ms, steps.length])
  return (
    <ul className={cn(card, 'flex flex-col gap-2')}>
      {steps.map((s, i) => (
        <li key={s} className={cn('flex items-center gap-2 text-sm', i < n ? 'text-ink' : i === n ? 'text-ink-2' : 'text-faint')}>
          {i < n ? <Check className="size-4 text-ok" /> : i === n ? <Loader2 className="size-4 animate-spin text-[var(--brand-primary)]" /> : <span className="size-4" />}
          {s}
        </li>
      ))}
    </ul>
  )
}

/** What the agent can do with a finished report or project, per hand-off version. */
function OpenActions({ kind, id }: { kind: 'report' | 'project'; id: string }) {
  const handoff = useDemo((s) => s.handoff)
  const setPanel = useUi((s) => s.setPanel)
  const setDock = useUi((s) => s.setDock)
  const navigate = useNavigate()
  const to = `/property/${id}?tab=${kind}`
  const label = kind === 'report' ? 'Open the full report' : 'Track the project'
  if (handoff === 'panel')
    return (
      <>
        <Button size="sm" onClick={() => setPanel({ kind, id })}>
          <PanelRight /> {kind === 'report' ? 'Show report' : 'Show project'}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to={to} state={{ fromAi: true }}>
            Open as a page <ExternalLink />
          </Link>
        </Button>
      </>
    )
  if (handoff === 'dock')
    return (
      <Button
        size="sm"
        onClick={() => {
          setDock(true)
          navigate(to, { state: { fromAi: true } })
        }}
      >
        {label} <ArrowRight />
      </Button>
    )
  return (
    <Button size="sm" asChild>
      <Link to={to} state={{ fromAi: true }}>
        {label} <ArrowRight />
      </Link>
    </Button>
  )
}

function ReportReady({ id }: { id: string }) {
  const r = useDemo((s) => s.reports[id])
  if (!r) return null
  const best = [...r.scenarios].sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))[0]
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex gap-3 p-4">
        {r.photos[0] && <img src={r.photos[0]} alt="" className="hidden size-20 shrink-0 rounded-lg object-cover sm:block" />}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-[var(--brand-agent)] uppercase">
            <FileText className="size-3.5" /> Revive AI report
          </p>
          <p className="mt-0.5 text-[15px] font-semibold text-ink">
            {r.address}
            <span className="font-normal text-muted">, {r.city}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-muted">Value today </span>
              <span className="font-semibold text-ink tabular-nums">{money(r.valueNow)}</span>
            </span>
            {best?.gain ? (
              <span>
                <span className="text-muted">Best upside </span>
                <span className="font-semibold text-[var(--green)] tabular-nums">{gain(best.gain)}</span>
                <span className="text-muted"> · {best.product}</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line bg-head px-4 py-3">
        <OpenActions kind="report" id={r.id} />
        <Button size="sm" variant="ghost" onClick={() => startProject({ propertyId: r.id })}>
          <Hammer /> Start a project from it
        </Button>
      </div>
    </div>
  )
}

function ProjectProperty() {
  const reports = useDemo((s) => s.reports)
  const opps = useOpportunities()
  const options = [
    ...Object.values(reports).map((r) => ({ id: r.id, label: `${r.address}`, note: 'Report you made' })),
    ...opps.filter((o) => o.property.source === 'listings' && o.stage !== 'project').map((o) => ({ id: o.id, label: o.property.address, note: 'Your listing' })),
  ].filter((x, i, a) => a.findIndex((y) => y.id === x.id) === i)
  return (
    <div className={card}>
      {options.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {options.slice(0, 6).map((o) => (
            <button key={o.id} type="button" className={chip(false)} onClick={() => projectProperty(o.id)}>
              {o.label} <span className="text-faint">· {o.note}</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-2">No reports or listings yet.</p>
      )}
      <p className="mt-2 text-[12px] text-muted">Or type any address in the box below.</p>
    </div>
  )
}

function ProjectProduct() {
  const pid = useUi((s) => s.flow?.project?.propertyId)
  const report = useDemo((s) => (pid ? s.reports[pid] : undefined))
  const rec = recommendProduct(report, report?.goal)
  const [pick, setPick] = useState(rec)
  return (
    <div className={card}>
      <div className="grid gap-2 sm:grid-cols-2">
        {PRODUCTS.map((p) => (
          <button
            key={p.name}
            type="button"
            aria-pressed={pick === p.name}
            onClick={() => setPick(p.name)}
            className={cn(
              'rounded-lg border p-3 text-left transition-colors',
              pick === p.name ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)]' : 'border-line hover:border-[var(--brand-primary-border)]',
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              {p.name}
              {p.name === rec && <span className="rounded-full bg-[var(--brand-agent-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-agent)]">Suggested</span>}
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-5 text-muted">{p.body}</span>
          </button>
        ))}
      </div>
      <Button size="sm" className="mt-3" onClick={() => chooseProduct(pick)}>
        Continue with {pick}
      </Button>
    </div>
  )
}

function ProjectDetails() {
  const [timeline, setTimeline] = useState<string>()
  const [occupancy, setOccupancy] = useState<string>()
  const [homeowner, setHomeowner] = useState('')
  return (
    <div className={card}>
      <p className="text-sm font-medium text-ink">When does the client want to start?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TIMELINES.map((x) => (
          <button key={x} type="button" className={chip(timeline === x)} onClick={() => setTimeline(x)}>
            {x}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm font-medium text-ink">Who’s living there?</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {OCCUPANCY.map((x) => (
          <button key={x} type="button" className={chip(occupancy === x)} onClick={() => setOccupancy(x)}>
            {x}
          </button>
        ))}
      </div>
      <div className="mt-4 max-w-xs">
        <Field id="pj-owner" label="Homeowner’s name (optional)">
          <input id="pj-owner" value={homeowner} onChange={(e) => setHomeowner(e.target.value)} className={input} />
        </Field>
      </div>
      <Button size="sm" className="mt-4" disabled={!timeline || !occupancy} onClick={() => projectDetails({ timeline: timeline!, occupancy: occupancy!, homeowner: homeowner.trim() || undefined })}>
        Continue
      </Button>
    </div>
  )
}

function ProjectReview() {
  const p = useUi((s) => s.flow?.project)
  const report = useDemo((s) => (p ? s.reports[p.propertyId] : undefined))
  if (!p) return null
  const rows: [string, string][] = [
    ['Property', `${p.address}, ${p.city}`],
    ['Product', p.product ?? '–'],
    ['Timeline', p.timeline ?? '–'],
    ['Occupancy', p.occupancy ?? '–'],
    ...(p.homeowner ? [['Homeowner', p.homeowner] as [string, string]] : []),
    ['Attached', report ? `Revive AI report · ${report.photos.length} photos` : 'Property details from public records'],
  ]
  return (
    <div className={card}>
      <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <Button size="sm" className="mt-4" onClick={submitProject}>
        Submit to Revive
      </Button>
    </div>
  )
}

function ProjectReady({ id }: { id: string }) {
  const p = useDemo((s) => s.projects[id])
  if (!p) return null
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="p-4">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold tracking-wide text-[var(--brand-primary)] uppercase">
          <Hammer className="size-3.5" /> {p.product} project
        </p>
        <p className="mt-0.5 text-[15px] font-semibold text-ink">
          {p.address}
          <span className="font-normal text-muted">, {p.city}</span>
        </p>
        <ol className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
          {PROJECT_STEPS.slice(0, 4).map((s, i) => (
            <li key={s} className={cn('flex items-center gap-1.5', i === 0 ? 'text-ok' : i === 1 ? 'font-medium text-ink' : 'text-faint')}>
              {i === 0 ? <Check className="size-3.5" /> : <span className={cn('size-2 rounded-full', i === 1 ? 'bg-[var(--brand-primary)]' : 'bg-line')} />}
              {s}
              {i < 3 && <span className="text-faint">→</span>}
            </li>
          ))}
        </ol>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line bg-head px-4 py-3">
        <OpenActions kind="project" id={p.propertyId} />
      </div>
    </div>
  )
}

export function FlowStepView({ step, refId, answered }: { step: FlowStep; refId?: string; answered?: boolean }) {
  if (step === 'report-progress')
    return <Progress answered={answered} ms={3600} steps={['Pulling public records', 'Matching recent sales nearby', 'Estimating renovation scenarios', 'Writing your report']} />
  if (step === 'project-progress') return <Progress answered={answered} ms={1800} steps={['Packaging property details and photos', 'Sending to Revive']} />
  if (step === 'report-ready' && refId) return <ReportReady id={refId} />
  if (step === 'project-ready' && refId) return <ProjectReady id={refId} />
  if (answered) return null
  if (step === 'report-details') return <ReportDetails />
  if (step === 'report-photos') return <ReportPhotos />
  if (step === 'report-questions') return <ReportQuestions />
  if (step === 'project-property') return <ProjectProperty />
  if (step === 'project-product') return <ProjectProduct />
  if (step === 'project-details') return <ProjectDetails />
  if (step === 'project-review') return <ProjectReview />
  return null
}
