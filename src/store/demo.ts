import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Stage, Tier } from '@/data/types'

export type MapDesign = 'a' | 'b' | 'c'
export const MAP_DESIGNS: { id: MapDesign; label: string }[] = [
  { id: 'a', label: 'A · Map first' },
  { id: 'b', label: 'B · Split view' },
  { id: 'c', label: 'C · Docked' },
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
  mapDesign: MapDesign // new-agent Home: search + map direction to compare (demo bar)
  setMapDesign: (d: MapDesign) => void
  setTier: (tier: Tier) => void
  setStage: (propertyId: string, stage: Stage, activity?: string) => void
  claimReferral: (propertyId: string) => void
  markReferralUpdated: (propertyId: string) => void
  connectCrm: () => void
  connectLicense: (license: string) => void
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
      mapDesign: 'a',
      setMapDesign: (mapDesign) => set({ mapDesign }),
      reset: () => set((s) => ({ ...initial(), tier: s.tier, mapDesign: s.mapDesign })),
    }),
    { name: 'revive-demo', version: 4, storage: createJSONStorage(() => localStorage), migrate: (s) => ({ ...(s as object), mapDesign: 'a' }) as DemoState },
  ),
)
