import { BadgeCheck, Check, ChevronRight, Contact, Home as HomeIcon, Loader2, Lock, Send, Hammer } from 'lucide-react'
import { useState } from 'react'
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

// Onboarding and the empty opportunity list are one thing: "Get set up" IS how the list fills.
// Each connection is its own step (different systems, different consent), but they live in one
// module, either can go first, and opportunities appear as soon as one is done.

const CRMS = ['Follow Up Boss', 'kvCORE', 'Lofty', 'BoomTown', 'Sierra Interactive', 'Real Geeks']
const DRE = /^\d{8}$/

function LicenseStep({ done, found }: { done: boolean; found: Opportunity[] }) {
  const connect = useDemo((s) => s.connectLicense)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { license } = useConnections()

  if (done) {
    return (
      <DoneRow
        icon={HomeIcon}
        title="Your listings"
        detail={license ? `DRE #${license} · ${plural(found.length, 'active listing')} found on the MLS` : `${plural(found.length, 'active listing')} from the MLS`}
      />
    )
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const v = value.replace(/\D/g, '')
    if (!DRE.test(v)) return setError('A California DRE license number has 8 digits, like 02134589.')
    setError(null)
    setBusy(true)
    setTimeout(() => {
      connect(v)
      setBusy(false)
      toast.success('Found your listings', { description: '2 active listings on the MLS: 123 Main St and 250 Elm St.' })
    }, 1200)
  }
  return (
    <StepCard
      icon={HomeIcon}
      title="Find your listings"
      time="30 sec"
      body="Enter your license number. We look up your active listings and past sales on the MLS. No MLS login needed."
    >
      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2" noValidate>
        <label htmlFor="dre" className="sr-only">
          California DRE license number
        </label>
        <div className={cn('flex h-10 min-w-0 flex-1 basis-full items-center rounded-lg border bg-white px-3 focus-within:ring-2 sm:basis-auto', error ? 'border-bad focus-within:ring-bad/20' : 'border-line focus-within:border-brand focus-within:ring-brand/20')}>
          <span className="mr-2 text-sm text-muted">DRE #</span>
          <input
            id="dre"
            inputMode="numeric"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="02134589"
            aria-invalid={!!error}
            aria-describedby={error ? 'dre-error' : undefined}
            className="h-full min-w-0 flex-1 bg-transparent text-sm tabular-nums outline-none placeholder:text-faint"
          />
        </div>
        <Button type="submit" disabled={busy} className="h-10">
          {busy ? (
            <>
              <Loader2 className="animate-spin" /> Searching the MLS
            </>
          ) : (
            'Find my listings'
          )}
        </Button>
      </form>
      {error && (
        <p id="dre-error" className="mt-1.5 text-[13px] text-bad">
          {error}
        </p>
      )}
    </StepCard>
  )
}

function CrmStep({ done, found }: { done: boolean; found: Opportunity[] }) {
  const connect = useDemo((s) => s.connectCrm)
  const [pick, setPick] = useState<string | null>(null)
  if (done) {
    return <DoneRow icon={Contact} title="Your contacts" detail={`${AGENT.crm} connected · ${plural(found.length, 'homeowner')} with an address`} />
  }
  return (
    <StepCard
      icon={Contact}
      title="Connect your CRM"
      time="1 min"
      body="We read names and property addresses to find homeowners worth a call. Read-only: Revive never messages your contacts."
    >
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={() => setPick('Follow Up Boss')} className="h-10">
          Connect Follow Up Boss
        </Button>
        {CRMS.slice(1, 3).map((c) => (
          <Button key={c} variant="outline" onClick={() => setPick(c)} className="h-10">
            {c}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => setPick('')} className="h-10">
          More <ChevronRight />
        </Button>
      </div>

      <Dialog open={pick !== null} onOpenChange={(o) => !o && setPick(null)}>
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
                <Button variant="outline" onClick={() => setPick(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    connect()
                    setPick(null)
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
                  <Button key={c} variant="outline" onClick={() => setPick(c)} className="h-11 justify-start">
                    {c}
                  </Button>
                ))}
              </div>
              <p className="mt-4 text-[13px] text-muted">Not listed? You can upload a CSV export of your contacts instead.</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </StepCard>
  )
}

function StepCard({ icon: Icon, title, time, body, children }: { icon: typeof HomeIcon; title: string; time: string; body: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-line bg-white p-4 sm:p-5">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 text-[15px] font-semibold text-ink">
            {title} <span className="text-xs font-normal text-muted">about {time}</span>
          </p>
          <p className="mt-0.5 text-sm leading-5 text-ink-2">{body}</p>
          {children}
        </div>
      </div>
    </li>
  )
}

function DoneRow({ icon: Icon, title, detail }: { icon: typeof HomeIcon; title: string; detail: string }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ok-soft text-ok">
        <Icon className="size-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold text-ink">{title}</span> <span className="text-muted">· {detail}</span>
      </p>
      <BadgeCheck className="size-5 shrink-0 text-ok" aria-label="Connected" />
    </li>
  )
}

