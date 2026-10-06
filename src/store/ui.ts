import { create } from 'zustand'

// Transient UI state shared between the setup to-do (right) and the opportunities empty state (left).
type Step = 'license' | 'crm'
interface UiState {
  setupOpen: Step | null // which to-do item is expanded; null = the first one not done
  crmPick: string | null // CRM connect dialog: null closed, '' = choose a CRM, name = connect that CRM
  openStep: (s: Step | null) => void
  openCrm: (pick: string | null) => void
}

export const useUi = create<UiState>((set) => ({
  setupOpen: null,
  crmPick: null,
  openStep: (setupOpen) => set({ setupOpen }),
  openCrm: (crmPick) => set({ crmPick }),
}))
