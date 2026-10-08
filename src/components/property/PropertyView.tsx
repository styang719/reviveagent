import { ArrowRight, Check, FileText, Hammer, HousePlus, Megaphone, Share2, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { SourceTag, StageTag } from '@/components/opportunity/Tags'
import { AiLink } from '@/components/ai/AiLink'
import { LeadActivity } from './LeadActivity'
import { Button } from '@/components/ui/button'
import { properties } from '@/data/properties'
import type { Comp, ProjectState, Scenario } from '@/data/types'
import { photoUrl } from '@/lib/assets'
import { buildReport, draftFromAddress, PROJECT_STEPS, type CreatedProject, type GeneratedReport } from '@/lib/flows'
import { gain, money } from '@/lib/format'
import { useOpportunities, type Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// One page per home. Reports and projects made in Revive AI land here, next to everything else
// Revive knows about the property: Overview · Revive AI report · Project · Marketing.

export type PropertyTab = 'report' | 'project' | 'marketing'

interface Model {
  id: string
  address: string
  city: string
  facts: string[]
  photos: string[]
  valueNow: number
  valueLo: number
  valueHi: number
  sources: { name: string; value: number }[]
  scenarios: Scenario[]
  comps: Comp[]
  report?: GeneratedReport
  created?: CreatedProject
  builtIn?: ProjectState
  opp?: Opportunity
  isPreview: boolean // an address with no report yet: quick estimate only
  reportRun: boolean // a report already exists for this home (run earlier, or by the homeowner on the lead form)
  sqft?: number
  lot?: number
}

export function usePropertyModel(id: string, address?: string): Model | null {
  const opps = useOpportunities()
  const report = useDemo((s) => s.reports[id])
  const created = useDemo((s) => s.projects[id])
  return useMemo(() => {
    const known = properties.find((p) => p.id === id)
    const opp = opps.find((o) => o.id === id)
    const quick = !known && !report && id === 'new' && address ? buildReport(draftFromAddress(address)) : undefined
    const r = report ?? quick
    if (!known && !r) return null
    const facts = (x: { beds?: number; baths?: number; sqft?: number; yearBuilt?: number; homeType?: string }) =>
      [x.homeType, x.beds && `${x.beds} bd`, x.baths && `${x.baths} ba`, x.sqft && `${x.sqft.toLocaleString()} sqft`, x.yearBuilt && `built ${x.yearBuilt}`].filter(Boolean) as string[]
    const vals = known?.valueSources?.map((s) => s.value) ?? []
    return {
      id,
      address: known?.address ?? r!.address,
      city: known?.city ?? r!.city,
      facts: facts(r ?? known!),
      photos: r?.photos.length ? r.photos : known?.photo ? [photoUrl(known.photo)!] : [],
      valueNow: r?.valueNow ?? known!.valueNow,
      valueLo: r?.valueLo ?? Math.min(...vals),
      valueHi: r?.valueHi ?? Math.max(...vals),
      sources: known?.valueSources ?? [],
      scenarios: r?.scenarios ?? known!.scenarios,
      comps: known?.comps ?? [],
      report: report,
      created,
      builtIn: opp ? known?.project : undefined,
      opp,
      isPreview: !!quick,
      reportRun: !!report || !!known?.reportRun,
      sqft: r?.sqft ?? known?.sqft,
      lot: r?.lot ?? known?.lot,
    }
  }, [id, address, opps, report, created])
}

const TABS: { id: PropertyTab; label: string }[] = [
  { id: 'report', label: 'Revive AI report' },
  { id: 'project', label: 'Project' },
  { id: 'marketing', label: 'Marketing' },
]

const aiPath = (flow: 'report' | 'project', m: Model) =>
  `/ai?flow=${flow}&${m.isPreview ? `address=${encodeURIComponent(`${m.address}, ${m.city}`)}` : `property=${m.id}`}`

function ShareButton({ m }: { m: Model }) {
  const share = useDemo((s) => s.shareReport)
  const to = m.opp?.person?.name
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        share(m.id, m.address, to)
        toast.success(to ? `Report shared with ${to}` : 'Report link copied', { description: 'Branded with your name. You’ll see here when it’s opened.' })
      }}
    >
      <Share2 /> Share report
    </Button>
  )
}

