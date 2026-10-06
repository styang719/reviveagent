import { create } from 'zustand'

// Transient UI state shared between the setup to-do (right) and the opportunities empty state (left).
type Step = 'license' | 'crm'
interface UiState {
  setupOpen: Step | null // which to-do item is expanded; null = the first one not done
  crmPick: string | null // CRM connect dialog: null closed, '' = choose a CRM, name = connect that CRM
  openStep: (s: Step | null) => void
  openCrm: (pick: string | null) => void
  paletteOpen: boolean // the ⌘K search palette (the top search bar is gone)
  paletteMode: 'search' | 'ai' // 'ai' when opened from the Revive AI nav item
  setPalette: (open: boolean, mode?: 'search' | 'ai') => void
}

export const useUi = create<UiState>((set) => ({
  setupOpen: null,
  crmPick: null,
  openStep: (setupOpen) => set({ setupOpen }),
  openCrm: (crmPick) => set({ crmPick }),
  paletteOpen: false,
  paletteMode: 'search',
  setPalette: (paletteOpen, paletteMode = 'search') => set({ paletteOpen, paletteMode }),
}))
