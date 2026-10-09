import { MapPin, Search, SquarePen } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { AiAvatar } from '@/components/ai/Chat'
import { ago, groupThreads, shortTitle, threadIcon } from '@/components/ai/threads'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'

// The chat drawer: slides out from the left (the app moves aside, like Muse). Earlier conversations grouped by
// the home they're about, as on desktop; search and a new chat at the bottom.

export const useChatDrawer = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}))

export function ChatDrawer() {
  const open = useChatDrawer((s) => s.open)
  const setOpen = useChatDrawer((s) => s.setOpen)
  const threads = useUi((s) => s.threads)
  const activeId = useUi((s) => s.activeId)
  const chat = useUi((s) => s.chat)
  const openThread = useUi((s) => s.openThread)
  const clearChat = useUi((s) => s.clearChat)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [q, setQ] = useState('')

  const needle = q.trim().toLowerCase()
  const shown = needle ? threads.filter((t) => t.title.toLowerCase().includes(needle) || t.chat.some((m) => m.text?.toLowerCase().includes(needle))) : threads
  const groups = groupThreads(shown)
  const toChat = () => {
    setOpen(false)
    if (!/^\/m(\/ai)?\/?$/.test(pathname)) navigate('/m')
  }

  return (
    <aside
      aria-label="Revive AI conversations"
      aria-hidden={!open}
      inert={!open}
      className={cn('absolute inset-y-0 left-0 flex w-[84%] flex-col bg-white pt-[env(safe-area-inset-top)] transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')}
    >
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <AiAvatar className="size-9" />
        <h2 className="text-[28px] leading-none font-semibold text-ink">Revive AI</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pt-2 pb-2 text-[13px] font-medium tracking-wide text-faint uppercase">Chats</p>
        {groups.length === 0 ? (
          <p className="px-3 text-[15px] text-muted">{needle ? 'No chats match.' : 'Your conversations will appear here.'}</p>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((g) => (
              <section key={g.key} aria-label={g.label ?? 'Other conversations'}>
                {(g.label || groups.length > 1) && (
                  <p className="flex items-center gap-1.5 px-3 pb-1 text-[13px] font-medium text-muted">
                    {g.label && <MapPin className="size-3.5 shrink-0" />}
                    <span className="truncate">{g.label ?? 'Other conversations'}</span>
                  </p>
                )}
                <ul className="flex flex-col">
                  {g.threads.map((t) => {
                    const Icon = threadIcon(t)
                    const active = t.id === activeId && chat.length > 0
                    return (
                      <li key={t.id}>
                        <button
                          onClick={() => {
                            openThread(t.id)
                            toChat()
                          }}
                          aria-current={active ? 'true' : undefined}
                          className={cn('flex w-full items-center gap-3.5 rounded-full px-3 py-2.5 text-left', active ? 'bg-[#f0f1f4]' : 'active:bg-[#f5f6f8]')}
                        >
                          <Icon className="size-[22px] shrink-0 text-ink" strokeWidth={1.75} />
                          <span className="min-w-0 flex-1 truncate text-[17px] text-ink">{shortTitle(t, g.label)}</span>
                          <span className="shrink-0 text-[12px] text-faint">{ago(t.updatedAt)}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* search, and a new chat */}
      <div className="flex items-center gap-3 px-4 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <label className="flex h-[52px] min-w-0 flex-1 items-center gap-2 rounded-full bg-[#f3f4f6] px-4">
          <Search className="size-[18px] shrink-0 text-faint" />
          <span className="sr-only">Search chats</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[17px] text-ink outline-none placeholder:text-faint" />
        </label>
        <button
          onClick={() => {
            if (chat.length) clearChat()
            toChat()
          }}
          aria-label="New chat"
          className="grid size-[52px] shrink-0 place-items-center rounded-full bg-white text-ink shadow-[0_4px_18px_rgba(28,46,88,0.12)] ring-1 ring-black/[0.04]"
        >
          <SquarePen className="size-[22px]" strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  )
}