export function PropertyView({ m, tab, onTab, compact = false }: { m: Model; tab: PropertyTab; onTab: (t: PropertyTab) => void; compact?: boolean }) {
  const hasProject = !!m.created || !!m.builtIn
  return (
    <div className="flex flex-col gap-5">
      <header className={cn('flex flex-col gap-4', !compact && 'sm:flex-row')}>
        {m.photos[0] && <img src={m.photos[0]} alt={`Photo of ${m.address}`} className={cn('w-full rounded-xl object-cover', compact ? 'h-36' : 'h-44 sm:h-36 sm:w-56')} />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {m.opp && <SourceTag source={m.opp.property.source} />}
            {m.opp && <StageTag stage={m.opp.stage} />}
            {m.report && <span className="rounded-full bg-[var(--brand-agent-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-agent)]">Revive AI report</span>}
            {m.created && <span className="rounded-full bg-[var(--brand-primary-subtle)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-primary)]">Project submitted</span>}
          </div>
          <h1 className={cn('mt-2 font-semibold text-ink', compact ? 'text-lg' : 'text-2xl')}>
            {m.address}
            <span className="font-normal text-muted">, {m.city}</span>
          </h1>
          <p className="text-sm text-muted">{m.facts.join(' · ')}</p>
          {m.opp?.person && (
            <p className="mt-1 text-sm text-ink-2">
              <Link to={`/person/${m.opp.person.id}`} className="font-medium hover:text-brand hover:underline">
                {m.opp.person.name}
              </Link>{' '}
              · {m.opp.property.ownerRole === 'Seller' ? 'Seller' : m.opp.person.relationship}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {hasProject ? (
              <Button size="sm" onClick={() => onTab('project')}>
                <Hammer /> View project
              </Button>
            ) : (
              <Button size="sm" asChild>
                <AiLink to={aiPath('project', m)}>
                  <Hammer /> Start a project
                </AiLink>
              </Button>
            )}
            <ShareButton m={m} />
          </div>
        </div>
      </header>

      <div role="tablist" aria-label="Property sections" className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => onTab(t.id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              tab === t.id ? 'border-[var(--brand-primary)] text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'report' && <Report m={m} compact={compact} />}
        {tab === 'project' && <Project m={m} />}
        {tab === 'marketing' && <Marketing m={m} />}
      </div>
    </div>
  )
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'ok' }) {
  return (
    <div className={cn('rounded-lg p-3', tone === 'ok' ? 'bg-ok-soft/60' : 'bg-head')}>
      <p className="text-[12px] text-muted">{label}</p>
      <p className={cn('text-lg font-semibold tabular-nums', tone === 'ok' ? 'text-[var(--green)]' : 'text-ink')}>{value}</p>
      {sub && <p className="truncate text-[12px] text-muted">{sub}</p>}
    </div>
  )
}

// The three ways Revive could add value, side by side: what each is, the value it adds, the space it adds.
const OPTIONS = [
  { key: 'sell', name: 'Renovate to Sell', icon: Hammer, intro: 'Revive renovates the kitchen, baths and finishes before listing, and is repaid at closing.', match: (p: string) => p === 'Renovate to Sell' },
  { key: 'adu', name: 'ADU', icon: HousePlus, intro: 'Revive builds a detached unit for rental income or family, and you pay over time.', match: (p: string) => p.includes('ADU') },
  { key: 's360', name: 'Sell 360', icon: Sparkles, intro: 'Light prep, paint and staging so the home lists in weeks, with no construction.', match: (p: string) => p === 'Sell 360' },
]

/** A detached ADU sized to the open lot: about a tenth of it, between 400 and 1,200 sq ft. */
const aduSqft = (m: Model) => (m.lot && m.sqft ? Math.min(1200, Math.max(400, Math.round(((m.lot - m.sqft) * 0.1) / 50) * 50)) : 600)

function TopOptions({ m }: { m: Model }) {
  const sell = m.scenarios.find((s) => s.product === 'Renovate to Sell')
  const rows = OPTIONS.map((o) => {
    let sc = m.scenarios.find((s) => o.match(s.product))
    // no Sell 360 scenario on file: light prep usually adds a bit under half of a full renovation
    if (!sc && o.key === 's360' && sell?.gain) sc = { product: 'Sell 360', note: 'Staging and light prep, no construction', gain: Math.round((sell.gain * 0.45) / 1000) * 1000 }
    return { ...o, sc }
  })
  const best = Math.max(...rows.map((r) => r.sc?.gain ?? 0))
  return (
    <section aria-labelledby="top-options">
      <h2 id="top-options" className="text-[15px] font-semibold text-ink">
        Top opportunities
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {rows.map(({ key, name, icon: Icon, intro, sc }) => {
          const ok = !!sc?.gain
          const top = ok && sc!.gain === best
          return (
            <div key={key} className={cn('flex flex-col rounded-xl border p-4', top ? 'border-[var(--brand-primary-border)] bg-white shadow-card' : ok ? 'border-line bg-white shadow-card' : 'border-line bg-head')}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <span className="grid size-8 place-items-center rounded-lg bg-[var(--brand-primary-subtle)] text-brand">
                    <Icon className="size-4" />
                  </span>
                  {name}
                </p>
                {top && <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-[var(--green)]">Best upside</span>}
              </div>
              <p className="mt-2.5 text-[13px] leading-5 text-ink-2">{intro}</p>
              {sc?.note && <p className="mt-1.5 text-[12.5px] leading-5 text-muted">{sc.note}</p>}
              <dl className="mt-auto grid grid-cols-2 gap-2 pt-4">
                <div className="rounded-lg bg-head px-3 py-2">
                  <dt className="text-[11px] text-muted">Value increase</dt>
                  <dd className={cn('text-[16px] font-semibold tabular-nums', ok ? 'text-[var(--green)]' : 'text-faint')}>{ok ? gain(sc!.gain!) : 'Not eligible'}</dd>
                  {ok && <dd className="text-[11px] text-muted tabular-nums">{money(m.valueNow + sc!.gain!)} after</dd>}
                </div>
                <div className="rounded-lg bg-head px-3 py-2">
                  <dt className="text-[11px] text-muted">Sq ft increase</dt>
                  <dd className="text-[16px] font-semibold text-ink tabular-nums">{key === 'adu' && ok ? `+${aduSqft(m).toLocaleString()}` : ok ? '+0' : '—'}</dd>
                  {ok && <dd className="text-[11px] text-muted">{key === 'adu' ? 'New living space' : 'Same footprint'}</dd>}
                </div>
              </dl>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function Report({ m, compact }: { m: Model; compact: boolean }) {
  const r = m.report
  const best = [...m.scenarios].sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))[0]
  return (
    <div className="flex flex-col gap-5">
      {/* a home that already has a report (generated here, or run on the lead form) just shows it */}
      {(r || !m.reportRun) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--brand-agent-subtle)]/60 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <Sparkles className="size-4 text-[var(--brand-agent)]" />
            {r
              ? `Revive AI report · generated ${new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
              : m.isPreview
                ? 'Quick estimate from public records'
                : 'Based on what Revive has on record'}
          </p>
          {!m.reportRun && (
            <Button size="sm" asChild>
              <AiLink to={aiPath('report', m)}>
                Generate the full report <ArrowRight />
              </AiLink>
            </Button>
          )}
        </div>
      )}

      {m.opp && <LeadActivity o={m.opp} />}

      <TopOptions m={m} />

      {/* what used to be the Overview tab: value, why now, and recent activity follow */}
      <section>
        <h2 className="text-[15px] font-semibold text-ink">Value</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Stat label="Today" value={money(m.valueNow)} sub={`${money(m.valueLo)}–${money(m.valueHi)}`} />
          {best?.gain ? <Stat label="After the best project" value={money(m.valueNow + best.gain)} sub={best.product} /> : null}
          {best?.gain ? <Stat label="Est. upside" value={gain(best.gain)} tone="ok" /> : null}
        </div>
        {m.sources.length > 0 && <p className="mt-2 text-[12px] text-muted">Sources: {m.sources.map((x) => `${x.name} ${money(x.value)}`).join(' · ')}</p>}
      </section>

      {m.opp && m.opp.reasons.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-ink">Why now</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-2">
            {m.opp.reasons.map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-ok" /> {x}
              </li>
            ))}
          </ul>
        </section>
      )}

      {m.opp && m.opp.activity.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-ink">Activity</h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm text-ink-2">
            {m.opp.activity.slice(0, 6).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>
      )}

      {r && (r.selling || r.goal) && (
        <section className="grid gap-2 sm:grid-cols-2">
          {r.selling && <Stat label="Client thinking of selling" value={r.selling} />}
          {r.goal && <Stat label="What matters most" value={r.goal} />}
        </section>
      )}

      {m.photos.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-ink">Photos in this report</h2>
          <div className={cn('mt-2 grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-5')}>
            {m.photos.map((u, i) => (
              <img key={u.slice(-40) + i} src={u} alt="" className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </section>
      )}

      {m.comps.length > 0 && (
        <section>
          <h2 className="text-[15px] font-semibold text-ink">Recent sales nearby</h2>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line text-sm">
            {m.comps.map((c) => (
              <li key={c.address} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span className="text-ink">{c.address}</span>
                <span className="text-muted tabular-nums">
                  {money(c.price)} · ${c.ppsf}/sqft · {c.distMi} mi · {c.monthsAgo} mo ago
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Project({ m }: { m: Model }) {
  if (m.builtIn) {
    const p = m.builtIn
    return (
      <ProjectTimeline
        title={`${p.product} · ${p.stageLabel}`}
        steps={p.timeline}
        next={p.nextFromAgent}
        details={[]}
        docs={p.docs}
      />
    )
  }
  if (m.created) {
    const c = m.created
    return (
      <ProjectTimeline
        title={`${c.product} · submitted ${new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        steps={PROJECT_STEPS.map((label, i) => ({ label, state: i === 0 ? 'done' : i === 1 ? 'current' : 'todo' }))}
        next="Nothing yet. Revive reviews the project and sends offer terms within 48 hours."
        details={[
          ['Timeline', c.timeline],
          ['Occupancy', c.occupancy],
          ...(c.homeowner ? [['Homeowner', c.homeowner] as [string, string]] : []),
        ]}
        docs={['Offer terms (after review)', 'Letter of intent', 'Groundbreaking video guide']}
      />
    )
  }
  return (
    <div className="rounded-xl border border-dashed border-line p-6">
      <h2 className="text-[15px] font-semibold text-ink">No project yet</h2>
      <p className="mt-1 text-sm text-ink-2">Pick the Revive product that fits: Renovate to Sell, Renovate to Stay, Sell 360 or Flip 360. Revive AI walks you through it.</p>
      <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted">
        {['Submit', 'Revive review within 48 hrs', 'Offer terms', 'Letter of intent'].map((s, i) => (
          <li key={s}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <Button size="sm" className="mt-4" asChild>
        <AiLink to={aiPath('project', m)}>
          <Hammer /> Start a project with Revive AI
        </AiLink>
      </Button>
    </div>
  )
}

function ProjectTimeline({ title, steps, next, details, docs }: { title: string; steps: { label: string; state: 'done' | 'current' | 'todo' }[]; next?: string; details: [string, string][]; docs: string[] }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <ol className="flex flex-col">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
            {i < steps.length - 1 && <span className={cn('absolute top-6 left-[11px] h-[calc(100%-16px)] w-0.5', s.state === 'done' ? 'bg-ok' : 'bg-line')} />}
            <span
              className={cn(
                'relative grid size-6 shrink-0 place-items-center rounded-full border-2',
                s.state === 'done' ? 'border-ok bg-ok text-white' : s.state === 'current' ? 'border-[var(--brand-primary)] bg-white' : 'border-line bg-white',
              )}
            >
              {s.state === 'done' ? <Check className="size-3.5" strokeWidth={3} /> : s.state === 'current' ? <span className="size-2 rounded-full bg-[var(--brand-primary)]" /> : null}
            </span>
            <span className={cn('pt-0.5 text-sm', s.state === 'todo' ? 'text-muted' : 'font-medium text-ink')}>
              {s.label}
              {s.state === 'current' && <span className="ml-2 text-[12px] font-normal text-[var(--brand-primary)]">In progress</span>}
            </span>
          </li>
        ))}
      </ol>
      {next && (
        <div className="rounded-lg bg-[var(--brand-primary-subtle)] px-4 py-3 text-sm text-navy">
          <span className="font-semibold">Next from you: </span>
          {next}
        </div>
      )}
      {details.length > 0 && (
        <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-sm">
          {details.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <section>
        <h3 className="text-sm font-semibold text-ink">Documents</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {docs.map((d) => (
            <li key={d} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] text-ink-2">
              <FileText className="size-3.5 text-muted" /> {d}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Marketing({ m }: { m: Model }) {
  const items = m.created || m.builtIn
    ? ['Coming-soon flyer', 'Before/after social post', 'Renovation story email', 'Open house kit']
    : ['Renovation-potential one-pager', 'Report share card', 'Renovision preview']
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((t) => (
        <div key={t} className="flex items-center gap-3 rounded-xl border border-line p-4">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-brand">
            <Megaphone className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{t}</p>
            <p className="text-[12px] text-muted">For {m.address}, branded with your name</p>
          </div>
        </div>
      ))}
    </div>
  )
}
