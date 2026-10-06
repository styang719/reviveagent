import { useMemo } from 'react'
import { people } from '@/data/people'
import { properties } from '@/data/properties'
import { referrals } from '@/data/referrals'
import { tierAllows } from '@/data/tiers'
import type { Person, Property, Referral, Source, Stage, Tier, Urgency } from '@/data/types'
import { useDemo } from '@/store/demo'
import { photoUrl } from './assets'
import { firstName } from './format'
import { scoreOpportunity, topGain, type UrgencyResult } from './urgency'

export type Tag = 'ADU room' | 'Renovation' | 'Listing issue' | 'Data check'

export type CtaKind = 'share' | 'propose' | 'followup' | 'claim' | 'activity' | 'project' | 'verify'

export interface Cta {
  kind: CtaKind
  label: string
}

export interface ReferralState extends Referral {
  claimedAt?: number
  expiresAt: number // ms timestamp
  needsUpdateNow: boolean
}

export interface Opportunity {
  id: string
  property: Property
  person?: Person
  referral?: ReferralState
  stage: Stage
  score: UrgencyResult
  urgency: Urgency
  gain: number
  product?: string
  photo?: string
  tags: Tag[]
  reasons: string[] // top reason first, then up to two more
  cta: Cta
  activity: string[]
}

export const SOURCE_LABEL: Record<Source, string> = {
  listings: 'My listing',
  contacts: 'My contact',
  leadform: 'Lead form',
  revive: 'Revive lead',
  search: 'Report I ran',
}

export const STAGE_LABEL: Record<Stage, string> = {
  spotted: 'Spotted',
  shared: 'Report shared',
  interested: 'Interested',
  project: 'Project',
}

export const personById = (id?: string) => people.find((p) => p.id === id)
export const propertyById = (id?: string) => properties.find((p) => p.id === id)

/** Hook for a future CRM sync: a logged call or email could move a stage. Not connected yet. */
export function stageFromCrmActivity(_property: Property, _person?: Person): Stage | null {
  return null
}

function tagsFor(p: Property, score: UrgencyResult): Tag[] {
  const tags: Tag[] = []
  // a condo or multi-family parcel can't take one however big the lot is
  if (p.homeType === 'Single family' && p.lot && p.lot - p.sqft >= 6000) tags.push('ADU room')
  if (p.scenarios.some((s) => s.product.startsWith('Renovate') && (s.gain ?? 0) > 0)) tags.push('Renovation')
  const f = p.facts
  if ((p.source === 'listings' && ((f.daysOnMarket ?? 0) >= 30 || (f.priceCutDaysAgo ?? 99) <= 7)) || f.expiredDaysAgo !== undefined || f.withdrawnDaysAgo !== undefined)
    tags.push('Listing issue')
  if (score.urgency === 'verify') tags.push('Data check')
  return tags
}

// CRM contacts explain themselves with the trigger wording (as on the Contacts page);
// listings, leads and referrals carry hand-written signals.
function reasonsFor(p: Property, score: UrgencyResult): string[] {
  if (score.note && (score.urgency === 'hold' || score.urgency === 'verify')) return [score.note.split('. ')[0], ...p.signals].slice(0, 3)
  if (p.source !== 'contacts' || score.triggers.length === 0) return p.signals.slice(0, 3)
  const out = score.triggers.map((t) => t.label)
  for (const s of p.signals) if (out.length < 3 && !out.some((o) => o.toLowerCase().includes(s.toLowerCase().slice(0, 12)))) out.push(s)
  return out.slice(0, 3)
}

