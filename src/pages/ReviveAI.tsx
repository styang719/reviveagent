import { ExternalLink, FileText, Hammer, Image as ImageIcon, MapPin, MessageSquare, PanelLeft, Sparkles, SquarePen, Trash2, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AiAvatar, Composer, Thread, useAsk } from '@/components/ai/Chat'
import { PropertyView, usePropertyModel, type PropertyTab } from '@/components/property/PropertyView'
import { Button } from '@/components/ui/button'
import { STARTERS } from '@/lib/ai'
import { rvHome, startProject, startHome, startRenovision, startReport } from '@/lib/flowEngine'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { threadHome, useUi, type ChatThread } from '@/store/ui'

// Revive AI as its own page. Free questions get answers; "Generate a report" and "Start a project"
// are guided conversations. Where the finished result opens depends on the hand-off version:
// A link to the property page, B a side panel next to the chat, C the page with the chat docked.

const STARTER_CARDS = [
  { icon: FileText, label: 'Generate a Revive AI report', run: () => startReport() },
  { icon: Hammer, label: 'Start a Revive project', run: () => startProject() },
  { icon: Users, label: STARTERS[1] },
  { icon: Sparkles, label: 'Visualize a renovation with RenoVision', run: () => startRenovision() },
]

/** B · the finished report or project, open beside the conversation. */
function SidePanel() {
  const panel = useUi((s) => s.panel)
  const setPanel = useUi((s) => s.setPanel)
  const [tab, setTab] = useState<PropertyTab>(panel?.kind ?? 'report')
  useEffect(() => setTab(panel?.kind ?? 'report'), [panel])
  const m = usePropertyModel(panel?.id ?? '')
  if (!panel || !m) return null
  return (
    <aside aria-label="Result" className="flex min-h-0 flex-col border-l border-line bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-3">
        <p className="text-sm font-semibold text-ink">{panel.kind === 'report' ? 'Revive AI report' : 'Project'}</p>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" asChild>
            <Link to={`/property/${panel.id}?tab=${tab}`} state={{ fromAi: true }}>
              Open as a page <ExternalLink />
            </Link>
          </Button>
          <button onClick={() => setPanel(null)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-line-soft" aria-label="Close panel">
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <PropertyView m={m} tab={tab} onTab={setTab} compact />
      </div>
    </aside>
  )
}

function ago(t: number) {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} d ago`
}

/** ChatGPT-style list of conversations: start a new one, or reopen an earlier one. */
/** Conversations grouped by the home they're about (newest home first), then everything else. */
function groupThreads(threads: ChatThread[]) {
  const groups = new Map<string, { key: string; label: string | null; threads: ChatThread[]; at: number }>()
  for (const t of threads) {
    const h = threadHome(t)
    const key = h ? h.label.toLowerCase() : '__other'
    const g = groups.get(key) ?? { key, label: h?.label ?? null, threads: [], at: 0 }
    g.threads.push(t)
    g.at = Math.max(g.at, t.updatedAt)
    groups.set(key, g)
  }
  return [...groups.values()].sort((a, b) => (a.label === null ? 1 : b.label === null ? -1 : b.at - a.at))
}

/** Inside a home's group the address is already said: "Report · 33 S Orange Grove Blvd" → "Report". */
function shortTitle(t: ChatThread, home: string | null) {
  if (!home) return t.title
  const h = home.toLowerCase()
  const rest = t.title
    .split(' · ')
    .filter((part) => !part.toLowerCase().startsWith(h))
    .join(' · ')
  return rest || (t.chat.some((m) => m.blocks?.some((b) => b.kind === 'flow' && b.step === 'home-intent')) ? 'Home search' : 'Conversation')
}

function ThreadRow({ t, label, active, onOpen, onDelete }: { t: ChatThread; label: string; active: boolean; onOpen: () => void; onDelete: () => void }) {
  const steps = t.chat.flatMap((m) => m.blocks ?? []).filter((b) => b.kind === 'flow').map((b) => (b.kind === 'flow' ? b.step : ''))
  const Icon = t.flow?.kind === 'project' || steps.some((x) => x.startsWith('project')) ? Hammer : t.flow?.kind === 'report' || steps.some((x) => x.startsWith('report')) ? FileText : MessageSquare
  return (
    <li className="group relative">
      <button
        onClick={onOpen}
        aria-current={active ? 'true' : undefined}
        className={cn('flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 pr-8 text-left transition-colors', active ? 'bg-[var(--brand-primary-subtle)] text-ink' : 'text-ink-2 hover:bg-line-soft')}
      >
        <Icon className={cn('mt-0.5 size-4 shrink-0', active ? 'text-brand' : 'text-muted')} />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium">{label}</span>
          <span className="block text-[11.5px] text-muted">{ago(t.updatedAt)}</span>
        </span>
      </button>
      <button
        onClick={onDelete}
        className="absolute top-2 right-1.5 grid size-6 place-items-center rounded-md text-muted opacity-0 group-hover:opacity-100 hover:bg-line focus-visible:opacity-100"
        aria-label={`Delete “${t.title}”`}
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  )
}

/** Every RenoVision design, as a folder of thumbnails; each opens the conversation it was made in. */
function RenoVisionFolder({ onOpen }: { onOpen: (threadId: string) => void }) {
  const all = useDemo((s) => s.renovisions)
  const threads = useUi((s) => s.threads)
  const designs = Object.values(all).sort((a, b) => b.createdAt - a.createdAt)
  if (!designs.length) return null
  return (
    <section aria-label="RenoVision designs">
      <p className="flex items-center gap-1.5 px-2 pb-2 text-[13.5px] font-semibold text-ink">
        <ImageIcon className="size-4 text-[var(--brand-agent)]" /> RenoVision
        <span className="ml-auto text-[12px] font-normal text-faint tabular-nums">{designs.length}</span>
      </p>
      <ul className="grid grid-cols-3 gap-1.5 px-1">
        {designs.map((d) => {
          const can = !!d.threadId && threads.some((t) => t.id === d.threadId)
          return (
            <li key={d.id}>
              <button
                type="button"
                disabled={!can}
                onClick={() => can && onOpen(d.threadId!)}
                title={`${d.address ?? 'Photos'} · ${d.style}`}
                className="block w-full overflow-hidden rounded-lg ring-1 ring-line transition hover:ring-[var(--brand-agent-border)] disabled:cursor-default"
              >
                <img src={d.pairs[0].after} alt={`${d.address ?? 'Design'}, ${d.style}`} className="aspect-square w-full object-cover" />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function History({ onPick }: { onPick?: () => void }) {
  const threads = useUi((s) => s.threads)
  const activeId = useUi((s) => s.activeId)
  const chat = useUi((s) => s.chat)
  const openThread = useUi((s) => s.openThread)
  const deleteThread = useUi((s) => s.deleteThread)
  const clearChat = useUi((s) => s.clearChat)
  return (
    <nav aria-label="Revive AI conversations" className="flex h-full min-h-0 flex-col gap-3 p-3">
      <Button
        variant="outline"
        className="justify-start"
        onClick={() => {
          if (chat.length) clearChat()
          onPick?.()
        }}
      >
        <SquarePen /> New chat
      </Button>
      {threads.length === 0 ? (
        <p className="px-2 text-[13px] text-muted">Your conversations will show up here.</p>
      ) : (
        <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-1">
          <RenoVisionFolder onOpen={(tid) => (openThread(tid), onPick?.())} />
          {groupThreads(threads).map((g) => (
            <section key={g.key} aria-label={g.label ?? 'Other conversations'}>
              <p className="flex items-center gap-1.5 px-2 pb-1.5 text-[13.5px] font-semibold text-ink">
                {g.label ? <MapPin className="size-4 text-[var(--brand-agent)]" /> : <MessageSquare className="size-4 text-muted" />}
                <span className="truncate">{g.label ?? 'Other conversations'}</span>
                <span className="ml-auto font-normal text-faint tabular-nums">{g.threads.length}</span>
              </p>
              <ul className="flex flex-col gap-0.5">
                {g.threads.map((t) => (
                  <ThreadRow key={t.id} t={t} label={shortTitle(t, g.label)} active={t.id === activeId} onOpen={() => (openThread(t.id), onPick?.())} onDelete={() => deleteThread(t.id)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </nav>
  )
}

export default function ReviveAI() {
  const chat = useUi((s) => s.chat)
  const clearChat = useUi((s) => s.clearChat)
  const panel = useUi((s) => s.panel)
  const handoff = useDemo((s) => s.handoff)
  const { ask, thinking } = useAsk()
  const [historyOpen, setHistoryOpen] = useState(false)
  const threadCount = useUi((s) => s.threads.length)
  const empty = chat.length === 0
  const split = handoff === 'panel' && !!panel

  // arriving with context: /ai?q=… asks it; /ai?flow=report|project&property=…|address=… starts a flow
  const [params, setParams] = useSearchParams()
  const handled = useRef(false)
  useEffect(() => {
    if (handled.current) return
    const q = params.get('q')
    const flow = params.get('flow')
    if (!q && !flow) return
    handled.current = true
    setParams({}, { replace: true })
    // every CTA that opens Revive AI with context starts its own conversation; the last one stays in history
    if (useUi.getState().chat.length) clearChat()
    const property = params.get('property') ?? undefined
    const address = params.get('address') ?? undefined
    if (flow === 'renovision') {
      startRenovision()
      if (property) rvHome(property)
    }
    else if (flow === 'home' && address) startHome(address)
    else if (flow === 'report') startReport({ propertyId: property, address })
    else if (flow === 'project') startProject({ propertyId: property })
    else if (q) ask(q)
  })

  return (
    <div
      className={cn(
        'relative grid h-[calc(100dvh-var(--demo-h,0px)-65px)] lg:h-[calc(100dvh-var(--demo-h,0px))]',
        split ? 'lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_minmax(0,520px)]' : 'grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]',
      )}
    >
      <aside className="hidden min-h-0 border-r border-line bg-head lg:block">
        <History />
      </aside>
      {/* below lg the history opens as a drawer */}
      {historyOpen && (
        <div className="absolute inset-0 z-30 flex lg:hidden">
          <div className="w-72 max-w-[85%] border-r border-line bg-white shadow-xl">
            <History onPick={() => setHistoryOpen(false)} />
          </div>
          <button className="flex-1 bg-ink/20" aria-label="Close conversations" onClick={() => setHistoryOpen(false)} />
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-10 sm:pt-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setHistoryOpen(true)}
              className="grid size-9 place-items-center rounded-lg text-ink-2 hover:bg-line-soft lg:hidden"
              aria-label={`Conversations (${threadCount})`}
            >
              <PanelLeft className="size-5" />
            </button>
            <h1 className="flex items-center gap-2.5 text-xl font-semibold text-ink">
              <AiAvatar /> Revive AI
            </h1>
          </div>
          {!empty && (
            <Button variant="outline" size="sm" onClick={clearChat} className="lg:hidden">
              <SquarePen /> New chat
            </Button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
            {empty ? (
              <div className="flex flex-col items-center pt-6 text-center sm:pt-14">
                <span className="rv-ai-tile grid size-16 place-items-center rounded-2xl text-white">
                  <Sparkles className="size-8" />
                </span>
                <h2 className="mt-5 text-2xl font-semibold text-balance text-ink sm:text-[28px]">What can I help you with?</h2>
                <p className="mt-2 max-w-md text-[15px] text-ink-2">Generate a report, start a project, or ask about any home or anyone in your book.</p>
                <div className="mt-8 grid w-full gap-3 text-left sm:grid-cols-2">
                  {STARTER_CARDS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => (s.run ? s.run() : ask(s.label))}
                      className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-left text-sm text-ink-2 shadow-card transition-colors hover:border-brand hover:text-ink"
                    >
                      <s.icon className="mt-0.5 size-4 shrink-0 text-brand" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Thread onAsk={ask} thinking={thinking} />
            )}
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-10 sm:pb-8">
          <div className="mx-auto max-w-3xl">
            <Composer onAsk={ask} disabled={thinking} autoFocus />
            <p className="mt-2 text-center text-[12px] text-faint">Prototype: answers come from sample data. Estimates aren’t appraisals.</p>
          </div>
        </div>
      </div>
      {split && <SidePanel />}
    </div>
  )
}
