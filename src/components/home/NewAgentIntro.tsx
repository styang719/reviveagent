import { ArrowRight, MapPin, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { projectGain, reviveProjects, type ReviveProject } from '@/data/reviveProjects'
import { STARTERS } from '@/lib/ai'
import { suggestAddresses } from '@/lib/flows'
import { cn } from '@/lib/utils'
import { photoUrl } from '@/lib/assets'
import { ReviveBubbleBot } from '@/components/ai/ReviveBubbleBot'

// Context for a brand-new agent, so Home has something useful before anything is connected:
// what Revive AI does (works with no setup), what Revive has done nearby, and what each part
// of the product is for.

export const askPath = (q: string) => `/ai?q=${encodeURIComponent(q)}`

/** Revive AI works on day one: no CRM or license needed. Asking here opens the Revive AI page. */
export function ReviveAiIntro() {
  // the one place that opens the full Revive AI page: a search here is a conversation of its own.
  // Every other CTA opens the docked chat instead.
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const prompts = [
    { label: 'Value of 250 Elm St?', q: 'What could 250 Elm St sell for after a Revive project?' },
    { label: 'ADU at 412 Oak Ave?', q: STARTERS[2] },
  ]
  // smart search: as an address is typed, suggest matching ones; picking one runs a Revive AI report on it
  const [active, setActive] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const suggestions = dismissed ? [] : suggestAddresses(q)
  const open = suggestions.length > 0
  const pick = (value: string) => {
    navigate(`/ai?flow=home&address=${encodeURIComponent(value)}`)
    setQ('')
    setActive(0)
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // nothing typed yet: point them at the box rather than open an empty chat
    if (!q.trim()) return inputRef.current?.focus()
    if (open) return pick(suggestions[active].value)
    navigate(askPath(q.trim()))
    setQ('')
  }
  return (
    <section aria-labelledby="ai-intro" className="rv-ai-card rounded-2xl p-6 shadow-card sm:p-7">
      <div className="flex items-start gap-4">
        <ReviveBubbleBot size={52} className="-mt-1 shrink-0" />
        <div className="min-w-0 flex-1">
          <h2 id="ai-intro" className="text-lg font-semibold text-ink sm:text-xl">
            Ask Revive about any home
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">
            See any home’s value today, what it could sell for after a Revive project, and if there’s room for an ADU.
          </p>
        </div>
      </div>

      {/* frosted glass box over a slowly drifting AI gradient */}
      <div className="relative mt-7">
        <div className="rv-ai-aurora pointer-events-none absolute -inset-x-2 -inset-y-3 rounded-3xl" aria-hidden="true" />
        {/* one box: the question on top, examples and the button along the bottom */}
        <form
          onSubmit={submit}
          className="relative rounded-xl border border-white/80 bg-white/55 p-2.5 shadow-[0_4px_24px_rgba(27,37,89,0.08)] backdrop-blur-xl transition-shadow focus-within:bg-white/70 focus-within:shadow-[0_8px_32px_rgba(97,0,158,0.16)]"
        >
          <label htmlFor="home-ask" className="sr-only">
            Search any address
          </label>
          <div className="flex items-center gap-2 px-2">
            <Sparkles className="size-5 shrink-0 text-[#61009e]" aria-hidden="true" />
            <input
              id="home-ask"
              ref={inputRef}
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setActive(0)
                setDismissed(false)
              }}
              onKeyDown={(e) => {
                if (!open) return
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActive((a) => (a + 1) % suggestions.length)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActive((a) => (a - 1 + suggestions.length) % suggestions.length)
                } else if (e.key === 'Escape') setDismissed(true)
              }}
              onBlur={() => setTimeout(() => setDismissed(true), 120)}
              onFocus={() => setDismissed(false)}
              role="combobox"
              aria-expanded={open}
              aria-controls={open ? 'home-ask-list' : undefined}
              aria-activedescendant={open ? `home-ask-${active}` : undefined}
              aria-autocomplete="list"
              placeholder="Search any address"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 truncate bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
            />
          </div>
          {open && (
            <ul
              id="home-ask-list"
              role="listbox"
              aria-label="Address suggestions"
              className="absolute top-[3.75rem] right-2 left-2 z-30 overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-[0_16px_40px_rgba(28,46,88,0.16)]"
            >
              {suggestions.map((sg, i) => (
                <li
                  key={sg.value}
                  id={`home-ask-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(sg.value)
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cn('flex cursor-pointer items-center gap-3 px-4 py-2.5', i === active && 'bg-[var(--brand-primary-subtle)]')}
                >
                  <MapPin className={cn('size-4 shrink-0', sg.known ? 'text-[var(--brand-agent)]' : 'text-muted')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">{sg.line}</span>
                    <span className="block truncate text-[12px] text-muted">{sg.area}</span>
                  </span>
                  {sg.known ? (
                    <span className="shrink-0 rounded-full bg-[var(--brand-agent-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand-agent)]">On record</span>
                  ) : (
                    i === active && <span className="shrink-0 text-[11.5px] text-muted">Run a report ↵</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-1.5 flex flex-col gap-2 border-t border-white/80 px-1 pt-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-1.5 overflow-hidden">
              {prompts.map((x) => (
                <Link
                  key={x.q}
                  to={askPath(x.q)}
                  className="rounded-full border border-white/90 bg-white/60 px-2.5 py-1 text-[12.5px] whitespace-nowrap text-ink-2 hover:bg-white hover:text-ink"
                >
                  {x.label}
                </Link>
              ))}
            </div>
            <button type="submit" className="rv-ai-btn flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white">
              <Sparkles className="size-4" />
              Get insights
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

/** A Revive project, kept minimal: the photo, what it earned, and where. */
export function CaseStudy({ p }: { p: ReviveProject }) {
  const label = p.status === 'sold' ? 'Additional profit' : p.status === 'progress' ? 'Expected profit' : 'Added value'
  return (
    <Link
      to="/case-studies"
      className="group relative block aspect-[9/16] overflow-hidden rounded-2xl bg-navy shadow-card focus-visible:ring-4 focus-visible:ring-[var(--brand-primary-border)]"
    >
      <img src={p.cover ?? photoUrl(p.photo)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-x-3 bottom-3 rounded-xl bg-[#0b1430]/55 p-4 text-white backdrop-blur-md">
        <p className="text-[12.5px] font-medium text-[#7ff0d6]">{label}</p>
        <p className="mt-0.5 text-[26px] leading-8 font-semibold tracking-tight tabular-nums">${projectGain(p).toLocaleString('en-US')}</p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/20 pt-3">
          <span className="truncate text-[14px]">{p.city}</span>
          <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}

/** Proof: recent Revive projects near the agent's office, drifting by slowly in an endless row. */
export function CaseStudies() {
  return (
    <section aria-labelledby="cases-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="cases-title" className="text-xl font-semibold text-ink">
            What Revive has done near you
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">Recent projects around Pasadena. Revive covers the work until the home sells.</p>
        </div>
        <Link to="/case-studies" className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand hover:underline">
          View all {reviveProjects.length} <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {/* the row is drawn twice and moves left by one copy, at the same pace as the listings example */}
      <div className="rv-fade-x rv-marquee-x -mx-1 overflow-hidden px-1">
        <div className="rv-marquee-x-track flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex gap-4 pr-4" aria-hidden={copy === 1 || undefined}>
              {reviveProjects.map((p) => (
                <li key={p.id} className="w-56 shrink-0 sm:w-60">
                  <CaseStudy p={p} />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-faint">Sample projects; photos are illustrative.</p>
    </section>
  )
}
