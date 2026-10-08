import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Stage, Tier } from '@/data/types'
import type { CreatedProject, GeneratedReport, Handoff } from '@/lib/flows'

// Demo state. Tier and the overrides below are the only state; every screen derives from data + this store.
/** Something that happened to a home the agent works on. Recorded once; Home and Inbox only announce it. */
export interface NewsItem {
  id: string
  propertyId: string
  address: string
  text: string
  kind: 'report' | 'shared' | 'opened' | 'project'
  at: number
}

export const DEMO_LICENSE = '02134589'

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
  news: NewsItem[] // what changed, newest first: reports, shares, opens, project updates (Home shows it)
  shareReport: (propertyId: string, address: string, to?: string) => void
  handoff: Handoff // how Revive AI hands a finished report/project to its page; the docked chat was chosen
  addReport: (r: GeneratedReport) => void
  addProject: (p: CreatedProject) => void
  setHandoff: (h: Handoff) => void
  setTier: (tier: Tier) => void
  /** demo bar: a new agent with nothing connected, or with both MLS (license) and CRM connected */
  setNewAgent: (connected: boolean) => void
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
  news: [] as NewsItem[],
})

const news = (propertyId: string, address: string, kind: NewsItem['kind'], text: string): NewsItem => ({
  id: `${kind}-${propertyId}-${Date.now()}`,
  propertyId,
  address,
  kind,
  text,
  at: Date.now(),
})

const today = () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const withActivity = (s: DemoState, id: string, line?: string) =>
  line ? { ...s.activity, [id]: [`${line} · ${today()}`, ...(s.activity[id] ?? [])] } : s.activity

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      ...initial(),
      setTier: (tier) => set({ tier }),
      setNewAgent: (connected) => set({ tier: 'new', license: connected ? DEMO_LICENSE : null, crmConnected: connected }),
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
      addReport: (r) =>
        set((s) => ({
          reports: { ...s.reports, [r.id]: r },
          reportGenerated: true,
          activity: withActivity(s, r.id, 'You generated a Revive AI report'),
          news: [news(r.id, r.address, 'report', 'Revive AI report ready'), ...s.news],
        })),
      addProject: (p) => {
        set((s) => ({
          projects: { ...s.projects, [p.propertyId]: p },
          stageOverrides: { ...s.stageOverrides, [p.propertyId]: 'project' },
          activity: withActivity(s, p.propertyId, `You submitted a ${p.product} project`),
          news: [news(p.propertyId, p.address, 'project', `${p.product} project submitted`), ...s.news],
        }))
        // the demo moves the project along a little later, so there's something new to see
        setTimeout(() => {
          set((s) =>
            s.projects[p.propertyId]
              ? {
                  activity: withActivity(s, p.propertyId, 'Revive started reviewing your project'),
                  news: [news(p.propertyId, p.address, 'project', 'Revive started reviewing the project · terms within 48 hrs'), ...s.news],
                }
              : {},
          )
        }, 12000)
      },
      news: [],
      shareReport: (id, address, to) => {
        const who = to ?? 'the homeowner'
        set((s) => ({
          stageOverrides: s.stageOverrides[id] === 'project' ? s.stageOverrides : { ...s.stageOverrides, [id]: 'shared' },
          activity: withActivity(s, id, `You shared the Revive AI report with ${who}`),
          news: [news(id, address, 'shared', `Report shared with ${who}`), ...s.news],
        }))
        // homeowners tend to open it soon; the demo shows that a few seconds later
        setTimeout(() => {
          const name = to ? to.split(' ')[0] : 'The homeowner'
          set((s) => ({
            activity: withActivity(s, id, `${name} opened the report`),
            news: [news(id, address, 'opened', `${name} opened the report`), ...s.news],
          }))
        }, 8000)
      },
      handoff: 'dock',
      setHandoff: (handoff) => set({ handoff }),
      connectLicense: (license) => set({ license }),
      reset: () => set((s) => ({ ...initial(), tier: s.tier, handoff: s.handoff })),
    }),
    { name: 'revive-demo', version: 10, storage: createJSONStorage(() => localStorage), migrate: (s) => ({ reports: {}, projects: {}, news: [], ...(s as object), handoff: 'dock' }) as unknown as DemoState },
  ),
)
