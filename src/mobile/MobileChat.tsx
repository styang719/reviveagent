import { FileText, Hammer, Map, Menu, Plus, Sparkles, SquarePen, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AiAvatar, Composer, Thread, useAsk } from '@/components/ai/Chat'
import { AGENT } from '@/data/tiers'
import { STARTERS } from '@/lib/ai'
import { rvHome, startHome, startProject, startRenovision, startReport } from '@/lib/flowEngine'
import { useOpportunities, isActionable } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useChatDrawer } from './ChatDrawer'
import { useUi } from '@/store/ui'

// Mobile home: Revive AI, full screen. The conversation scrolls under a white fade at the top (Revive in the
// center, the chats drawer and a new chat on either side) and under the glass message bar and tab bar at the bottom.
// Reports and projects open as pages; the Revive AI tab brings you back to the conversation.

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
  const [menu, setMenu] = useState(false)
  const openDrawer = useChatDrawer((s) => s.setOpen)
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

  const circle =
    'pointer-events-auto grid size-12 place-items-center rounded-full border border-white/80 bg-white/80 text-ink shadow-[0_6px_20px_rgba(28,46,88,0.12)] backdrop-blur-xl active:scale-95'
  return (
    <div className="relative h-full">
      <div className="absolute inset-0 overflow-y-auto px-4 pt-[148px] pb-[calc(var(--tab-h)+96px)]">
        {empty ? (
          <div className="flex flex-col">
            <h1 className="text-[26px] leading-8 font-semibold text-ink">Hi {AGENT.firstName}, what can I help with?</h1>
            <p className="mt-2 text-[15px] text-ink-2">Ask about any home or anyone in your book.</p>
            {toCall > 0 && (
              <Link to="/m/map" className="mt-5 flex items-center gap-3 rounded-[22px] bg-[var(--brand-primary-subtle)] p-4">
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
                  className="flex items-center gap-3 rounded-[22px] bg-[#f1f2f5] px-4 py-3.5 text-left text-[15px] text-ink active:bg-line-soft"
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

      {/* top: the conversation fades out under Revive */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[168px] bg-gradient-to-b from-white from-55% via-white/85 to-transparent">
        <div className="flex items-start justify-between px-4 pt-3">
          <button onClick={() => openDrawer(true)} className={circle} aria-label="Chats">
            <Menu className="size-[22px]" strokeWidth={1.75} />
          </button>
          <span className="flex flex-col items-center">
            <AiAvatar className="size-[68px] drop-shadow-[0_8px_14px_rgba(97,70,180,0.25)]" />
            <span className="-mt-2.5 rounded-full border border-white/80 bg-white/85 px-3 py-[3px] text-[13px] font-semibold text-ink shadow-[0_4px_14px_rgba(28,46,88,0.12)] backdrop-blur-xl">
              Revive AI
            </span>
          </span>
          <button onClick={() => chat.length && clearChat()} className={circle} aria-label="New chat">
            <SquarePen className="size-[22px]" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* bottom: the conversation fades out under the message bar and the tab bar */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[calc(var(--tab-h)+60px)] bg-gradient-to-t from-white/50 to-transparent" />
      <div className="absolute inset-x-4 bottom-[calc(var(--tab-h)+10px)] z-20">
        {menu && (
          <>
            <button aria-label="Close" className="fixed inset-0 cursor-default" onClick={() => setMenu(false)} />
            <ul className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-[22px] border border-white/80 bg-white/85 p-1.5 shadow-[0_12px_36px_rgba(28,46,88,0.18)] backdrop-blur-xl">
              {STARTER_CARDS.filter((s) => s.run).map((s) => (
                <li key={s.label}>
                  <button
                    onClick={() => {
                      setMenu(false)
                      s.run!()
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14.5px] text-ink active:bg-[rgba(28,46,88,0.06)]"
                  >
                    <s.icon className="size-[18px] shrink-0 text-brand" />
                    {s.label.replace(' with RenoVision', '')}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <Composer
          onAsk={ask}
          disabled={thinking}
          compact
          pill
          leading={
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-label="Start a report, project or RenoVision"
              aria-expanded={menu}
              className={cn('grid size-10 shrink-0 place-items-center rounded-full text-ink transition-transform', menu && 'rotate-45')}
            >
              <Plus className="size-6" strokeWidth={1.75} />
            </button>
          }
        />
      </div>
    </div>
  )
}
