import { FileText, Hammer, MessageSquare } from 'lucide-react'
import { threadHome, type ChatThread } from '@/store/ui'

// Shared by the desktop Revive AI page and the mobile chat drawer: how past conversations are grouped and named.

export function ago(t: number) {
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} hr ago` : `${Math.round(h / 24)} d ago`
}

/** Conversations grouped by the home they're about (newest home first), then everything else. */
export function groupThreads(threads: ChatThread[]) {
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
export function shortTitle(t: ChatThread, home: string | null) {
  if (!home) return t.title
  const h = home.toLowerCase()
  const rest = t.title
    .split(' · ')
    .filter((part) => !part.toLowerCase().startsWith(h))
    .join(' · ')
  return rest || (t.chat.some((m) => m.blocks?.some((b) => b.kind === 'flow' && b.step === 'home-intent')) ? 'Home search' : 'Conversation')
}

/** Report, project, or a plain conversation. */
export function threadIcon(t: ChatThread) {
  const steps = t.chat.flatMap((m) => m.blocks ?? []).filter((b) => b.kind === 'flow').map((b) => (b.kind === 'flow' ? b.step : ''))
  return t.flow?.kind === 'project' || steps.some((x) => x.startsWith('project')) ? Hammer : t.flow?.kind === 'report' || steps.some((x) => x.startsWith('report')) ? FileText : MessageSquare
}
