import { ArrowRight, Check, ExternalLink, FileText, Hammer, ChevronDown, ImagePlus, Loader2, MapPin, PanelRight, Plus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { FlowStep } from '@/lib/ai'
import { answerQuestions, chooseIntent, libraryPhotos, rvAttach, rvHome, rvShare, rvPhotos, rvPhotosOnly, rvStyle, chooseProduct, INTENTS, confirmDetails, confirmPhotos, projectDetails, projectProperty, startProject, submitProject } from '@/lib/flowEngine'
import { GOALS, OCCUPANCY, PRODUCTS, RV_STYLES, suggestAddresses, PROJECT_STEPS, recommendProduct, SELLING, TIMELINES } from '@/lib/flows'
import { gain, money } from '@/lib/format'
import { useOpportunities } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import { RvShareCard } from './RvShareCard'

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

const NO_PHOTOS: string[] = []

function ReportPhotos() {
  // a stable fallback: a fresh [] on every read makes the store subscription re-render forever
  const photos = useUi((s) => s.flow?.report?.photos ?? NO_PHOTOS)
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

/** RenoVision 1: which home. Homes the agent works on, or skip to photos; typing an address also works. */
function RvSource() {
  const opps = useOpportunities()
  const reports = useDemo((s) => s.reports)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const homes = [
    ...Object.values(reports).map((r) => ({ id: r.id as string | undefined, line: r.address, area: r.city })),
    ...opps.filter((o) => o.property.photo).map((o) => ({ id: o.id as string | undefined, line: o.property.address, area: o.property.city })),
  ].filter((h, i, a) => a.findIndex((x) => x.id === h.id) === i)
  const needle = q.trim().toLowerCase()
  // one list: your homes that match, then any other address
  const mine = homes.filter((h) => !needle || `${h.line} ${h.area}`.toLowerCase().includes(needle)).slice(0, 5)
  const other = needle.length > 1 ? suggestAddresses(q, 4).filter((sg) => !mine.some((h) => h.line === sg.line)).map((sg) => ({ id: undefined, line: sg.line, area: sg.area, value: sg.value })) : []
  const options = [...mine.map((h) => ({ ...h, value: `${h.line}, ${h.area}`, mine: true })), ...other.map((o) => ({ ...o, mine: false }))]
  const pick = (o: (typeof options)[number]) => (o.id ? rvHome(o.id) : rvHome(undefined, o.value))
  return (
    <div className={card}>
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault()
          if (open && options[active]) return pick(options[active])
          if (q.trim().length > 4) rvHome(undefined, q.trim())
        }}
      >
        <label className="flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-[var(--brand-primary-border)] focus-within:ring-2 focus-within:ring-[var(--brand-primary-subtle)]">
          <MapPin className="size-4 shrink-0 text-muted" />
          <span className="sr-only">Home</span>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
              setActive(0)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onKeyDown={(e) => {
              if (!open || !options.length) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => (a + 1) % options.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => (a - 1 + options.length) % options.length)
              } else if (e.key === 'Escape') setOpen(false)
            }}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            placeholder="Select one of your homes or type an address"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
          />
          <ChevronDown className="size-4 shrink-0 text-muted" aria-hidden="true" />
        </label>
        {open && options.length > 0 && (
          <ul role="listbox" className="absolute top-12 right-0 left-0 z-30 max-h-64 overflow-auto rounded-lg border border-line bg-white py-1 shadow-[0_16px_40px_rgba(28,46,88,0.16)]">
            {options.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(o)
                }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex cursor-pointer items-center gap-2.5 px-3 py-2', i === active && 'bg-[var(--brand-primary-subtle)]')}
              >
                <MapPin className={cn('size-4 shrink-0', o.mine ? 'text-brand' : 'text-muted')} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">{o.line}</span>
                  <span className="block truncate text-[11.5px] text-muted">{o.area}</span>
                </span>
                {o.mine && <span className="shrink-0 rounded-full bg-[var(--brand-primary-subtle)] px-2 py-0.5 text-[10.5px] font-semibold text-brand">Your home</span>}
              </li>
            ))}
          </ul>
        )}
      </form>
      <Button size="sm" variant="ghost" className="mt-2 text-brand" onClick={rvPhotosOnly}>
        <ImagePlus /> Skip, just use photos
      </Button>
    </div>
  )
}

