import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ChatMessage } from '@/lib/ai'
import type { FlowKind, ProjectDraft, ReportDraft } from '@/lib/flows'

// UI state shared across screens. Revive AI conversations (the active one and the history) and
// the guided flow in progress are kept for the browser session, so a chat survives moving to a
// property page and back, and past chats can be reopened from the Revive AI page.
type Step = 'license' | 'crm'

export interface FlowState {
  kind: FlowKind
  awaiting?: 'address' // the composer's next message is an address
  report?: ReportDraft
  project?: ProjectDraft
}

/** A past or current Revive AI conversation, for the history list. */
export interface ChatThread {
  id: string
  title: string
  updatedAt: number
  chat: ChatMessage[]
  flow: FlowState | null
}

const newId = () => `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

/**
 * A conversation is named after what it's about: "Report · 55 Fair Oaks Ave" for a guided flow
 * once the address is known, otherwise the first thing the agent asked.
 */
function titleOf(chat: ChatMessage[], flow: FlowState | null, prev?: string) {
  const asked = chat.filter((m) => m.role === 'user' && m.text).map((m) => m.text!.trim())
  const first = asked[0] ?? 'New chat'
  const address = flow?.report?.address ?? flow?.project?.address ?? asked[1]
  const kind = /^generate a revive ai report/i.test(first) ? 'Report' : /^start a revive project/i.test(first) ? 'Project' : null
  let title = kind && address ? `${kind} · ${address.split(',')[0]}` : first
  if (kind && !address && prev && prev !== first) title = prev // keep the specific name once it has one
  return title.length > 48 ? `${title.slice(0, 46).trimEnd()}…` : title
}

/** The active conversation, saved into the thread list (or dropped if it's empty). */
function saveActive(s: Pick<UiState, 'threads' | 'activeId' | 'chat' | 'flow'>): ChatThread[] {
  const rest = s.threads.filter((t) => t.id !== s.activeId)
  if (!s.chat.length) return rest
  const prev = s.threads.find((t) => t.id === s.activeId)
  const changed = !prev || prev.chat.length !== s.chat.length
  return [{ id: s.activeId, title: titleOf(s.chat, s.flow, prev?.title), updatedAt: changed ? Date.now() : prev.updatedAt, chat: s.chat, flow: s.flow }, ...rest]
}

interface UiState {
  setupOpen: Step | null // which to-do item is expanded; null = the first one not done
  crmPick: string | null // CRM connect dialog: null closed, '' = choose a CRM, name = connect that CRM
  openStep: (s: Step | null) => void
  openCrm: (pick: string | null) => void
  discussOpen: boolean // the 'Discuss a property' request dialog
  setDiscuss: (open: boolean) => void
  chat: ChatMessage[] // the Revive AI conversation
  addChat: (m: ChatMessage) => void
  patchChat: (id: string, patch: Partial<ChatMessage>) => void
  clearChat: () => void // start a new conversation (the current one stays in history)
  threads: ChatThread[] // conversation history, newest first; includes the active one once it has messages
  activeId: string
  openThread: (id: string) => void
  deleteThread: (id: string) => void
  resetChats: () => void // forget every conversation (demo reset)
  flow: FlowState | null // the guided flow in progress, if any
  setFlow: (f: FlowState | null) => void
  panel: { kind: 'report' | 'project'; id: string } | null // B: result open beside the chat
  setPanel: (p: UiState['panel']) => void
  pendingNav: string | null // C: page to open once the result is ready
  setPendingNav: (to: string | null) => void
  dockOpen: boolean // C: the chat docked on other pages is expanded
  aiRequest: { path: string; n: number } | null // a CTA asked Revive AI to start something (/ai?q=… or ?flow=…); the dock picks it up
  requestAi: (path: string) => void
  clearAiRequest: () => void
  setDock: (open: boolean) => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      setupOpen: null,
      crmPick: null,
      openStep: (setupOpen) => set({ setupOpen }),
      openCrm: (crmPick) => set({ crmPick }),
      discussOpen: false,
      setDiscuss: (discussOpen) => set({ discussOpen }),
      chat: [],
      // every change to the active conversation is mirrored into the history list
      addChat: (m) =>
        set((s) => {
          const chat = [...s.chat, m]
          return { chat, threads: saveActive({ ...s, chat }) }
        }),
      patchChat: (id, patch) =>
        set((s) => {
          const chat = s.chat.map((m) => (m.id === id ? { ...m, ...patch } : m))
          return { chat, threads: saveActive({ ...s, chat }) }
        }),
      clearChat: () =>
        set((s) => ({ threads: saveActive(s), activeId: newId(), chat: [], flow: null, panel: null, pendingNav: null, dockOpen: false })),
      threads: [],
      activeId: newId(),
      openThread: (id) =>
        set((s) => {
          if (id === s.activeId) return {}
          const threads = saveActive(s)
          const t = threads.find((x) => x.id === id)
          if (!t) return {}
          return { threads, activeId: id, chat: t.chat, flow: t.flow, panel: null, pendingNav: null }
        }),
      deleteThread: (id) =>
        set((s) =>
          id === s.activeId
            ? { threads: s.threads.filter((t) => t.id !== id), activeId: newId(), chat: [], flow: null, panel: null, pendingNav: null, dockOpen: false }
            : { threads: s.threads.filter((t) => t.id !== id) },
        ),
      resetChats: () => set({ threads: [], activeId: newId(), chat: [], flow: null, panel: null, pendingNav: null, dockOpen: false }),
      flow: null,
      setFlow: (flow) => set((s) => ({ flow, threads: saveActive({ ...s, flow }) })),
      panel: null,
      setPanel: (panel) => set({ panel }),
      pendingNav: null,
      setPendingNav: (pendingNav) => set({ pendingNav }),
      aiRequest: null,
      requestAi: (path) => set({ aiRequest: { path, n: Date.now() } }),
      clearAiRequest: () => set({ aiRequest: null }),
      dockOpen: false,
      setDock: (dockOpen) => set({ dockOpen }),
    }),
    {
      name: 'revive-ui',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ chat: s.chat, flow: s.flow, panel: s.panel, dockOpen: s.dockOpen, threads: s.threads, activeId: s.activeId }),
    },
  ),
)
