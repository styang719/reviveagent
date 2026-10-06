import { create } from 'zustand'
import type { ChatMessage } from '@/lib/ai'

// Transient UI state shared between the setup to-do (right) and the opportunities empty state (left).
type Step = 'license' | 'crm'
interface UiState {
  setupOpen: Step | null // which to-do item is expanded; null = the first one not done
  crmPick: string | null // CRM connect dialog: null closed, '' = choose a CRM, name = connect that CRM
  openStep: (s: Step | null) => void
  openCrm: (pick: string | null) => void
  chat: ChatMessage[] // the Revive AI conversation (kept while navigating)
  addChat: (m: ChatMessage) => void
  clearChat: () => void
}

export const useUi = create<UiState>((set) => ({
  setupOpen: null,
  crmPick: null,
  openStep: (setupOpen) => set({ setupOpen }),
  openCrm: (crmPick) => set({ crmPick }),
  chat: [],
  addChat: (m) => set((s) => ({ chat: [...s.chat, m] })),
  clearChat: () => set({ chat: [] }),
}))
