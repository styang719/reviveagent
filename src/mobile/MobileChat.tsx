import { FileText, Hammer, Map, Sparkles, SquarePen, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Composer, Thread, useAsk } from '@/components/ai/Chat'
import { ReviveMark } from '@/components/shell/Logo'
import { AGENT } from '@/data/tiers'
import { STARTERS } from '@/lib/ai'
import { rvHome, startHome, startProject, startRenovision, startReport } from '@/lib/flowEngine'
import { useOpportunities, isActionable } from '@/lib/opportunities'
import { useUi } from '@/store/ui'

// Mobile home: Revive AI, full screen. Starters to begin with, a nudge to the map, and the composer above the
// tab bar. Reports and projects open as pages; the Revive AI tab brings you back to the conversation.

const STARTER_CARDS = [
  { icon: FileText, label: 'Generate a Revive AI report', run: () => startReport() },
  { icon: Hammer, label: 'Start a Revive project', run: () => startProject() },
  { icon: Users, label: STARTERS[1] },
  { icon: Sparkles, label: 'Visualize a renovation with RenoVision', run: () => startRenovision() },
]

export default function MobileChat() {
  const chat = useUi((s) => s.chat)
  const clearChat = useUi((s) => s.clearChat)
  const { ask, thinking } = useAsk()
  const opps = useOpportunities()
  const toCall = opps.filter(isActionable).length
  const empty = chat.length === 0
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [chat.length, thinking])

  // arriving with context (/m/ai?q=… or ?flow=report|project|home|renovision), same as the desktop page
  const [params, setParams] = useSearchParams()
  const handled = useRef(false)
  useEffect(() => {
    if (handled.current) return
    const q = params.get('q')
    const flow = params.get('flow')
    if (!q && !flow) return
    handled.current = true
    setParams({}, { replace: true })
    if (useUi.getState().chat.length) clearChat()
    const property = params.get('property') ?? undefined
    const address = params.get('address') ?? undefined
    if (flow === 'renovision') {
      startRenovision()
      if (property) rvHome(property)
    } else if (flow === 'home' && address) startHome(address)
    else if (flow === 'report') startReport({ propertyId: property, address })
    else if (flow === 'project') startProject({ propertyId: property })
    else if (q) ask(q)
  })

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
        <span className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-navy">
            <ReviveMark className="h-[18px] w-auto" />
          </span>
          <span className="text-[17px] font-semibold text-ink">Revive AI</span>
        </span>
        {!empty && (
          <button onClick={clearChat} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-medium text-ink-2" aria-label="New chat">
            <SquarePen className="size-4" /> New
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {empty ? (
          <div className="flex flex-col">
            <span className="rv-ai-tile grid size-14 place-items-center rounded-2xl text-white">
              <Sparkles className="size-7" />
            </span>
            <h1 className="mt-5 text-[26px] leading-8 font-semibold text-ink">Hi {AGENT.firstName}, what can I help with?</h1>
            <p className="mt-2 text-[15px] text-ink-2">Ask about any home or anyone in your book.</p>
            {toCall > 0 && (
              <Link to="/m/map" className="mt-5 flex items-center gap-3 rounded-2xl border border-[var(--brand-primary-border-subtle)] bg-[var(--brand-primary-subtle)] p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand">
                  <Map className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">{toCall} opportunities worth a conversation</span>
                  <span className="block text-[13px] text-ink-2">See them on the map</span>
                </span>
              </Link>
            )}
            <div className="mt-5 flex flex-col gap-2.5">
              {STARTER_CARDS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => (s.run ? s.run() : ask(s.label))}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3.5 text-left text-[15px] text-ink shadow-card active:bg-head"
                >
                  <s.icon className="size-5 shrink-0 text-brand" />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <Thread onAsk={ask} thinking={thinking} compact />
        )}
        <div ref={end} />
      </div>

      <div className="shrink-0 border-t border-line-soft bg-white px-3 pt-2 pb-3">
        <Composer onAsk={ask} disabled={thinking} compact />
      </div>
    </div>
  )
}
