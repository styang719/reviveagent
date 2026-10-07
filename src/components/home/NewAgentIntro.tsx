import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { projectGain, reviveProjects, type ReviveProject } from '@/data/reviveProjects'
import { STARTERS } from '@/lib/ai'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'

// Context for a brand-new agent, so Home has something useful before anything is connected:
// what Revive AI does (works with no setup), what Revive has done nearby, and what each part
// of the product is for.

export const askPath = (q: string) => `/ai?q=${encodeURIComponent(q)}`

/** Revive AI works on day one: no CRM or license needed. Asking here opens the Revive AI page. */
export function ReviveAiIntro() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const prompts = [
    { label: 'Value of 250 Elm St?', q: 'What could 250 Elm St sell for after a Revive project?' },
    { label: 'ADU at 412 Oak Ave?', q: STARTERS[2] },
  ]
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    // nothing typed yet: point them at the box rather than open an empty chat
    if (!q.trim()) return inputRef.current?.focus()
    navigate(askPath(q.trim()))
  }
  return (
    <section aria-labelledby="ai-intro" className="rv-ai-card h-full rounded-2xl p-6 shadow-card sm:p-7">
      <div className="flex items-start gap-4">
        <span className="rv-ai-tile grid size-11 shrink-0 place-items-center rounded-xl text-white" aria-hidden="true">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="ai-intro" className="text-lg font-semibold text-ink sm:text-xl">
            Ask Revive about any property
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
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search any address"
              autoComplete="off"
              className="h-12 min-w-0 flex-1 truncate bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
            />
          </div>
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

/** A Revive project as a full-photo card: product and status up top, the result and key details on a dark overlay. */
export function CaseStudy({ p }: { p: ReviveProject }) {
  const g = projectGain(p)
  const label = p.status === 'sold' ? 'more than before' : p.status === 'progress' ? 'expected' : 'added value'
  const details = [
    `${p.weeks} wk build`,
    p.daysOnMarket ? `Sold in ${p.daysOnMarket} days` : null,
    p.offers ? `${p.offers} offers` : null,
    p.rent ? `${money(p.rent)}/mo rent` : null,
    !p.daysOnMarket && !p.rent ? p.scope.slice(0, 2).join(' + ') : null,
  ].filter(Boolean) as string[]
  return (
    <Link
      to="/case-studies"
      className="group relative block h-96 overflow-hidden rounded-2xl bg-navy shadow-card focus-visible:ring-4 focus-visible:ring-[var(--brand-primary-border)]"
    >
      <img src={photoUrl(p.photo)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b1430]/95 via-[#0b1430]/35 to-[#0b1430]/10" />

      <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-2">
        <span className="max-w-[70%] truncate rounded-md bg-white px-2.5 py-1 text-[12px] font-semibold text-ink shadow-sm">{p.product}</span>
        <span className="rounded-md border border-white/30 bg-white/15 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
          {p.status === 'sold' ? 'Sold' : p.status === 'progress' ? 'In progress' : 'Complete'}
        </span>
      </div>

      <div className="absolute inset-x-4 bottom-4 text-white">
        <p className="text-[32px] leading-9 font-semibold tracking-tight tabular-nums">{gain(g)}</p>
        <p className="text-[13px] text-white/75">{label}</p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{p.block}</p>
            <p className="text-[12px] text-white/70">
              {p.city} · {p.when}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {details.slice(0, 3).map((d) => (
                <span key={d} className="rounded-full border border-white/25 bg-white/10 px-2 py-0.5 text-[11.5px] backdrop-blur-sm">
                  {d}
                </span>
              ))}
            </div>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink shadow-md transition-transform group-hover:rotate-45">
            <ArrowUpRight className="size-5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Proof: recent Revive projects near the agent's office, in a scrollable carousel. */
export function CaseStudies() {
  const track = useRef<HTMLDivElement>(null)
  const scroll = (dir: 1 | -1) => {
    const el = track.current
    if (!el) return
    const card = el.querySelector('li')
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 300) + 16), behavior: 'smooth' })
  }
  return (
    <section aria-labelledby="cases-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="cases-title" className="text-xl font-semibold text-ink">
            What Revive has done near you
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">Recent projects around Pasadena. Revive covers the work until the home sells.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/case-studies" className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand hover:underline">
            View all {reviveProjects.length} <ArrowRight className="size-3.5" />
          </Link>
          <div className="flex gap-1.5">
            <button onClick={() => scroll(-1)} className="grid size-9 place-items-center rounded-full border border-line bg-white text-ink-2 hover:bg-head" aria-label="Previous projects">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => scroll(1)} className="grid size-9 place-items-center rounded-full border border-line bg-white text-ink-2 hover:bg-head" aria-label="More projects">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <div ref={track} className="-mx-1 snap-x snap-mandatory overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex gap-4">
          {reviveProjects.map((p) => (
            <li key={p.id} className="w-[min(300px,80%)] shrink-0 snap-start sm:w-[calc((100%-2rem)/2.4)]">
              <CaseStudy p={p} />
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-1 text-[11px] text-faint">Sample projects; photos are illustrative.</p>
    </section>
  )
}
