import { create } from 'zustand'
import type { Lookup } from '@/lib/lookup'

// Transient UI state shared between the setup to-do (right) and the opportunities empty state (left).
type Step = 'license' | 'crm'
interface UiState {
  setupOpen: Step | null // which to-do item is expanded; null = the first one not done
  crmPick: string | null // CRM connect dialog: null closed, '' = choose a CRM, name = connect that CRM
  openStep: (s: Step | null) => void
  openCrm: (pick: string | null) => void
  lookup: Lookup | null // the home being previewed on the Home map
  setLookup: (l: Lookup | null) => void
}

export const useUi = create<UiState>((set) => ({
  setupOpen: null,
  crmPick: null,
  openStep: (setupOpen) => set({ setupOpen }),
  openCrm: (crmPick) => set({ crmPick }),
  lookup: null,
  setLookup: (lookup) => set({ lookup }),
}))
