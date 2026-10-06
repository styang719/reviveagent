import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Stage, Tier } from '@/data/types'

export type EmptyStyle = 'sources' | 'sample' | 'minimal'
export const EMPTY_STYLES: { id: EmptyStyle; label: string }[] = [
  { id: 'sources', label: 'A · Sources' },
  { id: 'sample', label: 'B · Sample' },
  { id: 'minimal', label: 'C · Minimal' },
]

// Demo state. Tier and the overrides below are the only state; every screen derives from data + this store.
interface DemoState {
  tier: Tier
  stageOverrides: Record<string, Stage>
  claimed: Record<string, number> // propertyId -> claimed at (ms)
  updated: Record<string, number> // propertyId -> referral update sent at (ms)
  activity: Record<string, string[]> // extra activity lines per property, newest first
  referralClockStart: number // exclusivity countdowns run from here
  // A new agent starts with nothing connected; Active and Partner agents are always connected.
  crmConnected: boolean
  license: string | null // DRE license number; finds the agent's MLS listings and past sales
  emptyStyle: EmptyStyle // empty-state Home: design directions to compare (demo bar)
  setTier: (tier: Tier) => void
  setStage: (propertyId: string, stage: Stage, activity?: string) => void
  claimReferral: (propertyId: string) => void
  markReferralUpdated: (propertyId: string) => void
  connectCrm: () => void
  connectLicense: (license: string) => void
  setEmptyStyle: (style: EmptyStyle) => void
  reset: () => void
}

const initial = () => ({
  tier: 'new' as Tier,
  stageOverrides: {},
  claimed: {},
  updated: {},
  activity: {},
  referralClockStart: Date.now(),
  crmConnected: false,
  license: null as string | null,
})

const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const withActivity = (s: DemoState, id: string, line?: string) =>
  line ? { ...s.activity, [id]: [`${line} · ${today()}`, ...(s.activity[id] ?? [])] } : s.activity

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      ...initial(),
      setTier: (tier) => set({ tier }),
      setStage: (id, stage, line) =>
        set((s) => ({ stageOverrides: { ...s.stageOverrides, [id]: stage }, activity: withActivity(s, id, line) })),
      claimReferral: (id) =>
        set((s) => ({
          claimed: { ...s.claimed, [id]: Date.now() },
          stageOverrides: { ...s.stageOverrides, [id]: 'interested' },
          activity: withActivity(s, id, 'You claimed this referral'),
        })),
      markReferralUpdated: (id) =>
        set((s) => ({ updated: { ...s.updated, [id]: Date.now() }, activity: withActivity(s, id, 'You sent Revive a status update') })),
      connectCrm: () => set({ crmConnected: true }),
      connectLicense: (license) => set({ license }),
      emptyStyle: 'sources',
      setEmptyStyle: (emptyStyle) => set({ emptyStyle }),
      reset: () => set((s) => ({ ...initial(), tier: s.tier, emptyStyle: s.emptyStyle })),
    }),
    { name: 'revive-demo', version: 2, storage: createJSONStorage(() => localStorage), migrate: (s) => ({ ...(s as object), emptyStyle: 'sources' }) as DemoState },
  ),
)
