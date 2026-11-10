import craftsman from '@/assets/homes/01-craftsman-bungalow.jpg'
import spanish from '@/assets/homes/02-spanish-revival.jpg'
import ranch from '@/assets/homes/03-midcentury-ranch.jpg'
import cottage from '@/assets/homes/06-stucco-cottage.jpg'
import splitLevel from '@/assets/homes/07-split-level.jpg'
import craftsman2 from '@/assets/homes/08-craftsman-two-story.jpg'

// Flip360 opportunity map (sample data): the active MLS listings around Eagle Rock and Highland Park, and
// Revive's read on each one. Most listings are not flips, and the map says why; a few qualify for Flip360,
// and a few more look promising but need a Revive underwriter before they count.

export type Tier = 'qualified' | 'potential' | 'standard'
export type HomeType = 'Single family' | 'Condo' | 'Townhouse'

export interface Comp {
  address: string
  price: number
  sqft: number
  soldDaysAgo: number
  distMi: number
  renovated: boolean
}

/** Revive's underwriting for a qualified or potential Flip360 home. */
export interface FlipCase {
  arv: number // after-repair value
  reno: [number, number] // renovation estimate, low–high
  scope: 'Cosmetic' | 'Moderate' | 'Heavy'
  weeks: number // renovation timeline
  confidence: 'High' | 'Medium' | 'Preliminary'
  reasons: { title: string; detail: string }[]
  verify: string[] // what still has to be checked (qualified) or blocks qualification (potential)
  comps: Comp[]
  /** potential only: the price at which the deal would work */
  targetOffer?: number
}

/** For a plain listing: Revive's one-line answer to "is this a flip?" */
export interface Check {
  verdict: string
  note: string
}

export interface Listing {
  id: string
  mls: string
  address: string
  area: 'Eagle Rock' | 'Highland Park'
  zip: string
  lat: number
  lng: number
  price: number
  beds: number
  baths: number
  sqft: number
  lot: number
  built: number
  type: HomeType
  dom: number
  priceCut?: number
  photos: string[]
  tier: Tier
  flip?: FlipCase
  check?: Check
}

// holding (taxes, insurance, loan) plus selling costs, as a share of the after-repair value
export const COST_RATE = 0.08

export const renoMid = (f: FlipCase) => Math.round((f.reno[0] + f.reno[1]) / 2 / 1000) * 1000
export const costsOf = (f: FlipCase) => Math.round((f.arv * COST_RATE) / 1000) * 1000
/** projected profit at the list price (or at a given purchase price), using the middle of the reno range */
export const profitOf = (l: Listing, buy = l.price) => (l.flip ? l.flip.arv - buy - renoMid(l.flip) - costsOf(l.flip) : 0)
/** profit range across the renovation estimate */
export const profitRange = (l: Listing, buy = l.price): [number, number] =>
  l.flip ? [l.flip.arv - buy - l.flip.reno[1] - costsOf(l.flip), l.flip.arv - buy - l.flip.reno[0] - costsOf(l.flip)] : [0, 0]
export const marginOf = (l: Listing, buy = l.price) => (l.flip ? profitOf(l, buy) / l.flip.arv : 0)
export const ppsf = (l: Listing) => Math.round(l.price / l.sqft)

