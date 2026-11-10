import { profitOf, type Listing } from './data'

// What the filter sheet controls. Plain listings stay on by default: sparse opportunities need the market around them.

export interface Filters {
  show: 'all' | 'revive'
  potential: boolean
  maxPrice: number | null
  minBeds: number
  minProfit: number
  singleFamily: boolean
}
export const DEFAULT_FILTERS: Filters = { show: 'all', potential: true, maxPrice: null, minBeds: 0, minProfit: 0, singleFamily: false }

export const activeFilters = (f: Filters) =>
  (f.show !== 'all' ? 1 : 0) + (!f.potential ? 1 : 0) + (f.maxPrice ? 1 : 0) + (f.minBeds ? 1 : 0) + (f.minProfit ? 1 : 0) + (f.singleFamily ? 1 : 0)

export function passes(l: Listing, f: Filters) {
  if (f.show === 'revive' && l.tier === 'standard') return false
  if (!f.potential && l.tier === 'potential') return false
  if (f.maxPrice && l.price > f.maxPrice) return false
  if (f.minBeds && l.beds < f.minBeds) return false
  if (f.singleFamily && l.type !== 'Single family') return false
  // a profit floor applies to Revive's homes only; plain listings stay as context
  if (f.minProfit && l.tier !== 'standard' && profitOf(l) < f.minProfit) return false
  return true
}
