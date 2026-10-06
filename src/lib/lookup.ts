import { properties } from '@/data/properties'
import { AGENT } from '@/data/tiers'
import type { Property, Source } from '@/data/types'
import { topGain } from './urgency'

// What Revive AI can say about any address, before the agent has connected anything.
// Homes in the sample book use their record; any other address gets a sample estimate.
export interface Lookup {
  key: string
  propertyId?: string
  source?: Source
  address: string
  city: string
  lat: number
  lng: number
  photo?: string
  facts: string[]
  valueNow: number
  valueLo: number
  valueHi: number
  gain: number
  product: string
  sample: boolean // estimate made up for the prototype, not from a record
}

const PRODUCTS = ['Renovate to Sell', 'Renovate to Stay', 'Sell 360', 'Renovate to Stay + ADU']

export function lookupProperty(p: Property): Lookup {
  const vals = p.valueSources?.map((s) => s.value) ?? [p.valueNow]
  const best = [...p.scenarios].sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))[0]
  return {
    key: p.id,
    propertyId: p.id,
    source: p.source,
    address: p.address,
    city: p.city,
    lat: p.lat,
    lng: p.lng,
    photo: p.photo,
    facts: [
      p.beds ? `${p.beds} bd` : '',
      p.baths ? `${p.baths} ba` : '',
      p.sqft ? `${p.sqft.toLocaleString()} sqft` : '',
      p.yearBuilt ? `built ${p.yearBuilt}` : '',
    ].filter(Boolean),
    valueNow: p.valueNow,
    valueLo: Math.min(...vals),
    valueHi: Math.max(...vals),
    gain: topGain(p),
    product: best?.product ?? 'Renovate to Sell',
    sample: false,
  }
}

function hash(s: string) {
  let h = 2166136261
  for (const c of s.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

/** No geocoder in the prototype: place the address near the office and estimate from its text. */
export function lookupAddress(address: string): Lookup {
  const h = hash(address)
  const valueNow = 850_000 + (h % 1100) * 1000
  const gain = 40_000 + ((h >>> 11) % 140) * 1000
  const [street, city] = address.split(',').map((s) => s.trim())
  return {
    key: `q-${h}`,
    address: street,
    city: city || 'Pasadena',
    lat: AGENT.office.lat + (((h >>> 3) % 1000) / 1000 - 0.5) * 0.07,
    lng: AGENT.office.lng + (((h >>> 13) % 1000) / 1000 - 0.5) * 0.11,
    facts: [],
    valueNow,
    valueLo: Math.round((valueNow * 0.94) / 5000) * 5000,
    valueHi: Math.round((valueNow * 1.06) / 5000) * 5000,
    gain,
    product: PRODUCTS[h % PRODUCTS.length],
    sample: true,
  }
}

/** Address search over every home Revive knows in the agent's market (no names: those come with the CRM). */
export function searchAddresses(q: string) {
  const term = q.trim().toLowerCase()
  if (!term) return []
  return properties
    .filter((p) => p.minTier === 'new' && p.source !== 'revive')
    .filter((p) => `${p.address} ${p.city}`.toLowerCase().includes(term))
    .slice(0, 5)
}

export const looksLikeAddress = (q: string) => /^\d+\s+[a-z]/i.test(q.trim())
