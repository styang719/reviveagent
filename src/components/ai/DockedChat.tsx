import { MapPin, Maximize2, Minus, Sparkles, SquarePen } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDemo } from '@/store/demo'
import { isAbout, useUi } from '@/store/ui'
import { startProject, startReport } from '@/lib/flowEngine'
import { Composer, Thread, useAsk, useHereCtx } from './Chat'

// The conversation follows the agent: when Revive AI opens a result page, the chat docks in the
// corner so they can keep asking ("add a kitchen scenario", "start a project from this") without
// leaving. Every earlier conversation is in the history on the Revive AI page.
export function DockedChat() {
  const handoff = useDemo((s) => s.handoff)
  const hasAnyChat = useUi((s) => s.chat.length > 0)
  const activeHere = useUi((s) => s.activeHere)
  const title = useUi((s) => s.threads.find((t) => t.id === s.activeId)?.title)
  const open = useUi((s) => s.dockOpen)
  const setOpen = useUi((s) => s.setDock)
  const pendingNav = useUi((s) => s.pendingNav)
  const setPendingNav = useUi((s) => s.setPendingNav)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { ask, thinking } = useAsk()
  const here = useHereCtx()
  // on a property page, only a conversation started about this home shows here; anything else waits in
  // the history, and the dock offers a fresh conversation about this property instead
  const hasChat = hasAnyChat && (!here || activeHere === here.id)
  const askHere = (q: string) => {
    if (here && !hasChat && hasAnyChat) {
      useUi.getState().clearChat()
      setOpen(true)
    }
    ask(q)
  }
  // arriving on a home's page: pick up the last conversation about it, once per visit
  const resumed = useRef<string | null>(null)
  const hereId = here?.id
  const hereLabel = here?.label
  useEffect(() => {
    if (!hereId || !hereLabel || resumed.current === hereId) return
    resumed.current = hereId
    const ui = useUi.getState()
    if (ui.activeHere === hereId && ui.chat.length) return
    const last = ui.threads.filter((t) => isAbout(t, hereId, hereLabel)).sort((a, b) => b.updatedAt - a.updatedAt)[0]
    if (!last) return
    ui.openThread(last.id)
    useUi.setState({ activeHere: hereId })
  }, [hereId, hereLabel])
  useEffect(() => {
    if (!hereId) resumed.current = null
  }, [hereId])

  const aiRequest = useUi((s) => s.aiRequest)
  const clearAiRequest = useUi((s) => s.clearAiRequest)

  // a CTA asked Revive AI to start something: a fresh conversation, right here in the dock
  useEffect(() => {
    if (!aiRequest) return
    clearAiRequest()
    const params = new URLSearchParams(aiRequest.path.split('?')[1] ?? '')
    const ui = useUi.getState()
    if (ui.chat.length) ui.clearChat()
    const flow = params.get('flow')
    const property = params.get('property') ?? undefined
    const address = params.get('address') ?? undefined
    if (flow === 'report') startReport({ propertyId: property, address })
    else if (flow === 'project') startProject({ propertyId: property })
    else if (params.get('q')) ask(params.get('q')!)
    setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiRequest])

  // a finished report/project in version C opens its page; the chat comes along, expanded
  useEffect(() => {
    if (!pendingNav) return
    setPendingNav(null)
    setOpen(true)
    navigate(pendingNav, { state: { fromAi: true } })
  }, [pendingNav, setPendingNav, setOpen, navigate])

  // on a property page the dock is always there, ready to answer about that home
  if (handoff !== 'dock' || (!hasChat && !here) || pathname === '/ai') return null
  const starters = here
    ? [
        `What could ${here.label} sell for after a renovation?`,
        'Is there room for an ADU?',
        'Compare the Revive scenarios',
        here.ctx.person ? `Draft a note to ${here.ctx.person.name.split(' ')[0]} about this home` : 'Draft a note to the homeowner',
        'Start a project on this home',
      ]
    : []

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-white py-2 pr-4 pl-2 text-sm font-medium text-ink shadow-xl ring-1 ring-line hover:ring-[var(--brand-agent-border)]"
      >
        <span className="rv-ai-tile grid size-8 place-items-center rounded-full text-white">
          <Sparkles className="size-4" />
        </span>
        <span className="max-w-64 truncate">{hasChat ? `Revive AI · ${title ?? 'continue the conversation'}` : `Ask Revive about ${here?.label}`}</span>
      </button>
    )

  return (
    <section
      aria-label="Revive AI conversation"
      className="fixed right-4 bottom-4 z-40 flex h-[min(620px,calc(100dvh-120px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line bg-[var(--brand-agent-subtle)]/50 px-4 py-2.5">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
          <span className="rv-ai-tile grid size-6 shrink-0 place-items-center rounded-md text-white">
            <Sparkles className="size-3.5" />
          </span>
          <span className="truncate">{hasChat ? (title ?? 'Revive AI') : `Revive AI · ${here?.label}`}</span>
        </p>
        <div className="flex items-center gap-1">
          {here && hasChat && (
            <button
              onClick={() => {
                useUi.getState().clearChat()
                setOpen(true)
              }}
              className="grid size-8 place-items-center rounded-md text-muted hover:bg-white"
              aria-label={`New conversation about ${here.label}`}
              title="New conversation"
            >
              <SquarePen className="size-4" />
            </button>
          )}
          <Link to="/ai" className="grid size-8 place-items-center rounded-md text-muted hover:bg-white" aria-label="Open in Revive AI, with all your conversations">
            <Maximize2 className="size-4" />
          </Link>
          <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-white" aria-label="Minimize">
            <Minus className="size-4" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {hasChat ? (
          <Thread onAsk={ask} thinking={thinking} compact />
        ) : (
          <div>
            <p className="text-[14px] font-semibold text-ink">Ask anything about {here?.label}</p>
            <p className="mt-1 text-[12.5px] text-ink-2">Its value, the Revive scenarios, ADU room, a note to the owner, or start a project.</p>
            <div className="mt-4 flex flex-col gap-2">
              {starters.map((x) => (
                <button
                  key={x}
                  onClick={() => askHere(x)}
                  className="rounded-xl border border-line bg-white px-3 py-2.5 text-left text-[13px] text-ink-2 hover:border-[var(--brand-agent-border)] hover:text-ink"
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-line p-3">
        {here && (
          <p className="mb-2 flex items-center gap-1.5 px-1 text-[11.5px] text-muted">
            <MapPin className="size-3" /> Asking about {here.label}
          </p>
        )}
        <Composer onAsk={askHere} disabled={thinking} compact />
      </div>
    </section>
  )
}
