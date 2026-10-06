import type { Person, Property, Urgency } from '@/data/types'

// "Who to call" scoring, ported from the Contacts page (Your_Contacts.html) and
// extended to the agent's own listings, lead-form leads and Revive referrals.

export interface Trigger {
  label: string
  points: number
}

export interface UrgencyResult {
  urgency: Urgency
  score: number // used for ranking; referrals inside their window always sort first
  triggers: Trigger[]
  note?: string // explains a hard stop or a downgrade
}

export interface UrgencyContext {
  unclaimedReferral?: boolean // Revive referral, unclaimed, inside exclusivity window
}

export const URGENCY_LABEL: Record<Urgency, string> = {
  now: 'Call this week',
  soon: 'Reach out this month',
  keep: 'Keep warm',
  verify: 'Verify first',
  hold: 'Hands off',
}

export const URGENCY_ORDER: Urgency[] = ['now', 'soon', 'keep', 'verify', 'hold']

const SOURCE_DISAGREEMENT = 0.15 // sources more than 15% apart = "verify first"

export function topGain(p: Property) {
  return Math.max(0, ...p.scenarios.map((s) => s.gain ?? 0))
}

export function sourcesDisagree(p: Property) {
  const vals = p.valueSources?.map((s) => s.value) ?? []
  if (vals.length < 2) return false
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  return (max - min) / min > SOURCE_DISAGREEMENT
}

export function scoreOpportunity(p: Property, person: Person | undefined, ctx: UrgencyContext = {}): UrgencyResult {
  const f = p.facts
  const triggers: Trigger[] = []
  const add = (cond: boolean | undefined, label: string, points: number) => {
    if (cond) triggers.push({ label, points })
  }

  // Contacts-page triggers
  add(f.expiredDaysAgo !== undefined && f.expiredDaysAgo <= 60, 'Listing expired in the last 60 days', 40)
  add(f.repliedUnansweredDays !== undefined && f.repliedUnansweredDays <= 60, 'They replied and you haven’t', 30)
  const sell = person?.sellScore ?? 0
  add(sell >= 80, 'Likely seller', 30)
  add(sell >= 70 && sell < 80, 'Leaning toward selling', 15)
  add(f.withdrawnDaysAgo !== undefined && f.withdrawnDaysAgo <= 180, 'Withdrawn in the last 6 months', 25)
  const close = person?.relationship === 'Past client' || person?.relationship === 'Sphere'
  const quiet = person?.lastTouchDays != null && person.lastTouchDays >= 90
  add(quiet && close, 'Past client or sphere, 90+ days no contact', 25)
  add(quiet && !close, '90+ days no contact', 10)
  add(topGain(p) >= 100_000, '$100K+ potential value', 15)
  add((f.yearsOwned ?? 0) >= 15, 'Owned 15+ years', 10)

  // New for the prototype: own listings, referrals, Revive AI signals
  add(p.source === 'listings' && (f.daysOnMarket ?? 0) >= 30, 'Your listing, 30+ days on market', 30)
  add(p.source === 'listings' && f.priceCutDaysAgo !== undefined && f.priceCutDaysAgo <= 7, 'Your listing, price cut in the last 7 days', 30)
  add(ctx.unclaimedReferral, 'Revive referral, exclusive to you right now', 60)
  add(f.reportOpenedDaysAgo !== undefined && f.reportOpenedDaysAgo <= 7, 'Opened the report you shared', 35)
  add(f.leadFormDaysAgo !== undefined && f.leadFormDaysAgo <= 7, 'Ran a report on your lead form', 35)

  triggers.sort((a, b) => b.points - a.points)
  const raw = triggers.reduce((s, t) => s + t.points, 0)
  const score = raw + (ctx.unclaimedReferral ? 1000 : 0)

  // Hard stops first
  if (f.otherBrokerage) {
    return { urgency: 'hold', score: -1, triggers, note: 'Listed with another brokerage. Hands off (NAR Standard of Practice 16-4).' }
  }
  if (sourcesDisagree(p)) {
    return { urgency: 'verify', score: raw, triggers, note: 'Value sources disagree, check before calling.' }
  }

  let urgency: Urgency = raw >= 50 ? 'now' : raw >= 30 ? 'soon' : 'keep'
  let note: string | undefined
  if (urgency === 'now' && person?.lastTouchDays != null && person.lastTouchDays <= 2 && !ctx.unclaimedReferral) {
    urgency = 'soon'
    note = 'Reached out just now, follow up next week.'
  }
  return { urgency, score, triggers, note }
}
