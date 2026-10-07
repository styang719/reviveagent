import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ChatMessage } from '@/lib/ai'
import type { FlowKind, ProjectDraft, ReportDraft } from '@/lib/flows'

// UI state shared across screens. The Revive AI conversation and its guided flow are kept for
// the browser session so the chat survives moving to a property page and back.
type Step = 'license' | 'crm'

export interface FlowState {
  kind: FlowKind
  awaiting?: 'address' // the composer's next message is an address
  report?: ReportDraft
  project?: ProjectDraft
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
  clearChat: () => void
  flow: FlowState | null // the guided flow in progress, if any
  setFlow: (f: FlowState | null) => void
  panel: { kind: 'report' | 'project'; id: string } | null // B: result open beside the chat
  setPanel: (p: UiState['panel']) => void
  pendingNav: string | null // C: page to open once the result is ready
  setPendingNav: (to: string | null) => void
  dockOpen: boolean // C: the chat docked on other pages is expanded
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
      addChat: (m) => set((s) => ({ chat: [...s.chat, m] })),
      patchChat: (id, patch) => set((s) => ({ chat: s.chat.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      clearChat: () => set({ chat: [], flow: null, panel: null, pendingNav: null, dockOpen: false }),
      flow: null,
      setFlow: (flow) => set({ flow }),
      panel: null,
      setPanel: (panel) => set({ panel }),
      pendingNav: null,
      setPendingNav: (pendingNav) => set({ pendingNav }),
      dockOpen: false,
      setDock: (dockOpen) => set({ dockOpen }),
    }),
    {
      name: 'revive-ui',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ chat: s.chat, flow: s.flow, panel: s.panel, dockOpen: s.dockOpen }),
    },
  ),
)
