import { useMemo } from 'react'
import { people } from '@/data/people'
import { properties } from '@/data/properties'
import { referrals } from '@/data/referrals'
import { tierAllows } from '@/data/tiers'
import type { Person, Property, Referral, Source, Stage, Tier, Urgency } from '@/data/types'
import { useDemo } from '@/store/demo'
import { firstName } from './format'
import { scoreOpportunity, topGain, type UrgencyResult } from './urgency'

export type Tag = 'ADU room' | 'Renovation' | 'Listing issue' | 'Data check'

export type CtaKind = 'share' | 'propose' | 'followup' | 'claim' | 'activity' | 'project'

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
  tags: Tag[]
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
  if (p.homeType === 'Single family' && p.lot && p.lot - p.sqft >= 6000) tags.push('ADU room')
  if (p.scenarios.some((s) => s.product.startsWith('Renovate') && (s.gain ?? 0) > 0)) tags.push('Renovation')
  if (p.source === 'listings' && ((p.facts.daysOnMarket ?? 0) >= 30 || (p.facts.priceCutDaysAgo ?? 99) <= 7)) tags.push('Listing issue')
  if (score.urgency === 'verify') tags.push('Data check')
  return tags
}

function ctaFor(p: Property, person: Person | undefined, stage: Stage, referral?: ReferralState): Cta {
  const name = person ? firstName(person.name) : 'the owner'
  if (stage === 'project') return { kind: 'project', label: 'Open project' }
  if (referral && !referral.claimedAt && referral.status === 'new') return { kind: 'claim', label: 'Claim lead' }
  if (stage === 'shared') return { kind: 'activity', label: 'See activity' }
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
}

export function buildOpportunities(s: BuildState): Opportunity[] {
  return properties
    .filter((p) => tierAllows(s.tier, p.minTier))
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
        tags: tagsFor(p, score),
        cta: ctaFor(p, person, stage, referral),
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
  return useMemo(
    () => buildOpportunities({ tier, stageOverrides, claimed, updated, activity, referralClockStart }),
    [tier, stageOverrides, claimed, updated, activity, referralClockStart],
  )
}

/** Opportunities worth acting on: "Call this week" and "Reach out this month". */
export const isActionable = (o: Opportunity) => o.urgency === 'now' || o.urgency === 'soon'