function LaterRow({ icon: Icon, title, to, ready }: { icon: typeof HomeIcon; title: string; to?: string; ready: boolean }) {
  const inner = (
    <>
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', ready ? 'bg-brand-soft text-brand' : 'bg-line-soft text-faint')}>
        <Icon className="size-4" />
      </span>
      <span className={cn('flex-1 text-sm', ready ? 'font-medium text-ink' : 'text-muted')}>{title}</span>
      {ready ? <ChevronRight className="size-4 text-muted" /> : <Lock className="size-3.5 text-faint" aria-label="After you connect" />}
    </>
  )
  return (
    <li>
      {ready && to ? (
        <Link to={to} className="flex items-center gap-3 rounded-xl px-4 py-2.5 hover:bg-white">
          {inner}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-2.5">{inner}</div>
      )}
    </li>
  )
}

// Shows what will appear once connected (an empty state should say what goes here).
function ExampleRow() {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-line bg-white/70 p-3" aria-label="Example of an opportunity">
      <img src={photoUrl('contact-102')} alt="" className="size-12 shrink-0 rounded-lg object-cover opacity-80" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-muted">Example</Badge>
          <Badge variant="hot">Call this week</Badge>
          <span className="truncate text-sm font-semibold text-ink">A past client’s home</span>
        </p>
        <p className="mt-0.5 truncate text-[13px] text-muted">Listing expired 23 days ago · Leaning toward selling · Owned 18 yrs</p>
      </div>
      <span className="hidden shrink-0 text-right sm:block">
        <span className="block text-base font-semibold text-ok">+$148K</span>
        <span className="block text-[11px] text-muted">Est. upside</span>
      </span>
    </div>
  )
}

/** Get set up: connect your book (2 steps, any order), then share a report and start a project. */
export function ConnectBook({ opps }: { opps: Opportunity[] }) {
  const { crm, mls } = useConnections()
  const listings = opps.filter((o) => o.property.source === 'listings')
  const contacts = opps.filter((o) => o.property.source === 'contacts')
  const shared = opps.some((o) => o.stage === 'shared' || o.activity.some((a) => a.startsWith('You shared')))
  const project = opps.some((o) => o.stage === 'project')
  const firstShare = opps.find((o) => o.cta.kind === 'share')
  const firstListing = opps.find((o) => o.cta.kind === 'propose')
  const done = [mls, crm, shared, project].filter(Boolean).length
  if (done === 4) return null
  const connectedAny = crm || mls

  return (
    <section aria-labelledby="setup-title" className="rounded-2xl border border-line bg-head p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="setup-title" className="text-lg font-semibold text-ink sm:text-xl">
            {connectedAny ? 'Finish setting up' : 'Find opportunities in your book'}
          </h2>
          <p className="mt-0.5 max-w-xl text-sm text-ink-2">
            {connectedAny
              ? 'Connect the rest of your book so Revive can rank everyone you know.'
              : 'Revive checks the homes you already know, your listings and your contacts, and tells you who to call and why.'}
          </p>
        </div>
        <p className="text-[13px] font-medium text-muted tabular-nums">
          {done} of 4 done
        </p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-ok transition-[width] duration-500" style={{ width: `${(done / 4) * 100}%` }} />
      </div>

      {!connectedAny && <ExampleRow />}

      <ol className="mt-4 flex flex-col gap-3">
        <LicenseStep done={mls} found={listings} />
        <CrmStep done={crm} found={contacts} />
      </ol>
      <ul className="mt-2">
        <LaterRow icon={Send} title={shared ? 'First report shared' : 'Share your first Revive AI report'} ready={connectedAny && !shared} to={firstShare ? `/property/${firstShare.id}?tab=report` : undefined} />
        <LaterRow icon={Hammer} title="Start your first Revive project" ready={connectedAny && !project} to={firstListing ? `/property/${firstListing.id}?tab=project` : undefined} />
      </ul>
    </section>
  )
}
