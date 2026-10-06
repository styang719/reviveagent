import { Check, Loader2, Lock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { AGENT } from '@/data/tiers'
import { photoUrl } from '@/lib/assets'
import { plural } from '@/lib/format'
import { useConnections, type Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

// New agents connect two sources: the license number (listings and past sales on the MLS) and the
// CRM (contacts). Each is its own to-do (different systems, different consent); either can go first,
// and opportunities appear on the left as soon as one is done.

const CRMS = ['Follow Up Boss', 'kvCORE', 'Lofty', 'BoomTown', 'Sierra Interactive', 'Real Geeks']
const DRE = /^\d{8}$/

function LicenseForm({ autoFocus }: { autoFocus: boolean }) {
  const connect = useDemo((s) => s.connectLicense)
  const openStep = useUi((s) => s.openStep)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  // focus only when the agent asked for this step, never on page load
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true })
  }, [autoFocus])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = value.replace(/\D/g, '')
    if (!DRE.test(v)) return setError('A California DRE license number has 8 digits, like 02134589.')
    setError(null)
    setBusy(true)
    setTimeout(() => {
      connect(v)
      openStep(null)
      setBusy(false)
      toast.success('Found your listings', { description: '2 active listings on the MLS: 123 Main St and 250 Elm St.' })
    }, 1200)
  }
  return (
    <form onSubmit={submit} className="mt-2.5" noValidate>
      <label htmlFor="dre" className="text-[12px] font-medium text-ink-2">
        California DRE license number
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="dre"
          ref={ref}
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="02134589"
          aria-invalid={!!error}
          aria-describedby={error ? 'dre-error' : undefined}
          className={cn(
            'h-9 min-w-0 flex-1 rounded-lg border bg-white px-3 text-sm tabular-nums outline-none placeholder:text-faint focus:ring-2',
            error ? 'border-bad focus:ring-bad/20' : 'border-line focus:border-brand focus:ring-brand/20',
          )}
        />
        <Button type="submit" size="sm" disabled={busy} className="h-9">
          {busy ? <Loader2 className="animate-spin" aria-label="Searching the MLS" /> : 'Find'}
        </Button>
      </div>
      {error ? (
        <p id="dre-error" className="mt-1 text-[12px] text-bad">
          {error}
        </p>
      ) : (
        <p className="mt-1 text-[12px] text-muted">Public license record. No MLS login needed.</p>
      )}
    </form>
  )
}

function CrmChoices() {
  const openCrm = useUi((s) => s.openCrm)
  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => openCrm('Follow Up Boss')}>
          Follow Up Boss
        </Button>
        <Button size="sm" variant="outline" onClick={() => openCrm('')}>
          Other CRM
        </Button>
      </div>
      <p className="mt-1.5 text-[12px] text-muted">Read-only. Revive never messages your contacts.</p>
    </div>
  )
}

