import { Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
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
    <section aria-labelledby="ai-intro" className="rv-ai-card flex h-full flex-col rounded-2xl p-5 shadow-card sm:p-6">
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

      {/* a single-line search bar on the drifting AI gradient, examples under it; centered in the card */}
      <div className="flex flex-1 flex-col justify-center gap-3 pt-5">
        <div className="relative">
          <div className="rv-ai-aurora pointer-events-none absolute -inset-x-2 -inset-y-3 rounded-3xl" aria-hidden="true" />
          <form
            onSubmit={submit}
            className="relative flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 py-2 pr-2 pl-4 shadow-[0_4px_24px_rgba(27,37,89,0.08)] backdrop-blur-xl transition-shadow focus-within:bg-white/75 focus-within:shadow-[0_8px_32px_rgba(97,0,158,0.16)]"
          >
            <label htmlFor="home-ask" className="sr-only">
              Search any address
            </label>
            <Sparkles className="size-5 shrink-0 text-[#61009e]" aria-hidden="true" />
            <input
              id="home-ask"
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search any address"
              autoComplete="off"
              className="h-11 min-w-0 flex-1 truncate bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
            />
            <button type="submit" className="rv-ai-btn flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white">
              <Sparkles className="size-4" />
              <span className="max-sm:sr-only">Get insights</span>
            </button>
          </form>
        </div>
        <div className="relative flex flex-wrap items-center gap-1.5">
          <span className="mr-0.5 text-[12.5px] text-muted">Try</span>
          {prompts.map((x) => (
            <Link
              key={x.q}
              to={askPath(x.q)}
              className="rounded-full border border-white/90 bg-white/70 px-2.5 py-1 text-[12.5px] whitespace-nowrap text-ink-2 shadow-sm hover:bg-white hover:text-ink"
            >
              {x.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CaseStudy({ p }: { p: ReviveProject }) {
  const g = projectGain(p)
  const headline =
    p.status === 'sold'
      ? { value: gain(g), label: `sale price vs. before · sold in ${p.daysOnMarket} days` }
      : { value: gain(g), label: p.rent ? `added value · rents for ${money(p.rent)}/mo` : 'added value' }
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card">
      <div className="relative">
        <img src={photoUrl(p.photo)} alt="" className="h-36 w-full object-cover" />
        <Badge variant="navy" className="absolute top-2.5 left-2.5">
          {p.product}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[13px] text-muted">
          {p.block}, {p.city}
        </p>
        <p className="mt-1 text-2xl leading-7 font-semibold text-[var(--green)] tabular-nums">{headline.value}</p>
        <p className="text-[13px] text-ink-2">{headline.label}</p>
        <p className="mt-3 text-[13px] text-muted">
          {p.scope.join(' · ')} · {p.weeks} weeks
          {p.offers ? ` · ${p.offers} offers` : ''}
        </p>
        <p className="mt-auto pt-3 text-[12px] text-faint">{p.when}</p>
      </div>
    </article>
  )
}

/** Proof: recent Revive projects near the agent's office. */
export function CaseStudies() {
  const shown = reviveProjects.filter((p) => p.status !== 'progress').slice(0, 3)
  return (
    <section aria-labelledby="cases-title">
      <div className="mb-5">
        <h2 id="cases-title" className="text-lg font-semibold text-ink">
          What Revive has done near you
        </h2>
        <p className="mt-1 text-[13px] text-muted">Recent projects around Pasadena. Revive covers the work until the home sells.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {shown.map((p) => (
          <CaseStudy key={p.id} p={p} />
        ))}
      </div>
      <p className="mt-2 text-[11px] text-faint">Sample projects; photos are illustrative.</p>
    </section>
  )
}
