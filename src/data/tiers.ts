import type { Tier } from './types'

export const TIER_RANK: Record<Tier, number> = { new: 0, active: 1, partner: 2 }
export const DEALS_TO_PARTNER = 2

export const AGENT = {
  name: 'Michelle Phillips',
  firstName: 'Michelle',
  role: 'Realtor',
  crm: 'Follow Up Boss',
  office: { label: 'Pasadena office', lat: 34.1458, lng: -118.137 },
  marketRadiusMiles: 20, // an agent's real market: 15–30 miles from the brokerage
}

export interface TierConfig {
  id: Tier
  label: string
  demoLabel: string
  deals: number
  earned: number
  earnedNote: string
  greeting: (ctx: { opportunities: number; listings: number; contacts: number; projectName?: string; newReferral: boolean }) => string
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
    greeting: ({ listings, contacts }) =>
      listings + contacts === 0
        ? 'Welcome to Revive. Connect your listings and CRM to see who to call, and why.'
        : `We checked ${[listings && `${listings} listings`, contacts && `${contacts} contacts`].filter(Boolean).join(' and ')}. Here’s where Revive can help.`,
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
