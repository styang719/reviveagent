import { Maximize2, Minus, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import { Composer, Thread, useAsk } from './Chat'

// C · the conversation follows the agent: when Revive AI opens a result page, the chat docks in the
// corner so she can keep asking ("add a kitchen scenario", "start a project from this") without leaving.
export function DockedChat() {
  const handoff = useDemo((s) => s.handoff)
  const hasChat = useUi((s) => s.chat.length > 0)
  const open = useUi((s) => s.dockOpen)
  const setOpen = useUi((s) => s.setDock)
  const pendingNav = useUi((s) => s.pendingNav)
  const setPendingNav = useUi((s) => s.setPendingNav)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { ask, thinking } = useAsk()

  // a finished report/project in version C opens its page; the chat comes along, expanded
  useEffect(() => {
    if (!pendingNav) return
    setPendingNav(null)
    setOpen(true)
    navigate(pendingNav, { state: { fromAi: true } })
  }, [pendingNav, setPendingNav, setOpen, navigate])

  if (handoff !== 'dock' || !hasChat || pathname === '/ai') return null

  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-white py-2 pr-4 pl-2 text-sm font-medium text-ink shadow-xl ring-1 ring-line hover:ring-[var(--brand-agent-border)]"
      >
        <span className="rv-ai-tile grid size-8 place-items-center rounded-full text-white">
          <Sparkles className="size-4" />
        </span>
        Revive AI · continue the conversation
      </button>
    )

  return (
    <section
      aria-label="Revive AI conversation"
      className="fixed right-4 bottom-4 z-40 flex h-[min(620px,calc(100dvh-120px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
    >
      <header className="flex items-center justify-between gap-2 border-b border-line bg-[var(--brand-agent-subtle)]/50 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="rv-ai-tile grid size-6 place-items-center rounded-md text-white">
            <Sparkles className="size-3.5" />
          </span>
          Revive AI
        </p>
        <div className="flex items-center gap-1">
          <Link to="/ai" className="grid size-8 place-items-center rounded-md text-muted hover:bg-white" aria-label="Open the full conversation">
            <Maximize2 className="size-4" />
          </Link>
          <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-md text-muted hover:bg-white" aria-label="Minimize">
            <Minus className="size-4" />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <Thread onAsk={ask} thinking={thinking} compact />
      </div>
      <div className="border-t border-line p-3">
        <Composer onAsk={ask} disabled={thinking} compact />
      </div>
    </section>
  )
}
