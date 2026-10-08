import { MessageSquare, Sparkles } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { ago } from '@/lib/format'
import { useUi } from '@/store/ui'

// Every Revive AI conversation about this home, so nothing about it lives only in the chat history.
// Opening one continues it in the docked chat.
export function HomeConversations({ id, address }: { id: string; address: string }) {
  const threads = useUi((s) => s.threads)
  const openThread = useUi((s) => s.openThread)
  const setDock = useUi((s) => s.setDock)
  const now = useNow(30_000)
  const street = address.toLowerCase()
  const mine = threads.filter((t) => t.hereId === id || t.aboutId === id || [t.hereLabel, t.aboutLabel].some((l) => l?.toLowerCase() === street))
  if (!mine.length) return null
  return (
    <section aria-labelledby="home-conversations" className="mt-10">
      <h2 id="home-conversations" className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink">
        <Sparkles className="size-4 text-[var(--brand-agent)]" /> Conversations about this home
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {mine.map((t) => (
          <li key={t.id}>
            <button
              onClick={() => {
                openThread(t.id)
                setDock(true)
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-left shadow-card transition-shadow hover:shadow-md"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]">
                <MessageSquare className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-ink">{t.title}</span>
                <span className="block text-[12.5px] text-muted">
                  {t.chat.length} messages · {ago(t.updatedAt, now)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
