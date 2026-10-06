import type { Referral } from './types'

// Revive homeowner referrals (seller leads). Partner tier only.
export const referrals: Referral[] = [
  { propertyId: 'harbor', personId: 'linda', expiresInHours: 24, status: 'new', needsUpdate: false },
  { propertyId: 'laurel', personId: 'tom', expiresInHours: 0, status: 'contacted', needsUpdate: true },
  { propertyId: 'arden', personId: 'grace', expiresInHours: 0, status: 'claimed', needsUpdate: true },
]
