import { hash, type ReportDraft } from '@/lib/flows'

// What the "Add a home" intake works out about a home, shared by the analysis animation and the
// walkthrough after it: the home's condition, the sales nearby (and which count), the values they give,
// and the rules that apply.
//
// Values, product-agnostic:
//   As-is value      = sales nearby in the same or worse condition than this home, at this home's size.
//   Potential value  = sales nearby in better condition, at this home's size: what it could sell for improved.
//
// The rules summarize California law (ADU: Gov. Code §66310–66342 and SB 543; SB 9 lot splits) and common
// city rules (remodel permits, Title 24 energy code, EPA lead-safe work for pre-1978 homes). Zoning,
// overlays and the sales are sample data for the prototype.

export type IntakePath = 'sell' | 'renovate' | 'build'

export const CONDITIONS = [
  { label: 'Disrepair', sub: 'Needs major repairs: roof, foundation or systems' },
  { label: 'Poor', sub: 'Worn and dated, original kitchen and baths' },
  { label: 'Good', sub: 'Well kept, with some updates' },
  { label: 'Excellent', sub: 'Updated recently, move-in ready' },
  { label: 'Luxury', sub: 'High-end finishes and design throughout' },
] as const
const COND_PPSF = [0.8, 0.9, 1, 1.1, 1.22] // price per sq ft against an average-condition home

export interface Comp {
  id: string
  at: [number, number]
  address: string
  price: number
  sqft: number
  beds: number
  baths: number
  months: number // sold this many months ago
  miles: number
  condition: number // index into CONDITIONS
  why: string // why it's in, or why it was left out
  picked: boolean // what Revive picked; the agent can change it
}

const STREETS = ['N Hill Ave', 'N Allen Ave', 'E Orange Grove Blvd', 'N Catalina Ave', 'Holliston Ave', 'N Chester Ave', 'Craig Ave', 'N Wilson Ave', 'E Mountain St', 'N Michigan Ave', 'Galena Ave', 'E Villa St']

