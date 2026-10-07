import case1 from '@/assets/cases/case-1.jpg'
import case2 from '@/assets/cases/case-2.jpg'
import case3 from '@/assets/cases/case-3.jpg'
import case4 from '@/assets/cases/case-4.jpg'
import case5 from '@/assets/cases/case-5.jpg'
import case6 from '@/assets/cases/case-6.jpg'

// Recent Revive projects near the agent's office, from the Contacts page (PROJECTS). Sample data.
export interface ReviveProject {
  id: string
  block: string
  city: string
  lat: number
  lng: number
  product: string
  status: 'sold' | 'done' | 'progress'
  when: string
  scope: string[]
  weeks: number
  before?: number
  after?: number
  est?: number
  added?: number
  daysOnMarket?: number
  offers?: number
  rent?: number
  photo?: string // illustrative, from the Contacts page photo set
  cover?: string // full-size after photo for case study cards
}

export const reviveProjects: ReviveProject[] = [
  { id: 'p1', cover: case1, photo: 'comp-103-2', block: '1100 block of N Mentor Ave', city: 'Pasadena', lat: 34.16, lng: -118.133, product: 'Renovate to Sell', status: 'sold', when: 'Sold Aug 2026', scope: ['Kitchen', 'Two baths', 'Interior paint', 'Landscaping'], weeks: 8, before: 1310000, after: 1520000, daysOnMarket: 9, offers: 3 },
  { id: 'p2', cover: case2, photo: 'comp-102-2', block: '1400 block of Glenwood Rd', city: 'Glendale', lat: 34.17, lng: -118.262, product: 'Renovate to Stay + ADU', status: 'done', when: 'Finished Jun 2026', scope: ['Garage conversion', '1 bed, 1 bath', '480 sq ft'], weeks: 14, rent: 2650, added: 185000 },
  { id: 'p3', cover: case3, photo: 'comp-106-1', block: '4900 block of Townsend Ave', city: 'Los Angeles', lat: 34.129, lng: -118.205, product: 'Renovate to Sell', status: 'sold', when: 'Sold May 2026', scope: ['Kitchen', 'Bath', 'Flooring', 'Exterior paint'], weeks: 7, before: 985000, after: 1180000, daysOnMarket: 12, offers: 4 },
  { id: 'p4', cover: case4, photo: 'comp-104-0', block: '300 block of W Foothill Blvd', city: 'Monrovia', lat: 34.156, lng: -118.004, product: 'Renovate to Stay', status: 'done', when: 'Finished Jul 2026', scope: ['Kitchen', 'Primary bath'], weeks: 6, added: 95000 },
  { id: 'p5', cover: case5, photo: 'comp-109-2', block: '1800 block of Fremont Ave', city: 'South Pasadena', lat: 34.105, lng: -118.15, product: 'Renovate to Sell', status: 'progress', when: 'Lists in about 3 weeks', scope: ['Kitchen', 'Two baths', 'Windows', 'Landscaping'], weeks: 9, before: 1240000, est: 1400000 },
  { id: 'p6', cover: case6, photo: 'comp-111-1', block: '600 block of N Fairview St', city: 'Burbank', lat: 34.177, lng: -118.329, product: 'Renovate to Sell', status: 'sold', when: 'Sold Apr 2026', scope: ['Kitchen', 'Bath', 'Paint'], weeks: 6, before: 905000, after: 1047000, daysOnMarket: 6, offers: 5 },
]

export function projectGain(p: ReviveProject) {
  if (p.status === 'sold' && p.before && p.after) return p.after - p.before
  if (p.status === 'progress' && p.before && p.est) return p.est - p.before
  return p.added ?? 0
}