/** RenoVision 2: which photos. The home's own, or (no home) photos already in Revive; uploads either way. */
function RvPhotos() {
  const rv = useUi((s) => s.flow?.rv)
  const own = rv?.photos ?? NO_PHOTOS
  const [list, setList] = useState(() => (own.length ? own : libraryPhotos()))
  const [on, setOn] = useState<Set<string>>(() => new Set(own.slice(0, 2)))
  const fileRef = useRef<HTMLInputElement>(null)
  const add = (files: FileList | null) => {
    for (const f of Array.from(files ?? []).slice(0, 6)) {
      const reader = new FileReader()
      reader.onload = () => {
        const url = String(reader.result)
        setList((l) => [url, ...l])
        setOn((s) => new Set(s).add(url))
      }
      reader.readAsDataURL(f)
    }
  }
  const chosen = list.filter((u) => on.has(u))
  return (
    <div className={card}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line text-[12px] text-muted hover:border-[var(--brand-primary-border)] hover:text-ink"
        >
          <ImagePlus className="size-5" /> Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} />
        {list.map((u, i) => {
          const sel = on.has(u)
          return (
            <button
              key={u.slice(-40) + i}
              type="button"
              aria-pressed={sel}
              aria-label={`Photo ${i + 1}${sel ? ', selected' : ''}`}
              onClick={() => setOn((s) => { const n = new Set(s); if (n.has(u)) n.delete(u); else n.add(u); return n })}
              className={cn('relative aspect-square overflow-hidden rounded-lg ring-2 transition', sel ? 'ring-[var(--brand-primary)]' : 'ring-transparent')}
            >
              <img src={u} alt="" className="size-full object-cover" />
              <span className={cn('absolute top-1 right-1 grid size-5 place-items-center rounded-full border-2 border-white', sel ? 'bg-[var(--brand-primary)] text-white' : 'bg-white/70')}>
                {sel && <Check className="size-3" strokeWidth={3} />}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[12px] text-muted">{own.length ? `Listing photos of ${rv?.address}.` : 'Photos from your listings and reports.'} Pick up to 4.</p>
      <Button size="sm" className="mt-3" disabled={!chosen.length || chosen.length > 4} onClick={() => rvPhotos(chosen)}>
        Use {chosen.length} photo{chosen.length === 1 ? '' : 's'}
      </Button>
    </div>
  )
}

/** RenoVision 3: the design style. One tap generates. */
function RvStyle() {
  return (
    <div className={cn(card, 'grid gap-2 sm:grid-cols-2')}>
      {RV_STYLES.map((x) => (
        <button
          key={x.name}
          type="button"
          onClick={() => rvStyle(x.name)}
          className="rounded-lg border border-line p-3 text-left transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-subtle)]"
        >
          <span className="block text-sm font-semibold text-ink">{x.name}</span>
          <span className="mt-0.5 block text-[12.5px] leading-5 text-muted">{x.body}</span>
        </button>
      ))}
    </div>
  )
}

/** Designs made from loose photos: add them to a home so they live on its page. */
function RvAttach({ id }: { id: string }) {
  const opps = useOpportunities()
  const reports = useDemo((s) => s.reports)
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState('')
  const homes = [
    ...Object.values(reports).map((r) => ({ id: r.id, label: r.address })),
    ...opps.filter((o) => o.property.photo).map((o) => ({ id: o.id, label: o.property.address })),
  ].filter((h, i, a) => a.findIndex((x) => x.id === h.id) === i).slice(0, 4)
  const sugg = q.trim().length > 1 ? suggestAddresses(q, 4) : []
  return (
    <div className="flex w-full flex-col gap-2.5">
      <p className="text-[12.5px] font-medium text-ink">Save these to a home</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {homes.map((h) => (
          <button key={h.id} type="button" className={chip(false)} onClick={() => rvAttach(id, { id: h.id, address: h.label })}>
            {h.label}
          </button>
        ))}
        <button type="button" className={cn(chip(adding), 'inline-flex items-center gap-1')} onClick={() => setAdding((v) => !v)}>
          <Plus className="size-3.5" /> New home
        </button>
      </div>
      {adding && (
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault()
            const v = sugg[0]?.value ?? q.trim()
            if (v.length > 4) rvAttach(id, { address: v })
          }}
        >
          <div className="flex gap-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type the home’s address"
              aria-label="New home address"
              className="h-9 min-w-0 flex-1 rounded-lg border border-line px-3 text-[13.5px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
            />
            <Button size="sm" type="submit" className="h-9" disabled={q.trim().length < 5}>
              Save
            </Button>
          </div>
          {sugg.length > 0 && (
            <ul className="mt-1 overflow-hidden rounded-lg border border-line bg-white">
              {sugg.map((sg) => (
                <li key={sg.value}>
                  <button type="button" onClick={() => rvAttach(id, { address: sg.value })} className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13px] hover:bg-[var(--brand-primary-subtle)]">
                    <span className="truncate font-medium text-ink">{sg.line}</span>
                    <span className="shrink-0 text-[11.5px] text-muted">{sg.area}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1.5 text-[11.5px] text-muted">The home is added to Homes, with these designs on its page.</p>
        </form>
      )}
    </div>
  )
}

/** RenoVision result: before and after for each photo, and where it's saved. */
function RvReady({ id }: { id: string }) {
  const d = useDemo((s) => s.renovisions[id])
  const shared = useUi((s) => s.chat.some((m) => m.blocks?.some((b) => b.kind === 'flow' && b.step === 'rv-share' && b.refId === id)))
  if (!d) return null
  return (
    <div className="flex flex-col gap-2">
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex flex-col gap-2 p-2">
        {d.pairs.map((p, i) => (
          <div key={i} className="grid grid-cols-2 gap-1 overflow-hidden rounded-lg">
            <span className="relative">
              <img src={p.before} alt="Before" className="aspect-[4/3] w-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10.5px] font-semibold text-white">Before</span>
            </span>
            <span className="relative">
              <img src={p.after} alt={`After, ${d.style}`} className="aspect-[4/3] w-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 rounded bg-[var(--brand-primary)] px-1.5 py-0.5 text-[10.5px] font-semibold text-white">After · {d.style}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line p-3">
        {d.propertyId ? (
          <>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--green)]">
            <Check className="size-3.5" /> Saved to {d.address}
          </span>
          <Button size="sm" variant="outline" className="ml-auto" asChild>
            <Link to={`/property/${d.propertyId}?tab=report`}>
              Open home <ArrowRight />
            </Link>
          </Button>
          </>
        ) : (
          <RvAttach id={d.id} />
        )}
      </div>
    </div>
    {!shared && (
      <button
        type="button"
        onClick={() => rvShare(id)}
        className="flex items-center gap-2 self-start rounded-full border border-[var(--brand-agent-border)] bg-[var(--brand-agent-subtle)] px-3.5 py-2 text-[13px] font-medium text-[var(--brand-agent)] hover:brightness-95"
      >
        <Sparkles className="size-4" /> Create a before & after to share with your client
      </button>
    )}
    </div>
  )
}

/** Home search: what the agent wants to do with this home. One tap moves on. */
function HomeIntent() {
  return (
    <div className={cn(card, 'grid gap-2 sm:grid-cols-2')}>
      {INTENTS.map((x) => (
        <button
          key={x.key}
          type="button"
          onClick={() => chooseIntent(x.key)}
          className="rounded-lg border border-line p-3 text-left transition-colors hover:border-[var(--brand-primary-border)] hover:bg-[var(--brand-primary-subtle)]"
        >
          <span className="block text-sm font-semibold text-ink">{x.label}</span>
          <span className="mt-0.5 block text-[12.5px] leading-5 text-muted">{x.body}</span>
        </button>
      ))}
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
  let [n, setN] = useState(answered ? steps.length : 0) // eslint-disable-line prefer-const
  useEffect(() => {
    if (answered) return
    const t = setInterval(() => setN((x) => Math.min(steps.length, x + 1)), ms / steps.length)
    return () => clearInterval(t)
  }, [answered, ms, steps.length])
  if (answered && n < steps.length) n = steps.length // finished while on screen: show it done
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
  const choices = useUi((s) => s.flow?.choices)
  const products = choices ? PRODUCTS.filter((p) => choices.includes(p.name)) : PRODUCTS
  const suggested = recommendProduct(report, report?.goal)
  const rec = products.some((p) => p.name === suggested) ? suggested : products[0].name
  const [pick, setPick] = useState<string>(rec)
  return (
    <div className={card}>
      <div className="grid gap-2 sm:grid-cols-2">
        {products.map((p) => (
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
  const draftPhotos = useUi((s) => s.flow?.report?.photos?.length)
  if (!p) return null
  const rows: [string, string][] = [
    ['Property', `${p.address}, ${p.city}`],
    ['Product', p.product ?? '–'],
    ['Timeline', p.timeline ?? '–'],
    ['Occupancy', p.occupancy ?? '–'],
    ...(p.homeowner ? [['Homeowner', p.homeowner] as [string, string]] : []),
    ['Attached', report ? `Revive AI report · ${report.photos.length} photos` : draftPhotos ? `Property details · ${draftPhotos} photos` : 'Property details from public records'],
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
  if (step === 'rv-progress') return <Progress answered={answered} ms={3200} steps={['Reading the photos', 'Planning the layout and finishes', 'Rendering the design']} />
  if (step === 'project-progress') return <Progress answered={answered} ms={1800} steps={['Packaging property details and photos', 'Sending to Revive']} />
  if (step === 'report-ready' && refId) return <ReportReady id={refId} />
  if (step === 'project-ready' && refId) return <ProjectReady id={refId} />
  if (answered) return null
  if (step === 'report-details') return <ReportDetails />
  if (step === 'report-photos') return <ReportPhotos />
  if (step === 'report-questions') return <ReportQuestions />
  if (step === 'home-intent') return <HomeIntent />
  if (step === 'rv-source') return <RvSource />
  if (step === 'rv-photos') return <RvPhotos />
  if (step === 'rv-style') return <RvStyle />
  if (step === 'rv-ready' && refId) return <RvReady id={refId} />
  if (step === 'rv-share' && refId) return <RvShareCard id={refId} />
  if (step === 'project-property') return <ProjectProperty />
  if (step === 'project-product') return <ProjectProduct />
  if (step === 'project-details') return <ProjectDetails />
  if (step === 'project-review') return <ProjectReview />
  return null
}