// listing photos: the prototype's ten sample exteriors, a stable pick per listing
const HOMES = Object.values(import.meta.glob('/src/assets/homes/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>).sort()
const seed = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261)
const photos = (id: string, own?: string) => {
  const h = seed(id)
  const picks = new Set<string>(own ? [own] : [])
  for (let i = 0; picks.size < 4; i++) picks.add(HOMES[(h + i * 3) % HOMES.length])
  return [...picks]
}

/** Straight-line miles between two points (good enough at neighborhood scale). */
export function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dy = (a.lat - b.lat) * 69
  const dx = (a.lng - b.lng) * 69 * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

type Base = Omit<Listing, 'photos' | 'tier' | 'mls' | 'zip'> & { photo?: string }
const ZIP = { 'Eagle Rock': '90041', 'Highland Park': '90042' } as const
let n = 0
const make = (tier: Tier, b: Base, extra: Pick<Listing, 'flip' | 'check'>): Listing => {
  const { photo, ...rest } = b
  n += 1
  return { ...rest, ...extra, tier, zip: ZIP[b.area], mls: `26-${(481200 + n * 137).toString()}`, photos: photos(b.id, photo) }
}

const qualified = (b: Base, flip: FlipCase) => make('qualified', b, { flip })
const potential = (b: Base, flip: FlipCase) => make('potential', b, { flip })
const standard = (b: Base, verdict: string, note: string) => make('standard', b, { check: { verdict, note } })

export const LISTINGS: Listing[] = [
  // ── Revive Flip360: qualified ─────────────────────────────────────────────────────────────────────
  qualified(
    { id: 'townsend-4817', address: '4817 Townsend Ave', area: 'Eagle Rock', lat: 34.1338, lng: -118.2101, price: 899_000, beds: 3, baths: 1, sqft: 1240, lot: 6250, built: 1948, type: 'Single family', dom: 46, priceCut: 50_000, photo: craftsman },
    {
      arv: 1_420_000,
      reno: [150_000, 185_000],
      scope: 'Cosmetic',
      weeks: 10,
      confidence: 'High',
      reasons: [
        { title: '22% below renovated comps', detail: '$725/sqft against $1,145/sqft for renovated 3-bed sales within half a mile.' },
        { title: 'Cosmetic scope, sound bones', detail: 'Original kitchen and bath; the seller’s inspection shows a bolted foundation and a 2017 roof.' },
        { title: 'Room for a second bath', detail: 'The floor plan fits a second bath inside the footprint, which Revive’s ARV already counts.' },
        { title: 'Motivated seller', detail: '46 days on market and a $50K price cut two weeks ago.' },
      ],
      verify: ['Sewer lateral: ask for the scope video', 'Galvanized supply lines likely; included in the high reno estimate'],
      comps: [
        { address: '4732 Townsend Ave', price: 1_465_000, sqft: 1310, soldDaysAgo: 34, distMi: 0.1, renovated: true },
        { address: '1820 Hill Dr', price: 1_390_000, sqft: 1205, soldDaysAgo: 58, distMi: 0.3, renovated: true },
        { address: '5011 Merton Ave', price: 1_410_000, sqft: 1260, soldDaysAgo: 71, distMi: 0.4, renovated: true },
      ],
    },
  ),
  qualified(
    { id: 'merton-2218', address: '2218 Merton Ave', area: 'Eagle Rock', lat: 34.1426, lng: -118.2018, price: 745_000, beds: 2, baths: 1, sqft: 1050, lot: 5400, built: 1924, type: 'Single family', dom: 63, priceCut: 80_000, photo: spanish },
    {
      arv: 1_180_000,
      reno: [120_000, 150_000],
      scope: 'Cosmetic',
      weeks: 8,
      confidence: 'High',
      reasons: [
        { title: 'Estate sale, listed as-is', detail: 'Two price drops ($80K total). Probate is closed, so it can close in 30 days.' },
        { title: '$710/sqft vs $1,120 renovated', detail: 'Three renovated 2-bed Spanish homes nearby sold at $1,090–1,160/sqft this year.' },
        { title: 'Light scope', detail: 'Paint, floors, kitchen and bath. Roof replaced in 2019; copper plumbing.' },
      ],
      verify: ['Knob-and-tube wiring in the attic: confirm what is still live'],
      comps: [
        { address: '2304 Merton Ave', price: 1_195_000, sqft: 1080, soldDaysAgo: 22, distMi: 0.1, renovated: true },
        { address: '5120 Range View Ave', price: 1_150_000, sqft: 1010, soldDaysAgo: 49, distMi: 0.4, renovated: true },
        { address: '2077 Vincent Ave', price: 1_210_000, sqft: 1115, soldDaysAgo: 88, distMi: 0.5, renovated: true },
      ],
    },
  ),
  qualified(
    { id: 'aldama-5621', address: '5621 Aldama St', area: 'Highland Park', lat: 34.1142, lng: -118.1893, price: 965_000, beds: 3, baths: 2, sqft: 1410, lot: 5950, built: 1912, type: 'Single family', dom: 38, photo: craftsman2 },
    {
      arv: 1_480_000,
      reno: [190_000, 230_000],
      scope: 'Moderate',
      weeks: 14,
      confidence: 'Medium',
      reasons: [
        { title: 'Craftsman premium', detail: 'Restored Highland Park Craftsmans are selling 9% over list on average in the last 90 days.' },
        { title: 'Original details intact', detail: 'Built-ins, fir floors and windows are original: restore rather than replace.' },
        { title: 'Spread holds at the high estimate', detail: 'Even at $230K renovation, the projected margin stays above Flip360’s 10% floor.' },
      ],
      verify: ['Historic overlay (HPOZ): exterior changes need review, adds ~3 weeks', 'Older foundation: budget includes a retrofit'],
      comps: [
        { address: '5544 Aldama St', price: 1_525_000, sqft: 1460, soldDaysAgo: 40, distMi: 0.1, renovated: true },
        { address: '5710 Granada St', price: 1_445_000, sqft: 1380, soldDaysAgo: 65, distMi: 0.3, renovated: true },
        { address: '5809 Echo St', price: 1_460_000, sqft: 1420, soldDaysAgo: 102, distMi: 0.5, renovated: true },
      ],
    },
  ),

  // ── Potential: promising, needs review ────────────────────────────────────────────────────────────
  potential(
    { id: 'yosemite-1847', address: '1847 Yosemite Dr', area: 'Eagle Rock', lat: 34.1395, lng: -118.2158, price: 1_049_000, beds: 3, baths: 2, sqft: 1620, lot: 7100, built: 1951, type: 'Single family', dom: 29, photo: ranch },
    {
      arv: 1_560_000,
      reno: [210_000, 320_000],
      scope: 'Heavy',
      weeks: 16,
      confidence: 'Preliminary',
      reasons: [
        { title: 'Big lot for the area', detail: '7,100 sqft lot: buyers pay up for yards on Yosemite.' },
        { title: 'Dated mid-century, good layout', detail: 'Open plan potential with a wall removal; ARV assumes it.' },
      ],
      verify: ['Disclosures mention foundation cracks: needs an engineer’s report', 'Wall removal may be load-bearing'],
      comps: [
        { address: '1902 Yosemite Dr', price: 1_595_000, sqft: 1680, soldDaysAgo: 45, distMi: 0.1, renovated: true },
        { address: '1733 Hill Dr', price: 1_520_000, sqft: 1590, soldDaysAgo: 77, distMi: 0.4, renovated: true },
      ],
      targetOffer: 975_000,
    },
  ),
  potential(
    { id: 'ellenwood-4520', address: '4520 Ellenwood Dr', area: 'Eagle Rock', lat: 34.1281, lng: -118.2192, price: 829_000, beds: 2, baths: 1, sqft: 980, lot: 6800, built: 1938, type: 'Single family', dom: 51, photo: cottage },
    {
      arv: 1_240_000,
      reno: [140_000, 200_000],
      scope: 'Moderate',
      weeks: 12,
      confidence: 'Preliminary',
      reasons: [
        { title: 'Garage already converted', detail: 'A 380 sqft studio out back; legalized as an ADU it adds roughly $150K to the ARV.' },
        { title: 'Under the street’s median', detail: 'Ellenwood 2-beds have sold at $1.1–1.3M renovated.' },
      ],
      verify: ['The studio is unpermitted: Revive needs the permit history before the ADU value counts'],
      comps: [
        { address: '4611 Ellenwood Dr', price: 1_255_000, sqft: 1020, soldDaysAgo: 30, distMi: 0.1, renovated: true },
        { address: '4390 Eagle Rock Blvd', price: 1_190_000, sqft: 990, soldDaysAgo: 93, distMi: 0.4, renovated: true },
      ],
    },
  ),
  potential(
    { id: 'echo-6012', address: '6012 Echo St', area: 'Highland Park', lat: 34.1098, lng: -118.1828, price: 899_000, beds: 3, baths: 1, sqft: 1300, lot: 5200, built: 1922, type: 'Single family', dom: 74, photo: splitLevel },
    {
      arv: 1_290_000,
      reno: [160_000, 210_000],
      scope: 'Moderate',
      weeks: 12,
      confidence: 'Preliminary',
      reasons: [
        { title: 'Stale listing', detail: '74 days on market with no price change: room to negotiate.' },
        { title: 'Works at the right price', detail: 'At $850K the projected margin clears Flip360’s 10% floor.' },
      ],
      verify: ['At list price the margin is thin: Revive needs a seller counter near $850K'],
      comps: [
        { address: '5933 Echo St', price: 1_305_000, sqft: 1320, soldDaysAgo: 51, distMi: 0.1, renovated: true },
        { address: '6120 Buchanan St', price: 1_270_000, sqft: 1280, soldDaysAgo: 84, distMi: 0.3, renovated: true },
      ],
      targetOffer: 850_000,
    },
  ),

  // ── Every other active listing: shown, quiet, with Revive's reason it isn't a flip ────────────────
  standard({ id: 'hill-1712', address: '1712 Hill Dr', area: 'Eagle Rock', lat: 34.1452, lng: -118.2121, price: 780_000, beds: 2, baths: 1, sqft: 1150, lot: 8900, built: 1956, type: 'Single family', dom: 33 }, 'Looks cheap, isn’t', 'Priced 24% under the area, but it sits on a slope with a failing retaining wall (est. $180K+). The spread disappears.'),
  standard({ id: 'college-4911', address: '4911 College View Ave', area: 'Eagle Rock', lat: 34.1362, lng: -118.2048, price: 1_385_000, beds: 3, baths: 2, sqft: 1480, lot: 6100, built: 1941, type: 'Single family', dom: 12 }, 'Already renovated', 'Remodeled in 2023. Little left to add.'),
  standard({ id: 'caspar-5260', address: '5260 Caspar Ave', area: 'Eagle Rock', lat: 34.1311, lng: -118.2052, price: 1_195_000, beds: 3, baths: 2, sqft: 1390, lot: 5800, built: 1949, type: 'Single family', dom: 19 }, 'Priced at market', 'At $860/sqft it’s already near the after-renovation value for the street.'),
  standard({ id: 'colorado-2100-4', address: '2100 Colorado Blvd #4', area: 'Eagle Rock', lat: 34.1393, lng: -118.2072, price: 689_000, beds: 2, baths: 2, sqft: 1040, lot: 0, built: 1987, type: 'Condo', dom: 22 }, 'Not eligible', 'Flip360 covers single-family homes only.'),
  standard({ id: 'glen-iris-5047', address: '5047 Glen Iris Ave', area: 'Eagle Rock', lat: 34.1304, lng: -118.2149, price: 1_249_000, beds: 4, baths: 2, sqft: 1760, lot: 6600, built: 1952, type: 'Single family', dom: 8 }, 'Thin margin', 'After an est. $160K update, the projected margin is 6%: under Flip360’s 10% floor.'),
  standard({ id: 'maywood-1918', address: '1918 Maywood Ave', area: 'Eagle Rock', lat: 34.1417, lng: -118.2093, price: 1_099_000, beds: 3, baths: 1, sqft: 1280, lot: 5500, built: 1926, type: 'Single family', dom: 27 }, 'Priced at market', 'Recent sales put the renovated value at about $1.3M: not enough room after costs.'),
  standard({ id: 'vincent-2025', address: '2025 Vincent Ave', area: 'Eagle Rock', lat: 34.1446, lng: -118.2047, price: 1_475_000, beds: 4, baths: 3, sqft: 2050, lot: 7300, built: 1938, type: 'Single family', dom: 15 }, 'Already renovated', 'Updated kitchen and baths (2021). Priced as finished.'),
  standard({ id: 'sierra-villa-4430', address: '4430 Sierra Villa Dr', area: 'Eagle Rock', lat: 34.1487, lng: -118.2182, price: 1_620_000, beds: 4, baths: 3, sqft: 2240, lot: 9800, built: 1962, type: 'Single family', dom: 41 }, 'Above the ceiling', 'Already over what renovated homes on this hill have sold for.'),
  standard({ id: 'lockhaven-5112', address: '5112 Lockhaven Ave', area: 'Eagle Rock', lat: 34.1349, lng: -118.2189, price: 935_000, beds: 2, baths: 1, sqft: 1090, lot: 5100, built: 1940, type: 'Single family', dom: 6 }, 'Thin margin', 'New listing priced close to value; Revive will re-check if the price drops.'),
  standard({ id: 'norwalk-1622', address: '1622 Norwalk Ave', area: 'Eagle Rock', lat: 34.1468, lng: -118.2108, price: 1_150_000, beds: 3, baths: 2, sqft: 1420, lot: 6000, built: 1950, type: 'Single family', dom: 18 }, 'Priced at market', 'In line with recent sales for its condition.'),
  standard({ id: 'mt-helena-2340', address: '2340 Mt Helena Ave', area: 'Eagle Rock', lat: 34.1321, lng: -118.1999, price: 875_000, beds: 2, baths: 1, sqft: 960, lot: 4900, built: 1923, type: 'Single family', dom: 57 }, 'Looks cheap, isn’t', 'Below the area per sqft, but it backs onto the freeway: renovated homes here sell at a 15% discount.'),
  standard({ id: 'el-rio-4721', address: '4721 El Rio Ave', area: 'Eagle Rock', lat: 34.1283, lng: -118.2081, price: 1_325_000, beds: 3, baths: 2, sqft: 1560, lot: 6400, built: 1947, type: 'Single family', dom: 24 }, 'Already renovated', 'Flipped in 2022; priced as finished.'),
  standard({ id: 'argus-1531', address: '1531 Argus Dr', area: 'Eagle Rock', lat: 34.1255, lng: -118.2142, price: 1_089_000, beds: 3, baths: 2, sqft: 1350, lot: 7200, built: 1958, type: 'Single family', dom: 31 }, 'Thin margin', 'A full update runs about $190K here; the projected margin is 7%.'),
  standard({ id: 'dahlia-4625', address: '4625 Dahlia Dr', area: 'Eagle Rock', lat: 34.1379, lng: -118.1968, price: 990_000, beds: 3, baths: 1, sqft: 1220, lot: 5300, built: 1929, type: 'Single family', dom: 14 }, 'Priced at market', 'Partly updated (kitchen 2018): the remaining upside is small.'),
  standard({ id: 'hartwick-2511-b', address: '2511 Hartwick St #B', area: 'Eagle Rock', lat: 34.1268, lng: -118.2013, price: 749_000, beds: 2, baths: 2, sqft: 1120, lot: 0, built: 2006, type: 'Townhouse', dom: 37 }, 'Not eligible', 'Flip360 covers single-family homes only.'),
  standard({ id: 'monte-bonito-1408', address: '1408 Monte Bonito Dr', area: 'Eagle Rock', lat: 34.1481, lng: -118.2035, price: 1_895_000, beds: 4, baths: 3, sqft: 2480, lot: 11200, built: 1964, type: 'Single family', dom: 48 }, 'Above the ceiling', 'Higher than anything renovated nearby has sold for.'),
  standard({ id: 'ridgeview-1845', address: '1845 Ridgeview Ave', area: 'Eagle Rock', lat: 34.1418, lng: -118.2222, price: 1_029_000, beds: 3, baths: 2, sqft: 1300, lot: 6900, built: 1955, type: 'Single family', dom: 9 }, 'Priced at market', 'Close to its after-renovation value already.'),
  standard({ id: 'eagle-rock-4366', address: '4366 Eagle Rock Blvd', area: 'Eagle Rock', lat: 34.1247, lng: -118.2066, price: 819_000, beds: 2, baths: 1, sqft: 900, lot: 4500, built: 1921, type: 'Single family', dom: 66 }, 'Looks cheap, isn’t', 'Commercial frontage on the boulevard caps resale; renovated homes on it sell for ~$1.0M.'),
  standard({ id: 'granada-5512', address: '5512 Granada St', area: 'Highland Park', lat: 34.1168, lng: -118.1934, price: 1_150_000, beds: 3, baths: 2, sqft: 1380, lot: 5600, built: 1915, type: 'Single family', dom: 20 }, 'Already renovated', 'Restored in 2020; priced as finished.'),
  standard({ id: 'ave-57-411', address: '411 N Avenue 57', area: 'Highland Park', lat: 34.1121, lng: -118.1958, price: 1_045_000, beds: 3, baths: 1, sqft: 1250, lot: 5000, built: 1910, type: 'Single family', dom: 25 }, 'Thin margin', 'Heavy structural work (est. $260K) leaves a 4% margin.'),
  standard({ id: 'buchanan-5935', address: '5935 Buchanan St', area: 'Highland Park', lat: 34.1186, lng: -118.1862, price: 1_275_000, beds: 3, baths: 2, sqft: 1500, lot: 6200, built: 1924, type: 'Single family', dom: 11 }, 'Priced at market', 'In line with renovated sales nearby.'),
]

export interface Place {
  id: string
  label: string
  sub: string
  lat: number
  lng: number
  zoom: number
}

export const PLACES: Place[] = [
  { id: 'eagle-rock', label: 'Eagle Rock', sub: 'Los Angeles, CA 90041', lat: 34.1372, lng: -118.2085, zoom: 14 },
  { id: 'highland-park', label: 'Highland Park', sub: 'Los Angeles, CA 90042', lat: 34.1138, lng: -118.1905, zoom: 14.5 },
  { id: 'glassell-park', label: 'Glassell Park', sub: 'Los Angeles, CA 90065', lat: 34.1195, lng: -118.2295, zoom: 14 },
]

/** Where "current location" lands in the demo: Colorado Blvd in Eagle Rock. */
export const DEMO_HERE = { lat: 34.1384, lng: -118.2098 }

export const TIER_LABEL: Record<Tier, string> = {
  qualified: 'Flip360 opportunity',
  potential: 'Potential — needs review',
  standard: 'MLS listing',
}
