import { ArrowRight, Hammer, Megaphone, Sparkles, Target } from 'lucide-react'
import { useState } from 'react'
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
  const prompts = [STARTERS[0], STARTERS[2], 'What is 55 Fair Oaks Ave, Pasadena worth?']
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(q.trim() ? askPath(q.trim()) : '/ai')
  }
  return (
    <section aria-labelledby="ai-intro" className="rounded-2xl border border-[#d9d3fb] bg-gradient-to-br from-[#f3f5ff] via-[#f6f2ff] to-[#effcfb] p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-4">
        <span className="rv-ai-tile grid size-11 shrink-0 place-items-center rounded-xl text-white" aria-hidden="true">
          <Sparkles className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="ai-intro" className="text-lg font-semibold text-ink sm:text-xl">
            Ask Revive AI about any home
          </h2>
          <p className="mt-0.5 max-w-2xl text-sm text-ink-2">
            Value today, what a renovation could add, ADU room and the Revive product that fits, in seconds. Works before you connect anything.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-4 flex h-14 items-center gap-2 rounded-xl border border-white bg-white pr-1.5 pl-4 shadow-sm focus-within:border-[#a78bfa] focus-within:ring-4 focus-within:ring-[#a78bfa]/15">
        <label htmlFor="home-ask" className="sr-only">
          Ask Revive AI
        </label>
        <Sparkles className="size-5 shrink-0 text-[#8b5cf6]" aria-hidden="true" />
        <input
          id="home-ask"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about any address"
          autoComplete="off"
          className="h-full min-w-0 flex-1 truncate bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
        />
        <button type="submit" className="rv-ai-btn flex h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white">
          <Sparkles className="size-4" />
          <span className="hidden sm:inline">Get insights</span>
          <span className="sm:hidden">Go</span>
        </button>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-muted">Try</span>
        {prompts.map((x) => (
          <Link
            key={x}
            to={askPath(x)}
            className="rounded-full border border-white bg-white/80 px-3 py-1.5 text-[13px] text-ink-2 shadow-sm hover:border-[#a78bfa] hover:text-ink"
          >
            {x}
          </Link>
        ))}
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
        <p className="mt-1 text-2xl leading-7 font-semibold text-[#08795a] tabular-nums">{headline.value}</p>
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
      <div className="mb-3">
        <h2 id="cases-title" className="text-lg font-semibold text-ink">
          What Revive has done near you
        </h2>
        <p className="text-[13px] text-muted">Recent projects around Pasadena. Revive covers the work until the home sells.</p>
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

const PARTS = [
  { to: '/opportunities', icon: Target, title: 'Opportunities', body: 'Everyone in your book worth a call, ranked, with why now and what Revive could add.' },
  { to: '/projects', icon: Hammer, title: 'Projects', body: 'Follow each Revive renovation from submission to sale, and what it earned you.' },
  { to: '/marketing', icon: Megaphone, title: 'Marketing', body: 'Flyers, social posts and emails for every property, branded with your name.' },
]

/** A short tour of the rest of the product. */
export function GetToKnowRevive() {
  return (
    <section aria-labelledby="tour-title">
      <h2 id="tour-title" className="mb-3 text-lg font-semibold text-ink">
        Get to know Revive
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {PARTS.map((x) => (
          <Link key={x.to} to={x.to} className="group flex flex-col rounded-xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-md">
            <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">
              <x.icon className="size-[18px]" />
            </span>
            <p className="mt-3 text-[15px] font-semibold text-ink">{x.title}</p>
            <p className="mt-1 flex-1 text-[13px] leading-5 text-ink-2">{x.body}</p>
            <p className="mt-3 flex items-center gap-1 text-[13px] font-medium text-brand">
              Take a look <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
