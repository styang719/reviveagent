export type Tier = 'new' | 'active' | 'partner' // 0, 1, 2+ deals
export type Source = 'listings' | 'contacts' | 'leadform' | 'revive' | 'search'
export type Stage = 'spotted' | 'shared' | 'interested' | 'project'
export type Urgency = 'now' | 'soon' | 'keep' | 'verify' | 'hold'
export type Product = 'Renovate to Sell' | 'Renovate to Stay' | 'Sell 360' | 'Flip 360'

/** Raw facts the urgency engine reads. Every field is optional; missing means "not known / not applicable". */
export interface Facts {
  yearsOwned?: number
  daysOnMarket?: number // own listing
  priceCutDaysAgo?: number // own listing
  expiredDaysAgo?: number
  withdrawnDaysAgo?: number
  repliedUnansweredDays?: number // they replied and the agent hasn't
  reportOpenedDaysAgo?: number // homeowner opened a shared report
  leadFormDaysAgo?: number // homeowner ran a report through the agent's lead form
  otherBrokerage?: boolean // listed / under contract with another brokerage
  underContract?: boolean // with another brokerage
  valueSourcesDisagree?: boolean // set when the CRM import already flagged it
  boughtDaysAgo?: number // recorded purchase
}

export interface Scenario {
  product: string // a Revive product name, optionally "+ ADU"
  note: string
  gain: number | null // null = not eligible
}

export interface ProjectState {
  status: 'submitted' | 'active'
  product: Product
  stageLabel: string // "Construction · week 4 of 8"
  progressPct: number
  timeline: { label: string; state: 'done' | 'current' | 'todo' }[]
  nextFromAgent?: string
  docs: string[]
  targetList?: number
}

export interface Property {
  id: string
  address: string
  city: string
  lat: number
  lng: number
  homeType: 'Single family' | 'Condo' | 'Townhouse' | 'Multi-family'
  beds?: number
  baths?: number
  sqft: number
  yearBuilt: number
  lot?: number
  photo?: string // key into src/assets/photos (illustrative photos from the Contacts page)
  ownerId?: string // Person
  ownerRole: 'Owner' | 'Seller'
  source: Source
  minTier: Tier // e.g. Revive referrals are 'partner'
  stage: Stage // default; demo actions override
  reportRun: boolean
  valueNow: number
  valueAfter: number
  valueSources?: { name: string; value: number }[] // a range, not one number
  signals: string[] // "why now", plain language, most important first
  facts: Facts
  scenarios: Scenario[]
  project?: ProjectState
  activity: string[]
  comps?: Comp[]
  report?: { headline: string; why: string; ppsf?: number; compsFound?: number; compsUsed?: number }
}

export interface Person {
  id: string
  name: string
  relationship: 'Past client' | 'Sphere' | 'Homeowner' | 'Seller client' | 'Revive referral'
  source: string // "Your CRM", "Your lead form", "Revive referral"
  since: string
  lastTouchDays: number | null // null = never contacted
  touchVia?: string // "Emailed", "Called", "Texted"
  phone?: string
  notes: { text: string; date: string }[]
  history?: CrmEvent[] // what the CRM already knows, newest first
  activity: string[]
  sellScore?: number // 0–100, likelihood to sell
  reviveScore?: number // 0–100, how much Revive could add
}

export interface Referral {
  propertyId: string
  personId: string
  expiresInHours: number // exclusivity window
  status: 'new' | 'claimed' | 'contacted' | 'listing' | 'lost'
  needsUpdate: boolean // Revive requires agent status updates
}

export interface CrmEvent {
  kind: 'email' | 'call' | 'text' | 'note' | 'meet' | 'crm' | 'mls'
  daysAgo: number
  when?: string
  title: string
  body?: string
  tag?: string // "Opened twice, no reply"
  inbound?: boolean // they reached out
}

export interface Comp {
  address: string
  sqft: number
  ppsf: number
  price: number
  distMi: number
  monthsAgo: number
  features: string[]
  photo?: string
}
