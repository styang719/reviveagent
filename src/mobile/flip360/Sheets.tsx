import { CircleCheck, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { marginOf, profitOf, type Listing } from './data'
import { DEFAULT_FILTERS, type Filters } from './filters'
import { short } from './pins'
import { ReviveMark } from './Summary'

/** A modal sheet over the map, with a scrim. */
export function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 z-[880] bg-[rgba(16,24,40,0.32)]" />
      <section role="dialog" aria-modal="true" aria-label={label} className="f3-rise absolute inset-x-0 bottom-0 z-[890] flex max-h-[90%] flex-col rounded-t-[28px] bg-white shadow-[0_-12px_40px_rgba(28,46,88,0.18)]">
        <span className="mx-auto mt-2.5 mb-1 block h-1.5 w-10 shrink-0 rounded-full bg-line" aria-hidden="true" />
        {children}
      </section>
    </>
  )
}

// ── Filters ────────────────────────────────────────────────────────────────────────────────────────

function Chips<T extends string | number | null>({ value, options, onChange, label }: { value: T; options: { v: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.v)}
          role="radio"
          aria-checked={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn('h-9 rounded-full border px-3.5 text-[13.5px] font-medium', value === o.v ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink active:bg-head')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ on, onChange, label, sub }: { on: boolean; onChange: (v: boolean) => void; label: string; sub: string }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-4 text-left">
      <span>
        <span className="block text-[15px] font-medium text-ink">{label}</span>
        <span className="block text-[12.5px] text-muted">{sub}</span>
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', on ? 'bg-[var(--green)]' : 'bg-[#d5d9e0]')}>
        <span className={cn('absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </span>
    </button>
  )
}

export function FilterSheet({ value, onApply, onClose, count }: { value: Filters; onApply: (f: Filters) => void; onClose: () => void; count: (f: Filters) => { all: number; revive: number } }) {
  const [f, setF] = useState(value)
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((s) => ({ ...s, [k]: v }))
  const n = count(f)
  return (
    <Modal label="Filters" onClose={onClose}>
      <header className="flex items-center justify-between px-4 pt-1 pb-2">
        <h2 className="text-[18px] font-semibold text-ink">Filters</h2>
        <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-muted active:bg-head">
          <X className="size-5" />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-2">Show on the map</p>
          <div role="radiogroup" aria-label="Show on the map" className="grid grid-cols-2 gap-1 rounded-full bg-line-soft p-1">
            {(
              [
                ['all', 'All listings'],
                ['revive', 'Revive only'],
              ] as const
            ).map(([k, label]) => (
              <button key={k} role="radio" aria-checked={f.show === k} onClick={() => set('show', k)} className={cn('h-9 rounded-full text-[14px] font-medium', f.show === k ? 'bg-white text-ink shadow-sm' : 'text-muted')}>
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-muted">Plain listings stay on by default: they show what the market is asking around an opportunity.</p>
        </div>
        <Toggle on={f.potential} onChange={(v) => set('potential', v)} label="Potential opportunities" sub="Promising, but a Revive underwriter hasn’t confirmed them" />
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-2">Revive est. profit</p>
          <Chips label="Revive est. profit" value={f.minProfit} onChange={(v) => set('minProfit', v)} options={[{ v: 0, label: 'Any' }, { v: 150_000, label: '$150K+' }, { v: 200_000, label: '$200K+' }]} />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-2">List price</p>
          <Chips label="List price" value={f.maxPrice} onChange={(v) => set('maxPrice', v)} options={[{ v: null, label: 'Any' }, { v: 900_000, label: 'Under $900K' }, { v: 1_200_000, label: 'Under $1.2M' }, { v: 1_500_000, label: 'Under $1.5M' }]} />
        </div>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-2">Bedrooms</p>
          <Chips label="Bedrooms" value={f.minBeds} onChange={(v) => set('minBeds', v)} options={[{ v: 0, label: 'Any' }, { v: 2, label: '2+' }, { v: 3, label: '3+' }, { v: 4, label: '4+' }]} />
        </div>
        <Toggle on={f.singleFamily} onChange={(v) => set('singleFamily', v)} label="Single-family only" sub="Flip360 doesn’t take condos or townhouses" />
      </div>
      <footer className="flex items-center gap-3 border-t border-line-soft px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <button onClick={() => setF(DEFAULT_FILTERS)} className="h-12 px-3 text-[15px] font-semibold text-ink underline-offset-4 active:underline">
          Reset
        </button>
        <button onClick={() => onApply(f)} className="h-12 flex-1 rounded-full bg-ink text-[15px] font-semibold text-white active:bg-ink-2">
          Show {n.all} {n.all === 1 ? 'home' : 'homes'}
          {n.revive ? ` · ${n.revive} Revive` : ''}
        </button>
      </footer>
    </Modal>
  )
}

// ── Submit to Flip360 / request a review ──────────────────────────────────────────────────────────

const ROLES = ['I’m the listing agent', 'I know the listing agent', 'No contact yet'] as const

export function SubmitSheet({ l, onClose, onDone }: { l: Listing; onClose: () => void; onDone: () => void }) {
  const review = l.tier === 'potential'
  const [role, setRole] = useState<(typeof ROLES)[number] | null>(null)
  const [note, setNote] = useState('')
  const [state, setState] = useState<'form' | 'sending' | 'sent'>('form')
  useEffect(() => {
    if (state !== 'sending') return
    const t = setTimeout(() => (setState('sent'), onDone()), 1100)
    return () => clearTimeout(t)
  }, [state, onDone])

  if (state === 'sent')
    return (
      <Modal label="Sent" onClose={onClose}>
        <div className="flex flex-col items-center px-6 pt-6 pb-[calc(20px+env(safe-area-inset-bottom))] text-center">
          <span className="grid size-16 place-items-center rounded-full bg-[var(--green-soft)] text-[var(--green)]">
            <CircleCheck className="size-8" />
          </span>
          <h2 className="mt-4 text-[20px] font-semibold text-ink">{review ? 'Review requested' : 'Submitted to Flip360'}</h2>
          <p className="mt-1.5 text-[14px] leading-[21px] text-muted">
            {review
              ? `A Revive underwriter will look at ${l.address} and tell you within 2 business days whether it qualifies.`
              : `A Revive underwriter will confirm the numbers on ${l.address} and reply within 24 hours. You’ll get a push notification.`}
          </p>
          <button onClick={onClose} className="mt-6 h-12 w-full rounded-full bg-ink text-[15px] font-semibold text-white">
            Back to the map
          </button>
        </div>
      </Modal>
    )

  const steps = review
    ? ['Revive checks the open questions', 'You hear back in 2 business days', 'If it qualifies, submit it to Flip360']
    : ['An underwriter confirms the numbers (24 hrs)', 'Walkthrough with your Revive advisor', 'Revive makes the offer; you earn on both sides']
  return (
    <Modal label={review ? 'Request a Revive review' : 'Submit to Flip360'} onClose={onClose}>
      <header className="flex items-start justify-between gap-3 px-4 pt-1 pb-3">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold text-ink">{review ? 'Request a Revive review' : 'Submit to Flip360'}</h2>
          <p className="truncate text-[13.5px] text-muted">
            {l.address} · {short(l.price)}
          </p>
        </div>
        <button onClick={onClose} aria-label="Close" className="-mr-1.5 grid size-9 shrink-0 place-items-center rounded-full text-muted active:bg-head">
          <X className="size-5" />
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
        {!review && (
          <div className="flex items-center justify-between rounded-xl bg-[var(--green-soft)] px-3.5 py-3 text-[13.5px] tabular-nums">
            <span className="text-ink-2">Revive est. profit at list</span>
            <span className="font-semibold text-[var(--green)]">
              {short(profitOf(l))} · {(marginOf(l) * 100).toFixed(1)}%
            </span>
          </div>
        )}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-2">Your connection to this listing</p>
          <div role="radiogroup" aria-label="Your connection to this listing" className="flex flex-col gap-2">
            {ROLES.map((r) => (
              <button key={r} role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={cn('flex h-12 items-center justify-between rounded-xl border px-3.5 text-left text-[14.5px]', role === r ? 'border-[var(--green)] bg-[var(--green-soft)] font-medium text-ink' : 'border-line text-ink')}>
                {r}
                <span className={cn('grid size-5 place-items-center rounded-full border-2', role === r ? 'border-[var(--green)]' : 'border-[#cbd0d8]')}>{role === r && <span className="size-2.5 rounded-full bg-[var(--green)]" />}</span>
              </button>
            ))}
          </div>
        </div>
        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-ink-2">Note for Revive (optional)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={review ? 'e.g. Seller said they’d look at offers near $850K' : 'e.g. Saw it today, the kitchen is original, smells of smoke'} className="w-full resize-none rounded-xl border border-line px-3.5 py-3 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-[var(--green)]" />
        </label>
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-2">What happens next</p>
          <ol className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <li key={s} className="flex items-center gap-3 text-[13.5px] text-ink-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-head text-[12px] font-semibold text-ink">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
      <footer className="border-t border-line-soft px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <button
          disabled={!role || state === 'sending'}
          onClick={() => setState('sending')}
          className={cn('flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold disabled:opacity-45', review ? 'border-[1.5px] border-[var(--green)] text-[var(--green)]' : 'bg-[var(--green)] text-white')}
        >
          {state === 'sending' ? <Loader2 className="f3-spin size-5" /> : !review && <ReviveMark className="h-4 w-[14px]" />}
          {state === 'sending' ? 'Sending…' : review ? 'Request review' : 'Submit to Flip360'}
        </button>
        {!role && <p className="mt-2 text-center text-[12px] text-muted">Pick your connection to continue</p>}
      </footer>
    </Modal>
  )
}
