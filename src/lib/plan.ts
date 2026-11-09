import type { Property, Scenario } from '@/data/types'

// Which Revive options a home gets. A home is on one path:
//   sell → Renovate to Sell, or Sell 360 when the owner needs to sell fast (never both)
//   stay → Renovate to Stay
// and, on either path, ADU and Build 360 (a second house on the lot) only when the lot has room for them.
// So a report shows one main option, plus zero, one or two add-ons.

export type PlanKey = 'rts' | 's360' | 'rtstay' | 'adu' | 'build360'
export interface PlanOption {
  key: PlanKey
  name: string
  intro: string
  gain: number
  sqftAdded: number
  note?: string
}
export interface RevivePlan {
  path: 'sell' | 'stay'
  why: string // why this path and main option, in a few words
  primary: PlanOption
  addons: PlanOption[]
  noAddonReason?: string // when no add-on fits: why
}

const AREA_DOM = 27 // average days on market nearby
const ADU_OPEN = 6000 // open lot sq ft a detached ADU needs
const BUILD_OPEN = 12000 // open lot sq ft a second house needs
const round = (n: number) => Math.round(n / 1000) * 1000

export const INTRO: Record<PlanKey, string> = {
  rts: 'Revive renovates the kitchen, baths and finishes before listing, and is repaid at closing.',
  s360: 'Light prep, paint and staging so the home lists in weeks, with no construction.',
  rtstay: 'Upgrades for owners who are staying, with flexible payment.',
  adu: 'A detached unit for rental income or family, paid over time.',
  build360: 'Revive builds a second house on the lot, to sell or rent.',
}
const NAME: Record<PlanKey, string> = { rts: 'Renovate to Sell', s360: 'Sell 360', rtstay: 'Renovate to Stay', adu: 'ADU', build360: 'Build 360' }

/** A detached ADU sized to the open lot: about a tenth of it, between 400 and 1,200 sq ft. */
export const aduSqftFor = (lot: number, sqft: number) => Math.min(1200, Math.max(400, Math.round(((lot - sqft) * 0.1) / 50) * 50))

export interface PlanInput {
  valueNow: number
  sqft?: number
  lot?: number
  homeType?: Property['homeType']
  scenarios: Scenario[]
  source?: Property['source']
  daysOnMarket?: number
  offMarket?: boolean // expired or withdrawn
  sellScore?: number
  selling?: string // from the report questions
  goal?: string
}

export function revivePlan(h: PlanInput): RevivePlan {
  const find = (re: RegExp, not?: RegExp) => h.scenarios.find((s) => re.test(s.product) && !(not && not.test(s.product)) && (s.gain ?? 0) > 0)
  const listed = h.source === 'listings' || h.source === 'market'

  // the path: what the owner said, else what the home tells us
  const stay =
    h.goal === 'Stay and improve' || h.goal === 'Add rental income (ADU)' || h.selling === 'No, they plan to stay'
      ? true
      : listed || h.goal === 'Top sale price' || h.goal === 'Sell fast' || h.selling?.startsWith('Yes')
        ? false
        : h.sellScore !== undefined && h.sellScore < 60
  const fast = h.goal === 'Sell fast' || (listed && !h.offMarket && (h.daysOnMarket ?? 0) > AREA_DOM)

  const rtsGain = find(/^Renovate to Sell/, /ADU/)?.gain ?? find(/^Renovate to Sell/)?.gain ?? round(h.valueNow * 0.08)
  const opt = (key: PlanKey, gain: number, sqftAdded = 0, note?: string): PlanOption => ({ key, name: NAME[key], intro: INTRO[key], gain: round(gain), sqftAdded, note })

  let primary: PlanOption
  let why: string
  if (stay) {
    const s = find(/^Renovate to Stay/, /ADU/)
    primary = opt('rtstay', s?.gain ?? rtsGain * 0.7, 0, s?.note)
    why = h.goal === 'Add rental income (ADU)' ? 'Wants rental income' : h.selling === 'No, they plan to stay' || h.goal ? 'Plans to stay' : 'Not likely to sell soon'
  } else if (fast) {
    const s = find(/^Sell 360/)
    primary = opt('s360', s?.gain ?? rtsGain * 0.45, 0, s?.note ?? 'Staging and light prep, no construction')
    why = h.goal === 'Sell fast' ? 'Wants to sell fast' : `${h.daysOnMarket} days on market, over average`
  } else {
    // an "X + ADU" scenario's note describes the ADU, so only a plain Renovate to Sell note goes here
    const s = find(/^Renovate to Sell/, /ADU/)
    primary = opt('rts', rtsGain, 0, s?.note)
    why = h.goal === 'Top sale price' ? 'Wants the top sale price' : h.offMarket ? 'Off the market, time to renovate' : listed ? 'Newly listed, time to renovate first' : 'Time to renovate first'
  }

  // add-ons: only on a single-family lot with room
  const addons: PlanOption[] = []
  let noAddonReason: string | undefined
  const open = h.lot && h.sqft ? h.lot - h.sqft : 0
  if (h.homeType && h.homeType !== 'Single family') noAddonReason = `ADU and Build 360 need a single-family lot; this is a ${h.homeType.toLowerCase()}.`
  else if (!h.lot || !h.sqft) noAddonReason = 'No lot size on record, so no ADU or Build 360 estimate yet.'
  else {
    if (open >= ADU_OPEN) {
      const sq = aduSqftFor(h.lot, h.sqft)
      const withAdu = find(/ADU/)
      // an "X + ADU" scenario's extra over the base option is the ADU's share
      const g = withAdu?.gain ? Math.max(withAdu.gain - primary.gain, Math.round(sq * 250)) : sq * 300
      addons.push(opt('adu', g, sq, `${sq.toLocaleString()} sq ft detached unit`))
    }
    if (open >= BUILD_OPEN) {
      const sq = Math.min(2000, Math.max(1200, Math.round((open * 0.12) / 50) * 50))
      addons.push(opt('build360', h.valueNow * 0.35, sq, `${sq.toLocaleString()} sq ft second home`))
    }
    if (!addons.length) noAddonReason = `${open.toLocaleString()} sq ft of open lot: not enough room for an ADU or a second home.`
  }
  return { path: stay ? 'stay' : 'sell', why, primary, addons, noAddonReason }
}

/** The plan for an opportunity (no report answers: the path comes from the listing or the selling score). */
export function planForProperty(p: Property, sellScore?: number): RevivePlan {
  return revivePlan({ valueNow: p.valueNow, sqft: p.sqft, lot: p.lot, homeType: p.homeType, scenarios: p.scenarios, source: p.source, daysOnMarket: p.facts.daysOnMarket, offMarket: p.facts.expiredDaysAgo !== undefined || p.facts.withdrawnDaysAgo !== undefined, sellScore })
}
