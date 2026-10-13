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
  ranBy?: { name: string; initials: string; you: boolean } // who ran the report: the agent, or a homeowner on the lead form
  noPhotos?: boolean // no photos: Revive can't judge condition, so no current value (and no upside), only potential
  potential?: number // value after the best project
  grade?: 'A' | 'B' | 'C' | 'D' // how much Revive could do for it
}

export const initialsOf = (name: string) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
export const gradeOf = (now: number, upside?: number): 'A' | 'B' | 'C' | 'D' => {
  const pct = upside && now ? upside / now : 0
  return pct >= 0.12 ? 'A' : pct >= 0.07 ? 'B' : pct >= 0.03 ? 'C' : 'D'
}

/** Where the listing stands on the MLS. */
export function listingStatus(o: Opportunity) {
  const f = o.property.facts
  if (f.expiredDaysAgo !== undefined) return { label: `Expired ${f.expiredDaysAgo}d ago`, warn: true }
  if (f.withdrawnDaysAgo !== undefined) return { label: 'Withdrawn', warn: true }
  if (f.priceCutDaysAgo !== undefined && f.priceCutDaysAgo <= 14) return { label: f.priceCutDaysAgo === 1 ? 'Price cut yesterday' : `Price cut ${f.priceCutDaysAgo}d ago`, warn: true }
  return { label: 'Active', warn: false }
}