function ctaFor(p: Property, person: Person | undefined, stage: Stage, score: UrgencyResult, referral?: ReferralState): Cta {
  const name = person ? firstName(person.name) : 'the owner'
  if (stage === 'project') return { kind: 'project', label: 'Open project' }
  if (referral && !referral.claimedAt && referral.status === 'new') return { kind: 'claim', label: 'Claim lead' }
  if (stage === 'shared') return { kind: 'activity', label: 'See activity' }
  if (score.urgency === 'hold') return { kind: 'activity', label: `See ${name}’s history` }
  if (score.urgency === 'verify') return { kind: 'verify', label: 'Check the value' }
  if (p.source === 'listings') return { kind: 'propose', label: 'Propose Revive to seller' }
  if (p.source === 'leadform' || p.source === 'revive') return { kind: 'followup', label: `Follow up with ${name}` }
  return { kind: 'share', label: person ? `Share report with ${name}` : 'Share report' }
}

interface BuildState {
  tier: Tier
  stageOverrides: Record<string, Stage>
  claimed: Record<string, number>
  updated: Record<string, number>
  activity: Record<string, string[]>
  referralClockStart: number
  crm: boolean
  mls: boolean
}

/** Which connection a source needs before Revive can see it. */
export function sourceConnected(source: Source, c: { crm: boolean; mls: boolean }) {
  if (source === 'listings') return c.mls
  if (source === 'contacts' || source === 'leadform') return c.crm
  return true
}

export function buildOpportunities(s: BuildState): Opportunity[] {
  return properties
    .filter((p) => tierAllows(s.tier, p.minTier) && sourceConnected(p.source, s))
    .map((p) => {
      const person = personById(p.ownerId)
      const ref = referrals.find((r) => r.propertyId === p.id)
      let referral: ReferralState | undefined
      if (ref) {
        const claimedAt = s.claimed[p.id]
        const status = claimedAt && ref.status === 'new' ? 'claimed' : ref.status
        const needsUpdateNow = (ref.needsUpdate || !!claimedAt) && !s.updated[p.id]
        referral = { ...ref, status, claimedAt, needsUpdateNow, expiresAt: s.referralClockStart + ref.expiresInHours * 3600_000 }
      }
      const stage = s.stageOverrides[p.id] ?? stageFromCrmActivity(p, person) ?? p.stage
      const unclaimedReferral = referral?.status === 'new' && !referral.claimedAt
      const score = scoreOpportunity(p, person, { unclaimedReferral })
      const best = [...p.scenarios].sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))[0]
      return {
        id: p.id,
        property: p,
        person,
        referral,
        stage,
        score,
        urgency: score.urgency,
        gain: topGain(p),
        product: best?.gain ? best.product : undefined,
        photo: photoUrl(p.photo),
        tags: tagsFor(p, score),
        reasons: reasonsFor(p, score),
        cta: ctaFor(p, person, stage, score, referral),
        activity: [...(s.activity[p.id] ?? []), ...[...p.activity].reverse()],
      }
    })
    .sort((a, b) => b.score.score - a.score.score)
}

export function useOpportunities() {
  const tier = useDemo((s) => s.tier)
  const stageOverrides = useDemo((s) => s.stageOverrides)
  const claimed = useDemo((s) => s.claimed)
  const updated = useDemo((s) => s.updated)
  const activity = useDemo((s) => s.activity)
  const referralClockStart = useDemo((s) => s.referralClockStart)
  const { crm, mls } = useConnections()
  return useMemo(
    () => buildOpportunities({ tier, stageOverrides, claimed, updated, activity, referralClockStart, crm, mls }),
    [tier, stageOverrides, claimed, updated, activity, referralClockStart, crm, mls],
  )
}

/** What the agent has connected. Active and Partner agents are past onboarding. */
export function useConnections() {
  const tier = useDemo((s) => s.tier)
  const crmConnected = useDemo((s) => s.crmConnected)
  const license = useDemo((s) => s.license)
  return { crm: tier !== 'new' || crmConnected, mls: tier !== 'new' || !!license, license }
}

/** Opportunities worth acting on: "Call this week" and "Reach out this month". */
export const isActionable = (o: Opportunity) => o.urgency === 'now' || o.urgency === 'soon'
