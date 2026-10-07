import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Stage, Tier } from '@/data/types'
import type { CreatedProject, GeneratedReport, Handoff } from '@/lib/flows'

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
  reportGenerated: boolean // first Revive AI report (no connection needed)
  license: string | null // DRE license number; finds the agent's MLS listings and past sales
  reports: Record<string, GeneratedReport> // made in Revive AI, keyed by property / report id
  projects: Record<string, CreatedProject> // started in Revive AI, keyed by property / report id
  handoff: Handoff // how Revive AI hands a finished report/project to its page; the docked chat was chosen
  addReport: (r: GeneratedReport) => void
  addProject: (p: CreatedProject) => void
  setHandoff: (h: Handoff) => void
  setTier: (tier: Tier) => void
  setStage: (propertyId: string, stage: Stage, activity?: string) => void
  claimReferral: (propertyId: string) => void
  markReferralUpdated: (propertyId: string) => void
  connectCrm: () => void
  markReportGenerated: () => void
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
  reportGenerated: false,
  license: null as string | null,
  reports: {} as Record<string, GeneratedReport>,
  projects: {} as Record<string, CreatedProject>,
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
      markReportGenerated: () => set({ reportGenerated: true }),
      addReport: (r) => set((s) => ({ reports: { ...s.reports, [r.id]: r }, reportGenerated: true })),
      addProject: (p) =>
        set((s) => ({
          projects: { ...s.projects, [p.propertyId]: p },
          stageOverrides: { ...s.stageOverrides, [p.propertyId]: 'project' },
          activity: withActivity(s, p.propertyId, `You submitted a ${p.product} project`),
        })),
      handoff: 'dock',
      setHandoff: (handoff) => set({ handoff }),
      connectLicense: (license) => set({ license }),
      reset: () => set((s) => ({ ...initial(), tier: s.tier, handoff: s.handoff })),
    }),
    { name: 'revive-demo', version: 9, storage: createJSONStorage(() => localStorage), migrate: (s) => ({ reports: {}, projects: {}, ...(s as object), handoff: 'dock' }) as DemoState },
  ),
)
