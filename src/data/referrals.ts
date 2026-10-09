import type { Referral } from './types'

// Revive homeowner referrals (seller leads). Partner tier only.
export const referrals: Referral[] = [
  { propertyId: 'harbor', personId: 'linda', expiresInHours: 24, status: 'new', needsUpdate: false, referredDaysAgo: 0 },
  { propertyId: 'laurel', personId: 'tom', expiresInHours: 0, status: 'contacted', needsUpdate: true, referredDaysAgo: 8 },
  { propertyId: 'arden', personId: 'grace', expiresInHours: 0, status: 'claimed', needsUpdate: true, referredDaysAgo: 25 },
  // closed: already reported back to Revive, so they show only on the all-referrals page
  { propertyId: 'hastings', personId: 'ruth', expiresInHours: 0, status: 'listing', needsUpdate: false, referredDaysAgo: 41 },
  { propertyId: 'sierra', personId: 'victor', expiresInHours: 0, status: 'lost', needsUpdate: false, referredDaysAgo: 33 },
]
