import type { Person, Property, Urgency } from '@/data/types'
import { money } from './format'

// "Who to call" scoring, ported from the Contacts page (reference/Your_Contacts.html, urgency())
// and extended to the agent's own listings, lead-form leads and Revive referrals.
// Each trigger adds points and says itself in plain words, so a card can always answer "why now?".

export interface Trigger {
  label: string
  points: number
}

export interface UrgencyResult {
  urgency: Urgency
  score: number // used for ranking; referrals inside their window always sort first
  triggers: Trigger[] // highest points first
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

export const URGENCY_SHORT: Record<Urgency, string> = {
  now: 'This week',
  soon: 'This month',
  keep: 'Keep warm',
  verify: 'Verify',
  hold: 'Hands off',
}

export const URGENCY_ORDER: Urgency[] = ['now', 'soon', 'keep', 'verify', 'hold']

const SOURCE_DISAGREEMENT = 0.15 // sources more than 15% apart = "verify first"
const LIKELY = 80

export function agoD(d: number) {
  return d < 14 ? `${d} days` : d < 60 ? `${Math.round(d / 7)} weeks` : `${Math.round(d / 30)} mo`
}

export function topGain(p: Property) {
  return Math.max(0, ...p.scenarios.map((s) => s.gain ?? 0))
}

export function sourcesDisagree(p: Property) {
  if (p.facts.valueSourcesDisagree !== undefined) return p.facts.valueSourcesDisagree
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
  add(f.expiredDaysAgo !== undefined && f.expiredDaysAgo <= 60, `Listing expired ${f.expiredDaysAgo} days ago`, 40)
  add(f.repliedUnansweredDays !== undefined && f.repliedUnansweredDays <= 60, `Replied ${agoD(f.repliedUnansweredDays ?? 0)} ago, waiting on you`, 30)
  const sell = person?.sellScore ?? 0
  add(sell >= LIKELY, 'Likely seller', 30)
  add(sell >= 70 && sell < LIKELY, 'Leaning toward selling', 15)
  add(f.withdrawnDaysAgo !== undefined && f.withdrawnDaysAgo <= 180, `Withdrawn ${agoD(f.withdrawnDaysAgo ?? 0)} ago`, 25)
  const close = person?.relationship === 'Past client' || person?.relationship === 'Sphere'
  const quiet = person?.lastTouchDays != null && person.lastTouchDays >= 90
  add(quiet && close, `${person?.relationship}, no contact in ${agoD(person?.lastTouchDays ?? 0)}`, 25)
  add(quiet && !close, `No contact in ${agoD(person?.lastTouchDays ?? 0)}`, 10)
  const gain = topGain(p)
  add(gain >= 100_000, `+${money(gain)} potential`, 15)
  add((f.yearsOwned ?? 0) >= 15, `Owned ${f.yearsOwned} yrs`, 10)

  // New for the prototype: own listings, referrals, Revive AI signals
  add(p.source === 'listings' && (f.daysOnMarket ?? 0) >= 30, `Your listing, ${f.daysOnMarket} days on market`, 30)
  add(p.source === 'listings' && f.priceCutDaysAgo !== undefined && f.priceCutDaysAgo <= 7, 'Your listing, price cut this week', 30)
  add(ctx.unclaimedReferral, 'Revive referral, exclusive to you right now', 60)
  // fresh lead activity is the clearest sign to call now, so it alone is enough for High
  add(f.reportOpenedDaysAgo !== undefined && f.reportOpenedDaysAgo <= 7, 'Opened the report you shared', 50)
  add(f.leadFormDaysAgo !== undefined && f.leadFormDaysAgo <= 7, 'Ran a report on your lead form', 50)
  const reopened = person?.history?.find((h) => h.kind === 'email' && h.daysAgo <= 14 && h.tag && /twice|\d+ times/.test(h.tag))
  const times = /(\d+) times/.exec(reopened?.tag ?? '')?.[1]
  add(!!reopened, `Opened your email ${times ? `${times} times` : 'twice'} in the last 2 weeks`, 15)

  triggers.sort((a, b) => b.points - a.points)
  const raw = triggers.reduce((s, t) => s + t.points, 0)
  const score = raw + (ctx.unclaimedReferral ? 1000 : 0)

  // Hard stops first
  if (f.otherBrokerage) {
    const why = f.underContract ? 'Under contract with another agent' : 'Listed with another agent'
    return { urgency: 'hold', score: -1, triggers: [], note: `${why}. Hands off (NAR Standard of Practice 16-4).` }
  }
  if (sourcesDisagree(p)) {
    return { urgency: 'verify', score: -0.5, triggers: [], note: 'Value sources disagree, check before calling.' }
  }

  let urgency: Urgency = raw >= 50 ? 'now' : raw >= 30 ? 'soon' : 'keep'
  let note: string | undefined
  // you just reached out: this week's job is done, it stays on the radar
  if (urgency === 'now' && person?.lastTouchDays != null && person.lastTouchDays <= 2 && !ctx.unclaimedReferral) {
    urgency = 'soon'
    note = 'Reached out just now, follow up next week.'
  }
  if (urgency === 'keep' && f.boughtDaysAgo !== undefined) note = 'Just bought, a good time for a congrats note.'
  return { urgency, score, triggers, note }
}
