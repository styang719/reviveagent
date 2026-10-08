import { MessageSquareText } from 'lucide-react'
import { useUi } from '@/store/ui'

// Header action: talk a home through with Revive AI. Opens a fresh conversation in the docked chat that
// asks which home, then walks through it like the Home search.
export function DiscussProperty() {
  const requestAi = useUi((s) => s.requestAi)
  return (
    <button
      onClick={() => requestAi('/ai?flow=discuss')}
      className="flex h-11 shrink-0 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2f4a89]"
    >
      <MessageSquareText className="size-4" />
      Discuss a property
    </button>
  )
}
