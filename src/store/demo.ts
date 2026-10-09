import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Stage, Tier } from '@/data/types'
import type { CreatedProject, GeneratedReport, Handoff, RenoVisionDesign } from '@/lib/flows'

// Demo state. Tier and the overrides below are the only state; every screen derives from data + this store.
/** Something that happened to a home the agent works on. Recorded once; Home and Inbox only announce it. */
/** An email the agent sent from a top-opportunity card, and what came back. */
export interface Outreach {
  subject: string
  template: string // listing | listing-seller | adu | renovation
  sentAt: number
  openedAt?: number
  reply?: { at: number; text: string; intent: 'interested' | 'question' | 'not-now' }
  answeredAt?: number // the agent replied to their reply
}

// What the homeowner writes back in the demo, by template. Real replies would be read by Revive AI for intent.
const REPLIES: Record<string, (first: string) => NonNullable<Outreach['reply']>> = {
  listing: (a) => ({ at: 0, intent: 'interested', text: `Thanks ${a}. We were pretty discouraged after it came off the market. What would a relaunch plan look like, and would it cost us anything up front?` }),
  'listing-seller': () => ({ at: 0, intent: 'question', text: 'Interesting. If Revive covers it until closing, how long would the work take? We’d want to be back on the market before the holidays.' }),
  adu: () => ({ at: 0, intent: 'interested', text: 'We’ve actually talked about an ADU for my mom. Yes, please send the numbers for our lot.' }),
  renovation: () => ({ at: 0, intent: 'not-now', text: 'Thanks for thinking of us! We’re not ready to sell yet. Maybe in the spring.' }),
}

export interface NewsItem {
  id: string
  propertyId: string
  address: string
  text: string
  kind: 'report' | 'shared' | 'opened' | 'project' | 'reply'
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
  addReport: (r: GeneratedReport, quiet?: boolean) => void
  addProject: (p: CreatedProject) => void
  setHandoff: (h: Handoff) => void
  setTier: (tier: Tier) => void
  checked: Record<string, number> // Home checklist: opportunities ticked off this week -> when
  toggleChecked: (id: string) => void
  /** an email sent from a template: logged on the home, and its to-do ticked off */
  logMessage: (id: string, line: string) => void
  outreach: Record<string, Outreach>
  /** send a template email; in the demo the homeowner opens it, then replies, a few seconds later */
  sendOutreach: (p: { id: string; address: string; name: string; subject: string; template: string; agent: string }) => void
  answerReply: (id: string, line: string) => void
  renovisions: Record<string, RenoVisionDesign>
  addRenovision: (d: RenoVisionDesign) => void
  attachRenovision: (id: string, propertyId: string, address: string) => void
  addActivity: (id: string, line: string) => void // a logged call or note
  logged: Record<string, { at: number; kind: 'call' | 'note'; text: string }[]> // calls and notes, with times, for the contact timeline
  /** demo bar: a new agent with nothing connected, or with both MLS (license) and CRM connected */
  setNewAgent: (connected: boolean) => void
  setStage: (propertyId: string, stage: Stage, activity?: string) => void
  claimReferral: (propertyId: string) => void
  markReferralUpdated: (propertyId: string) => void
  /** referral page: the agent's written update to Revive (also marks the referral up to date) */
  postReferralUpdate: (propertyId: string, text: string) => void
  connectCrm: () => void
  markReportGenerated: () => void
  connectLicense: (license: string) => void
  reset: () => void
}

const initial = () => ({
  tier: 'new' as Tier,
  stageOverrides: {},
  claimed: {},
  checked: {} as Record<string, number>,
  outreach: {} as Record<string, Outreach>,
  renovisions: {} as Record<string, RenoVisionDesign>,
  logged: {} as DemoState['logged'],
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
      logMessage: (id, line) => set((s) => ({ activity: withActivity(s, id, line), checked: { ...s.checked, [id]: s.checked[id] ?? Date.now() } })),
      sendOutreach: ({ id, address, name, subject, template, agent }) => {
        const first = name.split(' ')[0]
        set((s) => ({
          outreach: { ...s.outreach, [id]: { subject, template, sentAt: Date.now() } },
          activity: withActivity(s, id, `You emailed ${name}: “${subject}”`),
        }))
        const patch = (fn: (o: Outreach) => Partial<Outreach>, item?: NewsItem) =>
          set((s) =>
            s.outreach[id]
              ? { outreach: { ...s.outreach, [id]: { ...s.outreach[id], ...fn(s.outreach[id]) } }, ...(item ? { news: [item, ...s.news] } : {}) }
              : {},
          )
        setTimeout(() => patch(() => ({ openedAt: Date.now() }), news(id, address, 'opened', `${first} opened your email`)), 4000)
        setTimeout(() => {
          const r = (REPLIES[template] ?? REPLIES.renovation)(agent)
          patch(() => ({ reply: { ...r, at: Date.now() } }), news(id, address, 'reply', `${first} replied to your email`))
          set((s) => ({ activity: withActivity(s, id, `${first} replied: “${r.text.slice(0, 60)}…”`) }))
        }, 11000)
      },
      addRenovision: (d) =>
        set((s) => ({
          renovisions: { ...s.renovisions, [d.id]: d },
          ...(d.propertyId ? { activity: withActivity(s, d.propertyId, `You created a RenoVision design · ${d.style}`) } : {}),
        })),
      attachRenovision: (id, propertyId, address) =>
        set((s) =>
          s.renovisions[id]
            ? { renovisions: { ...s.renovisions, [id]: { ...s.renovisions[id], propertyId, address } }, activity: withActivity(s, propertyId, `You added a RenoVision design · ${s.renovisions[id].style}`) }
            : {},
        ),
      addActivity: (id, line) =>
        set((s) => ({
          activity: withActivity(s, id, line),
          logged: { ...s.logged, [id]: [{ at: Date.now(), kind: /^Note: /.test(line) ? 'note' : 'call', text: line.replace(/^Note: /, '') }, ...(s.logged[id] ?? [])] },
        })),
      answerReply: (id, line) =>
        set((s) => ({
          outreach: s.outreach[id] ? { ...s.outreach, [id]: { ...s.outreach[id], answeredAt: Date.now() } } : s.outreach,
          activity: withActivity(s, id, line),
        })),
      toggleChecked: (id) =>
        set((s) => {
          const checked = { ...s.checked }
          if (checked[id]) delete checked[id]
          else checked[id] = Date.now()
          return { checked }
        }),
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
      postReferralUpdate: (id, text) =>
        set((s) => ({ updated: { ...s.updated, [id]: Date.now() }, activity: withActivity(s, id, `You shared an update: “${text}”`) })),
      connectCrm: () => set({ crmConnected: true }),
      markReportGenerated: () => set({ reportGenerated: true }),
      addReport: (r, quiet) =>
        set((s) => quiet ? { reports: { ...s.reports, [r.id]: r } } : ({
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
    { name: 'revive-demo', version: 10, storage: createJSONStorage(() => localStorage), migrate: (s) => ({ reports: {}, projects: {}, news: [], checked: {}, outreach: {}, logged: {}, renovisions: {}, ...(s as object), handoff: 'dock' }) as unknown as DemoState },
  ),
)
