import { ExternalLink, FileText, Hammer, RotateCcw, Sparkles, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AiAvatar, Composer, Thread, useAsk } from '@/components/ai/Chat'
import { PropertyView, usePropertyModel, type PropertyTab } from '@/components/property/PropertyView'
import { Button } from '@/components/ui/button'
import { STARTERS } from '@/lib/ai'
import { startProject, startReport } from '@/lib/flowEngine'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'

// Revive AI as its own page. Free questions get answers; "Generate a report" and "Start a project"
// are guided conversations. Where the finished result opens depends on the hand-off version:
// A link to the property page, B a side panel next to the chat, C the page with the chat docked.

const STARTER_CARDS = [
  { icon: FileText, label: 'Generate a Revive AI report', run: () => startReport() },
  { icon: Hammer, label: 'Start a Revive project', run: () => startProject() },
  { icon: Users, label: STARTERS[1] },
  { icon: Sparkles, label: STARTERS[2] },
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

export default function ReviveAI() {
  const chat = useUi((s) => s.chat)
  const clearChat = useUi((s) => s.clearChat)
  const panel = useUi((s) => s.panel)
  const handoff = useDemo((s) => s.handoff)
  const { ask, thinking } = useAsk()
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
    const property = params.get('property') ?? undefined
    const address = params.get('address') ?? undefined
    if (flow === 'report') startReport({ propertyId: property, address })
    else if (flow === 'project') startProject({ propertyId: property })
    else if (q) ask(q)
  })

  return (
    <div className={cn('grid h-[calc(100dvh-var(--demo-h,0px)-65px)] lg:h-[calc(100dvh-var(--demo-h,0px))]', split ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]' : 'grid-cols-1')}>
      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-10 sm:pt-8">
          <h1 className="flex items-center gap-2.5 text-xl font-semibold text-ink">
            <AiAvatar /> Revive AI
          </h1>
          {!empty && (
            <Button variant="outline" size="sm" onClick={clearChat}>
              <RotateCcw /> New chat
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