/** The CRM sign-in dialog, opened from the to-do or the empty state. */
export function CrmDialog() {
  const pick = useUi((s) => s.crmPick)
  const openCrm = useUi((s) => s.openCrm)
  const openStep = useUi((s) => s.openStep)
  const connect = useDemo((s) => s.connectCrm)
  return (
    <Dialog open={pick !== null} onOpenChange={(o) => !o && openCrm(null)}>
      <DialogContent>
        {pick ? (
          <>
            <DialogTitle>Connect {pick}</DialogTitle>
            <DialogDescription>You’ll sign in to {pick} and approve read-only access.</DialogDescription>
            <ul className="mt-4 space-y-2 text-sm text-ink-2">
              {['Contact names and property addresses', 'Notes and last activity, to know when you last talked', 'Nothing is sent to your contacts'].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-ok" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => openCrm(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  connect()
                  openCrm(null)
                  openStep(null)
                  toast.success(`${pick} connected`, { description: '12 contacts with an address. Revive checked every home.' })
                }}
              >
                Sign in and connect
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle>Choose your CRM</DialogTitle>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {CRMS.map((c) => (
                <Button key={c} variant="outline" onClick={() => openCrm(c)} className="h-11 justify-start">
                  {c}
                </Button>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-muted">Not listed? You can upload a CSV export of your contacts instead.</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

type Todo = {
  id: string
  title: string
  doneTitle?: string
  hint: string
  done: boolean
  locked?: boolean
  to?: string
  body?: React.ReactNode
}

function TodoItem({ t, open, onToggle }: { t: Todo; open: boolean; onToggle?: () => void }) {
  const mark = (
    <span
      className={cn(
        'mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2',
        t.done ? 'border-ok bg-ok text-white' : t.locked ? 'border-dashed border-line text-faint' : open ? 'border-brand' : 'border-faint',
      )}
      aria-hidden="true"
    >
      {t.done ? <Check className="size-3" strokeWidth={3.5} /> : t.locked ? <Lock className="size-2.5" /> : null}
    </span>
  )
  const label = (
    <span className="min-w-0 flex-1">
      <span className={cn('block text-sm font-medium', t.done ? 'text-muted line-through decoration-faint' : t.locked ? 'text-muted' : 'text-ink')}>
        {t.done ? (t.doneTitle ?? t.title) : t.title}
      </span>
      <span className="block text-[12px] text-muted">{t.hint}</span>
    </span>
  )
  const row = 'flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left'
  return (
    <li className={cn('rounded-xl', open && 'bg-head ring-1 ring-line')}>
      {t.done || t.locked ? (
        <div className={row}>
          {mark}
          {label}
        </div>
      ) : t.to ? (
        <Link to={t.to} className={cn(row, 'hover:bg-head')}>
          {mark}
          {label}
        </Link>
      ) : (
        <button type="button" onClick={onToggle} aria-expanded={open} className={cn(row, !open && 'hover:bg-head')}>
          {mark}
          {label}
        </button>
      )}
      {open && t.body && <div className="px-2 pb-3 pl-10">{t.body}</div>}
    </li>
  )
}

/** Right rail: "Get set up" as a real to-do list. Hidden once everything is done. */
export function SetupTodo({ opps }: { opps: Opportunity[] }) {
  const { crm, mls, license } = useConnections()
  const setupOpen = useUi((s) => s.setupOpen)
  const openStep = useUi((s) => s.openStep)
  const listings = opps.filter((o) => o.property.source === 'listings')
  const contacts = opps.filter((o) => o.property.source === 'contacts')
  const shared = opps.some((o) => o.stage === 'shared' || o.activity.some((a) => a.startsWith('You shared')))
  const project = opps.some((o) => o.stage === 'project')
  const firstShare = opps.find((o) => o.cta.kind === 'share')
  const firstListing = opps.find((o) => o.cta.kind === 'propose')
  const any = crm || mls

  const todos: Todo[] = [
    {
      id: 'license',
      title: 'Add your license number',
      doneTitle: `Listings found (DRE #${license ?? ''})`,
      hint: mls ? plural(listings.length, 'active listing') + ' on the MLS' : 'Finds your listings and past sales · 30 sec',
      done: mls,
      body: <LicenseForm autoFocus={setupOpen === 'license'} />,
    },
    {
      id: 'crm',
      title: 'Connect your CRM',
      doneTitle: `${AGENT.crm} connected`,
      hint: crm ? plural(contacts.length, 'contact') + ' with an address' : 'Finds homeowners worth a call · 1 min',
      done: crm,
      body: <CrmChoices />,
    },
    {
      id: 'share',
      title: 'Share your first Revive AI report',
      hint: any ? 'Send a homeowner what their home could be worth' : 'After you connect your book',
      done: shared,
      locked: !any,
      to: firstShare ? `/property/${firstShare.id}?tab=report` : undefined,
    },
    {
      id: 'project',
      title: 'Start your first project',
      hint: any ? 'Your first Revive deal' : 'After you connect your book',
      done: project,
      locked: !any,
      to: firstListing ? `/property/${firstListing.id}?tab=project` : undefined,
    },
  ]
  const done = todos.filter((t) => t.done).length
  if (done === todos.length) return null
  // expand what was asked for, else the first connection still to do
  const current = setupOpen ?? todos.find((t) => t.body && !t.done)?.id

  return (
    <section id="setup" aria-labelledby="setup-title" className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 id="setup-title" className="text-[15px] font-semibold text-ink">
          Get set up
        </h2>
        <span className="text-xs text-muted tabular-nums">
          {done} of {todos.length}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-soft" aria-hidden="true">
        <div className="h-full rounded-full bg-ok transition-[width] duration-500" style={{ width: `${(done / todos.length) * 100}%` }} />
      </div>
      <ol className="mt-3 flex flex-col gap-1">
        {todos.map((t) => (
          <TodoItem key={t.id} t={t} open={current === t.id && !t.done} onToggle={() => openStep(current === t.id ? null : (t.id as 'license' | 'crm'))} />
        ))}
      </ol>
    </section>
  )
}

const EXAMPLES = [
  { photo: 'contact-102', who: 'A past client', why: 'Listing expired 23 days ago · Leaning toward selling', gain: '+$148K', tag: 'Call this week' },
  { photo: 'contact-103', who: 'Someone in your sphere', why: 'No contact in 5 mo · Owned 21 yrs · Big lot', gain: '+$230K', tag: 'Call this week' },
  { photo: 'contact-109', who: 'Your listing', why: '45 days on market · Renovated comps sold in ~12 days', gain: '+$62K', tag: 'This month' },
]

/** Left column before anything is connected: what will appear here, and how to make it appear. */
export function OpportunitiesEmpty() {
  const openStep = useUi((s) => s.openStep)
  const openCrm = useUi((s) => s.openCrm)
  return (
    <section aria-labelledby="opps-empty-title">
      <h2 id="opps-empty-title" className="text-lg font-semibold text-ink sm:text-xl">
        Your opportunities
      </h2>
      <p className="mt-0.5 text-sm text-ink-2">Revive checks your listings and contacts, then ranks who to call and why.</p>

      <div className="relative mt-4">
        <ul className="flex flex-col gap-3 opacity-60 blur-[1.5px] select-none" aria-hidden="true">
          {EXAMPLES.map((e) => (
            <li key={e.photo} className="flex items-center gap-4 rounded-xl border border-line bg-white p-4">
              <img src={photoUrl(e.photo)} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <Badge variant={e.tag === 'Call this week' ? 'hot' : 'navy'}>{e.tag}</Badge>
                <p className="mt-1 text-sm font-semibold text-ink">{e.who}</p>
                <p className="truncate text-[13px] text-muted">{e.why}</p>
              </div>
              <span className="text-lg font-semibold text-ok">{e.gain}</span>
            </li>
          ))}
        </ul>
        <div className="absolute inset-0 grid place-items-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white/80 p-5 text-center shadow-xl backdrop-blur-md">
            <p className="text-base font-semibold text-ink">See who to call in your own book</p>
            <p className="mt-1 text-sm text-ink-2">Connect either one to start. You can add the other later.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => {
                  openStep('license')
                  document.getElementById('setup')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                Add your license number
              </Button>
              <Button variant="outline" onClick={() => openCrm('Follow Up Boss')}>
                Connect your CRM
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
