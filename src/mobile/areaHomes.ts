import { AGENT } from '@/data/tiers'
import { properties } from '@/data/properties'
import { hash, mlsPhotos } from '@/lib/flows'

// The market around the agent, for the mobile map (sample data): recent sales, homes for sale and pending
// sales, around the office and around every home in the book, so any home has comps nearby. Seeded, so the
// same homes come back on every load.

export type AreaStatus = 'sold' | 'active' | 'pending'
export interface AreaHome {
  id: string
  address: string
  city: string
  lat: number
  lng: number
  beds: number
  baths: number
  sqft: number
  yearBuilt: number
  status: AreaStatus
  price: number // sold price, or the asking price
  ppsf: number
  monthsAgo?: number // sold
  daysOnMarket?: number // for sale, pending
  photo?: string
  dropped?: boolean // a spot the agent long-pressed, not a listing
}

export const STATUS_LABEL: Record<AreaStatus, string> = { sold: 'Sold', active: 'For sale', pending: 'Pending' }

const MI = 1 / 69 // degrees of latitude per mile
const STREETS = ['Oak Knoll Ave', 'El Molino Ave', 'Lake Ave', 'Orange Grove Blvd', 'Mar Vista Ave', 'Allen Ave', 'Hill Ave', 'Catalina Ave', 'Wilson Ave', 'San Rafael Ave', 'Linda Vista Ave', 'Madre St', 'Holliston Ave', 'Craig Ave', 'Michigan Ave', 'Sierra Bonita Ave']

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function miles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dy = (a.lat - b.lat) / MI
  const dx = ((a.lng - b.lng) / MI) * Math.cos((a.lat * Math.PI) / 180)
  return Math.hypot(dx, dy)
}

const round = (n: number, to: number) => Math.round(n / to) * to

function cluster(key: string, lat: number, lng: number, city: string, ppsf: number, n: number, radiusMi: number): AreaHome[] {
  const r = rng(hash(key))
  return Array.from({ length: n }, (_, i) => {
    const ang = r() * Math.PI * 2
    const dist = (0.12 + Math.sqrt(r()) * (radiusMi - 0.12)) * MI
    const sqft = round(1100 + r() * 2100, 10)
    const p = Math.round(ppsf * (0.82 + r() * 0.36))
    const roll = r()
    const status: AreaStatus = roll < 0.56 ? 'sold' : roll < 0.86 ? 'active' : 'pending'
    const address = `${100 + Math.floor(r() * 1900)} ${STREETS[Math.floor(r() * STREETS.length)]}`
    return {
      id: `${key}-${i}`,
      address,
      city,
      lat: lat + Math.sin(ang) * dist,
      lng: lng + (Math.cos(ang) * dist) / Math.cos((lat * Math.PI) / 180),
      beds: 2 + Math.floor((sqft - 1000) / 600),
      baths: 1 + Math.floor((sqft - 900) / 800),
      sqft,
      yearBuilt: 1922 + Math.floor(r() * 70),
      status,
      price: round(sqft * p, 1000),
      ppsf: p,
      monthsAgo: status === 'sold' ? 1 + Math.floor(r() * 6) : undefined,
      daysOnMarket: status === 'sold' ? undefined : 2 + Math.floor(r() * 50),
      photo: mlsPhotos(`${key}-${i}`)[0],
    }
  })
}

let cache: AreaHome[] | null = null
/** Every sample market home: around the office, and a handful around each home in the book. */
export function areaHomes(): AreaHome[] {
  if (cache) return cache
  const office = AGENT.office
  const homes = [...cluster('office', office.lat, office.lng, 'Pasadena', 880, 54, 2.4)]
  for (const p of properties) {
    if (miles(p, office) < 2) continue // already covered by the office set
    homes.push(...cluster(p.id, p.lat, p.lng, p.city, Math.max(450, p.valueNow / Math.max(p.sqft, 800)), 7, 0.9))
  }
  cache = homes
  return homes
}

/** The 5 best comps for a home: recent sales within a mile, closest in size and distance first. */
export function compsFor(home: { lat: number; lng: number; sqft?: number; id?: string }) {
  const sqft = home.sqft ?? 1800
  return areaHomes()
    .filter((h) => h.status === 'sold' && h.id !== home.id)
    .map((h) => ({ h, d: miles(home, h) }))
    .filter((x) => x.d <= 1.2)
    .sort((a, b) => a.d / 1.2 + Math.abs(a.h.sqft - sqft) / sqft - (b.d / 1.2 + Math.abs(b.h.sqft - sqft) / sqft))
    .slice(0, 5)
    .map(({ h, d }) => ({ ...h, distMi: Math.round(d * 10) / 10 }))
}

/** Any spot on the map: the nearest street address, valued from the sales around it. */
export function homeAt(lat: number, lng: number): AreaHome {
  const r = rng(hash(`${lat.toFixed(4)},${lng.toFixed(4)}`))
  const near = areaHomes()
    .map((h) => ({ h, d: miles({ lat, lng }, h) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 6)
  const ppsf = near.length ? Math.round(near.reduce((n, x) => n + x.h.ppsf, 0) / near.length) : 850
  const sqft = round(1200 + r() * 1800, 10)
  return {
    id: `drop-${lat.toFixed(4)}-${lng.toFixed(4)}`,
    address: `${100 + Math.floor(r() * 1900)} ${near[0]?.h.address.split(' ').slice(1).join(' ') ?? STREETS[0]}`,
    city: near[0]?.h.city ?? 'Pasadena',
    lat,
    lng,
    beds: 2 + Math.floor((sqft - 1000) / 600),
    baths: 1 + Math.floor((sqft - 900) / 800),
    sqft,
    yearBuilt: 1925 + Math.floor(r() * 65),
    status: 'sold',
    price: round(sqft * ppsf, 1000),
    ppsf,
    monthsAgo: 12 * (4 + Math.floor(r() * 14)),
    photo: mlsPhotos(`drop-${lat.toFixed(3)}`)[0],
    dropped: true,
  }
}
