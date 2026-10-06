import type { Tier } from './types'

export const TIER_RANK: Record<Tier, number> = { new: 0, active: 1, partner: 2 }
export const DEALS_TO_PARTNER = 2

export const AGENT = {
  name: 'Michelle Phillips',
  firstName: 'Michelle',
  role: 'Realtor',
  listings: 2,
  contacts: 240,
  office: { label: 'Your office · Lake Ave', lat: 34.1466, lng: -118.132 },
  homeRadiusMiles: 3,
}

export interface TierConfig {
  id: Tier
  label: string
  demoLabel: string
  deals: number
  earned: number
  earnedNote: string
  greeting: (ctx: { opportunities: number; projectName?: string; newReferral: boolean }) => string
}

// Per-tier copy and sample numbers. Everything else on screen derives from data + demo state.
export const TIERS: Record<Tier, TierConfig> = {
  new: {
    id: 'new',
    label: 'New',
    demoLabel: 'New agent · 0 deals',
    deals: 0,
    earned: 0,
    earnedNote: 'Your first deal starts below',
    greeting: () => `We scanned your ${AGENT.listings} listings and ${AGENT.contacts} contacts. Here’s where Revive can help.`,
  },
  active: {
    id: 'active',
    label: 'Active',
    demoLabel: 'Active · 1 deal',
    deals: 1,
    earned: 18400,
    earnedNote: 'from 1 deal',
    greeting: ({ opportunities, projectName }) =>
      `Your ${projectName ?? ''} project is on track, and there are ${opportunities} opportunities to act on in your book.`,
  },
  partner: {
    id: 'partner',
    label: 'Partner',
    demoLabel: 'Partner · 2+ deals',
    deals: 4,
    earned: 61200,
    earnedNote: 'from 4 deals',
    greeting: ({ opportunities, newReferral }) =>
      newReferral
        ? 'You have a new homeowner referral. Claim it before it expires.'
        : `Your referrals are moving, and there are ${opportunities} opportunities to act on in your book.`,
  },
}

export function tierAllows(tier: Tier, minTier: Tier) {
  return TIER_RANK[tier] >= TIER_RANK[minTier]
}
