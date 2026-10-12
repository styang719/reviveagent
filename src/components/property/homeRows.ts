import type { Opportunity } from '@/lib/opportunities'

// Homes page: the shape of a Revive AI report row, and where a listing stands on the MLS.

export interface ReportRow {
  id: string
  address: string
  city: string
  photo?: string
  valueNow: number
  upside?: number
  product?: string
  when?: string
  designs?: number // RenoVision designs saved on this home
  at?: number // when it was generated, for sorting
  share?: { label: string; tone: 'opened' | 'shared' | 'leadform' | 'none' } // where it is with the homeowner
}

/** Where the listing stands on the MLS. */
export function listingStatus(o: Opportunity) {
  const f = o.property.facts
  if (f.expiredDaysAgo !== undefined) return { label: `Expired ${f.expiredDaysAgo}d ago`, warn: true }
  if (f.withdrawnDaysAgo !== undefined) return { label: 'Withdrawn', warn: true }
  if (f.priceCutDaysAgo !== undefined && f.priceCutDaysAgo <= 14) return { label: f.priceCutDaysAgo === 1 ? 'Price cut yesterday' : `Price cut ${f.priceCutDaysAgo}d ago`, warn: true }
  return { label: 'Active', warn: false }
}