export const short = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2).replace(/0$/, '')}M` : `$${Math.round(n / 1000)}K`)

/** The home's condition, read from its listing photos (sample: from the year it was built and the address). */
export function conditionOf(d: ReportDraft): number {
  const h = hash(d.address)
  const y = d.yearBuilt ?? 1960
  return Math.max(1, Math.min(3, (y > 1990 ? 3 : y > 1955 ? 2 : 1) + ((h % 3) - 1)))
}

/** Sales nearby. Revive picks those within 0.6 mi, sold in the last 6 months, within 30% of the home's size. */
export function compsFor(home: [number, number], d: ReportDraft, valueNow: number): Comp[] {
  const h = hash(d.address)
  const sqft = d.sqft ?? 1600
  const base = valueNow / sqft / COND_PPSF[conditionOf(d)]
  return Array.from({ length: 12 }, (_, k) => {
    const r = (x: number) => ((h >>> (x % 24)) ^ hash(`${d.address}${k}${x}`)) >>> 0
    const angle = (r(1) % 360) * (Math.PI / 180)
    const miles = Math.round((0.15 + (r(2) % 95) / 100) * 10) / 10
    const deg = miles / 69
    const condition = r(3) % 5
    const size = Math.round((sqft * (0.7 + (r(4) % 75) / 100)) / 10) * 10
    const months = 1 + (r(5) % 11)
    const ppsf = base * COND_PPSF[condition] * (0.95 + (r(6) % 10) / 100)
    const far = miles > 0.6
    const old = months > 6
    const off = Math.abs(size - sqft) / sqft > 0.3
    const why = far ? `${miles} mi away, outside the area` : old ? `Sold ${months} months ago, too long ago` : off ? `${size.toLocaleString()} sq ft, too ${size > sqft ? 'big' : 'small'} to compare` : `${miles} mi away · sold ${months} mo ago · similar size`
    return {
      id: `c${k}`,
      at: [home[0] + Math.sin(angle) * deg, home[1] + Math.cos(angle) * deg * 1.2],
      address: `${120 + (r(7) % 1800)} ${STREETS[r(8) % STREETS.length]}`,
      price: Math.round((ppsf * size) / 5000) * 5000,
      sqft: size,
      beds: Math.max(2, (d.beds ?? 3) + (r(9) % 3) - 1),
      baths: Math.max(1, (d.baths ?? 2) + (r(10) % 3) - 1),
      months,
      miles,
      condition,
      why,
      picked: !far && !old && !off,
    }
  })
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0
}
const round = (n: number) => Math.round(n / 5000) * 5000

/** As-is and potential values from the picked sales and the home's condition. */
export function valuesOf(comps: Comp[], condition: number, sqft: number, fallback: number) {
  const picked = comps.filter((c) => c.picked)
  const same = picked.filter((c) => c.condition <= condition)
  const better = picked.filter((c) => c.condition > condition)
  const ppsf = (cs: Comp[]) => median(cs.map((c) => c.price / c.sqft))
  const asIs = same.length ? round(ppsf(same) * sqft) : round(fallback)
  const potential = better.length ? Math.max(asIs, round(ppsf(better) * sqft)) : asIs
  return { asIs, potential, same, better }
}

export type Rule = { group: 'Zoning' | 'Renovation' | 'ADU and lot'; title: string; text: string; tone: 'ok' | 'flag' }

export function rulesFor(d: ReportDraft, path: IntakePath): Rule[] {
  const h = hash(d.address)
  const city = d.city || 'Pasadena'
  const sf = d.homeType === 'Single family'
  const open = (d.lot ?? 0) - (d.sqft ?? 0)
  const overlay = h % 5 === 0 ? 'landmark' : h % 7 === 0 ? 'hillside' : null
  const rules: Rule[] = [
    { group: 'Zoning', title: `${city} zoning: ${sf ? 'R-1' : 'RM'}`, text: sf ? 'Single-family residential. One home per lot, plus ADUs.' : 'Multi-family residential.', tone: 'ok' },
    overlay === 'landmark'
      ? { group: 'Zoning', title: 'In a landmark district', text: 'Exterior changes need design review, and an ADU should stay out of view from the street.', tone: 'flag' }
      : overlay === 'hillside'
        ? { group: 'Zoning', title: 'In a hillside overlay', text: 'Stricter limits on the size and height of a detached ADU.', tone: 'flag' }
        : { group: 'Zoning', title: 'No historic or hillside overlay', text: 'No extra design review for exterior work.', tone: 'ok' },
    { group: 'Renovation', title: 'Remodel permits', text: 'Kitchen and bath remodels need a city permit and must meet Title 24 energy rules: efficient lighting and exhaust fans.', tone: 'ok' },
  ]
  if (d.yearBuilt && d.yearBuilt < 1978) rules.push({ group: 'Renovation', title: `Built in ${d.yearBuilt}: lead-safe work`, text: 'Homes built before 1978 need a lead-safe certified crew (EPA RRP) for paint work.', tone: 'flag' })
  if (path === 'sell') rules.push({ group: 'Renovation', title: 'Seller disclosures', text: 'Past work should have permits on file before the home is listed.', tone: 'ok' })
  if (sf) {
    rules.push({ group: 'ADU and lot', title: 'An ADU is allowed by state law', text: 'Up to 800 sq ft and 16 ft tall, 4 ft from the side and rear lot lines. No owner needs to live on site.', tone: 'ok' })
    rules.push(open >= 6000 ? { group: 'ADU and lot', title: `${open.toLocaleString()} sq ft of open lot`, text: 'Room for a detached ADU in the back yard.', tone: 'ok' } : { group: 'ADU and lot', title: `${Math.max(0, open).toLocaleString()} sq ft of open lot`, text: 'Tight for a detached ADU; an attached or garage conversion may still work.', tone: 'flag' })
    rules.push({ group: 'ADU and lot', title: 'No impact fees under 750 sq ft', text: 'ADUs of 750 sq ft or less pay no development impact fees.', tone: 'ok' })
    rules.push((d.lot ?? 0) >= 2400 ? { group: 'ADU and lot', title: 'SB 9 lot split possible', text: 'Each new lot at least 1,200 sq ft; the owner lives there for 3 years.', tone: 'ok' } : { group: 'ADU and lot', title: 'Too small for an SB 9 lot split', text: 'Each new lot needs at least 1,200 sq ft.', tone: 'flag' })
  } else rules.push({ group: 'ADU and lot', title: 'No ADU or lot split here', text: `ADU and lot-split rules are for single-family lots; this is a ${d.homeType.toLowerCase()}.`, tone: 'flag' })
  return rules
}
