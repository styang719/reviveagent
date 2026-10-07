import { properties } from '@/data/properties'
import type { Property, Scenario } from '@/data/types'
import { allPhotoKeys, photoUrl } from './assets'

// Guided Revive AI flows: "Generate a Revive AI report" and "Start a project".
// The conversation collects what Revive needs; the result is saved and lives on the
// property's page (one page per home: Overview, Revive AI report, Project, Marketing).

export type FlowKind = 'report' | 'project'
export type Handoff = 'link' | 'panel' | 'dock'

export const SELLING = ['Yes, in the next 6 months', 'Maybe in a year or two', 'No, they plan to stay', 'Not sure yet'] as const
export const GOALS = ['Top sale price', 'Sell fast', 'Stay and improve', 'Add rental income (ADU)'] as const
export const TIMELINES = ['As soon as possible', 'In 1–3 months', 'In 3–6 months'] as const
export const OCCUPANCY = ['Owner lives there', 'Vacant', 'Tenant-occupied'] as const
export const PRODUCTS = [
  { name: 'Renovate to Sell', body: 'Revive renovates before listing and is repaid at closing.' },
  { name: 'Renovate to Stay', body: 'Upgrades for owners who are staying, with flexible payment.' },
  { name: 'Sell 360', body: 'Light prep and staging so the home lists in weeks.' },
  { name: 'Flip 360', body: 'Revive buys, renovates and resells; the owner shares the upside.' },
] as const

export interface ReportDraft {
  propertyId?: string // set when the address is a home Revive already knows
  address: string
  city: string
  homeType: Property['homeType']
  beds?: number
  baths?: number
  sqft?: number
  yearBuilt?: number
  lot?: number
  photos: string[] // urls (bundled MLS photos or the agent's uploads)
  selling?: string
  goal?: string
}

export interface GeneratedReport extends ReportDraft {
  id: string
  createdAt: number
  valueNow: number
  valueLo: number
  valueHi: number
  scenarios: Scenario[]
}

export interface ProjectDraft {
  propertyId: string // a known property id or a generated report id
  address: string
  city: string
  product?: string
  timeline?: string
  occupancy?: string
  homeowner?: string
}

export interface CreatedProject extends Required<Omit<ProjectDraft, 'homeowner'>> {
  id: string
  homeowner?: string
  createdAt: number
}

export function hash(s: string) {
  let h = 2166136261
  for (const c of s.toLowerCase()) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

/** A home Revive already has on record, matched loosely by street address. */
export function matchProperty(text: string): Property | undefined {
  const t = norm(text)
  return properties.find((p) => {
    const a = norm(p.address)
    const [num, word] = a.split(' ')
    return t.includes(a) || (!!num && !!word && t.includes(`${num} ${word}`))
  })
}

export const reportIdFor = (address: string, propertyId?: string) => propertyId ?? `r-${hash(address).toString(36)}`

/** Start a report draft from what the agent typed: a known home, or public-record style sample facts. */
export function draftFromAddress(text: string): ReportDraft {
  const p = matchProperty(text)
  if (p) {
    return {
      propertyId: p.id,
      address: p.address,
      city: p.city,
      homeType: p.homeType,
      beds: p.beds,
      baths: p.baths,
      sqft: p.sqft,
      yearBuilt: p.yearBuilt || undefined,
      lot: p.lot,
      photos: mlsPhotos(p.address, p.photo),
    }
  }
  const h = hash(text)
  const [street, city] = text.split(',').map((x) => x.trim())
  return {
    address: street,
    city: city || 'Pasadena',
    homeType: 'Single family',
    beds: 2 + (h % 3),
    baths: 1 + ((h >>> 3) % 3),
    sqft: 1300 + ((h >>> 5) % 1500),
    yearBuilt: 1925 + ((h >>> 9) % 70),
    lot: 5500 + ((h >>> 13) % 6000),
    photos: mlsPhotos(text),
  }
}

/** "MLS photos" for the prototype: a few from the bundled photo set, the home's own first. */
export function mlsPhotos(seed: string, own?: string): string[] {
  const keys = allPhotoKeys()
  const h = hash(seed)
  const picks = new Set<string>(own ? [own] : [])
  for (let i = 0; picks.size < 5 && i < 40; i++) picks.add(keys[(h + i * 7) % keys.length])
  return [...picks].map((k) => photoUrl(k)!).filter(Boolean)
}

/** Turn the confirmed draft into a report. Known homes keep their record's numbers. */
export function buildReport(d: ReportDraft): GeneratedReport {
  const id = reportIdFor(`${d.address}, ${d.city}`, d.propertyId)
  const p = d.propertyId ? properties.find((x) => x.id === d.propertyId) : undefined
  if (p) {
    const vals = p.valueSources?.map((s) => s.value) ?? [p.valueNow]
    return { ...d, id, createdAt: Date.now(), valueNow: p.valueNow, valueLo: Math.min(...vals), valueHi: Math.max(...vals), scenarios: p.scenarios }
  }
  const h = hash(d.address)
  const valueNow = Math.round((520 * (d.sqft ?? 1600) + (h % 200) * 1000) / 5000) * 5000
  const g = (base: number, spread: number, shift: number) => Math.round((base + ((h >>> shift) % spread) * 1000) / 1000) * 1000
  const aduOk = d.homeType === 'Single family' && (d.lot ?? 0) - (d.sqft ?? 0) >= 6000
  const scenarios: Scenario[] = [
    { product: 'Renovate to Sell', note: 'Kitchen, baths, floors and paint before listing', gain: g(60_000, 120, 4) },
    { product: 'Renovate to Stay', note: 'Kitchen and primary bath for owners staying put', gain: g(35_000, 80, 7) },
    { product: 'Sell 360', note: 'Staging and light prep; list in about 3 weeks', gain: g(20_000, 40, 10) },
    aduOk
      ? { product: 'Renovate to Stay + ADU', note: 'Detached 1-bed ADU in the back yard', gain: g(90_000, 100, 12) }
      : { product: 'Renovate to Stay + ADU', note: 'Not eligible: the lot is too small for a detached ADU', gain: null },
  ]
  return { ...d, id, createdAt: Date.now(), valueNow, valueLo: Math.round((valueNow * 0.95) / 5000) * 5000, valueHi: Math.round((valueNow * 1.05) / 5000) * 5000, scenarios }
}

/** Which product to suggest, from the report and what the client wants. */
export function recommendProduct(report?: GeneratedReport, goal?: string): string {
  if (goal === 'Sell fast') return 'Sell 360'
  if (goal === 'Stay and improve' || goal === 'Add rental income (ADU)') return 'Renovate to Stay'
  if (goal === 'Top sale price') return 'Renovate to Sell'
  const best = report ? [...report.scenarios].sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))[0] : undefined
  return best?.product.startsWith('Renovate to Stay') ? 'Renovate to Stay' : best?.product ?? 'Renovate to Sell'
}

export const PROJECT_STEPS = ['Project submitted', 'Revive review (within 48 hrs)', 'Offer terms', 'Letter of intent', 'Work begins', 'Listed or complete']
