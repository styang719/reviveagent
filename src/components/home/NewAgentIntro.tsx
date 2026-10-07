import { ArrowRight, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { projectGain, reviveProjects, type ReviveProject } from '@/data/reviveProjects'
import { STARTERS } from '@/lib/ai'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { cn } from '@/lib/utils'

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

/** A Revive project as a premium card: photo with the result on it, before → after, the stats. */
export function CaseStudy({ p }: { p: ReviveProject }) {
  const g = projectGain(p)
  const from = p.before
  const to = p.status === 'sold' ? p.after : p.est
  const label =
    p.status === 'sold' ? 'more than before' : p.status === 'progress' ? 'expected' : p.rent ? `added value · ${money(p.rent)}/mo rent` : 'added value'
  const stats = [
    { k: 'Build', v: `${p.weeks} wks` },
    p.daysOnMarket ? { k: 'Listed', v: `${p.daysOnMarket} days` } : null,
    p.offers ? { k: 'Offers', v: String(p.offers) } : null,
    !p.daysOnMarket && p.scope.length ? { k: 'Scope', v: `${p.scope.length} areas` } : null,
  ].filter(Boolean) as { k: string; v: string }[]
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(28,46,88,0.14)]">
      <div className="relative h-44 overflow-hidden">
        <img src={photoUrl(p.photo)} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a33]/85 via-[#0f1a33]/25 to-transparent" />
        <span className="absolute top-3 left-3 max-w-[calc(100%-7rem)] truncate rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
          {p.product}
        </span>
        <span
          className={cn(
            'absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase',
            p.status === 'sold' ? 'bg-white text-ink' : p.status === 'progress' ? 'bg-[var(--brand-agent)] text-white' : 'bg-[var(--teal-soft)] text-[var(--green)]',
          )}
        >
          {p.status === 'sold' ? 'Sold' : p.status === 'progress' ? 'In progress' : 'Complete'}
        </span>
        <div className="absolute inset-x-4 bottom-3 text-white">
          <p className="text-[28px] leading-8 font-semibold tracking-tight tabular-nums">{gain(g)}</p>
          <p className="text-[12px] text-white/80">{label}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <p className="text-[14px] font-semibold text-ink">{p.block}</p>
          <p className="text-[12px] text-muted">
            {p.city} · {p.when}
          </p>
        </div>

        {from && to ? (
          <div>
            <div className="flex items-baseline justify-between text-[12px] tabular-nums">
              <span className="text-muted">
                Before <span className="font-semibold text-ink-2">{money(from)}</span>
              </span>
              <span className="text-muted">
                {p.status === 'sold' ? 'Sold' : 'Est.'} <span className="font-semibold text-ink">{money(to)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-soft">
              <div className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-agent)]" style={{ width: `${Math.min(100, (from / to) * 100 + 4)}%` }} />
            </div>
          </div>
        ) : (
          <p className="text-[12.5px] leading-5 text-ink-2">{p.scope.join(' · ')}</p>
        )}

        <dl className="mt-auto grid divide-x divide-line rounded-xl bg-head py-2 text-center" style={{ gridTemplateColumns: `repeat(${Math.min(3, stats.length)}, minmax(0, 1fr))` }}>
          {stats.slice(0, 3).map((x) => (
            <div key={x.k} className="px-1">
              <dt className="text-[10.5px] text-muted">{x.k}</dt>
              <dd className="text-[13px] font-semibold text-ink tabular-nums">{x.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  )
}

/** Proof: recent Revive projects near the agent's office. */
export function CaseStudies() {
  const shown = reviveProjects.filter((p) => p.status !== 'progress').slice(0, 2)
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
      <div className="grid gap-5 sm:grid-cols-2">
        {shown.map((p) => (
          <CaseStudy key={p.id} p={p} />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">Sample projects; photos are illustrative.</p>
    </section>
  )
}
