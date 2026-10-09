import { contactPeople } from './contacts'
import type { Person } from './types'

const briefPeople: Person[] = [
  {
    id: 'mark', name: 'Mark Diaz', relationship: 'Homeowner', source: 'Your lead form', since: 'New lead · Oct 4',
    lastTouchDays: null, sellScore: 74, reviveScore: 81,
    notes: [],
    activity: ['Ran a Revive AI report on 412 Oak Ave through your lead form · Oct 4', 'Viewed the ADU section 3× · Oct 4–5'],
  },
  {
    id: 'david', name: 'David Park', relationship: 'Seller client', source: 'Your listing · MLS', since: 'Seller client since Aug 2026',
    lastTouchDays: 3, reviveScore: 64,
    notes: [{ text: 'Open to price reductions but wants to net at least $1.1M.', date: 'Sep 19' }],
    activity: [],
  },
  {
    id: 'ana', name: 'Ana Lopez', relationship: 'Seller client', source: 'Your listing · MLS', since: 'Seller client since Sep 2026',
    lastTouchDays: 6, reviveScore: 58,
    notes: [{ text: 'Relocating to Denver in January. Flexible on timing.', date: 'Sep 10' }],
    activity: [],
  },
  {
    id: 'linda', name: 'Linda Moreno', relationship: 'Revive referral', source: 'Revive referral', since: 'Referred by Revive · today',
    lastTouchDays: null, sellScore: 88, reviveScore: 76,
    notes: [],
    activity: ['Ran a Revive AI report on revive.com · Oct 6', 'Asked Revive to connect her with a local agent · Oct 6'],
  },
  {
    id: 'olivia', name: 'Olivia Chen', relationship: 'Seller client', source: 'Your listing · MLS', since: 'Seller client since Jul 2026',
    lastTouchDays: 1, reviveScore: 90,
    notes: [{ text: 'Prefers texts. Wants the house listed before the holidays.', date: 'Aug 30' }],
    activity: ['Started a Renovate to Sell project with Revive · Aug 28'],
  },
  {
    id: 'james', name: 'James Whitfield', relationship: 'Homeowner', source: 'Your contact', since: 'Contact since 2021',
    lastTouchDays: 2, reviveScore: 84,
    notes: [{ text: 'Wants to sell next spring, after a kitchen and bath refresh.', date: 'Oct 1' }],
    activity: ['Submitted a Renovate to Sell project with Revive · Oct 6'],
  },
  {
    id: 'tom', name: 'Tom Becker', relationship: 'Revive referral', source: 'Revive referral', since: 'Referred by Revive · Sep 29',
    lastTouchDays: 7, reviveScore: 66,
    notes: [{ text: 'Wants to sell in spring. Call back mid-October.', date: 'Sep 30' }],
    activity: ['Referral claimed · Sep 29'],
  },
  {
    id: 'grace', name: 'Grace Nguyen', relationship: 'Revive referral', source: 'Revive referral', since: 'Referred by Revive · Sep 12',
    lastTouchDays: 4, reviveScore: 72,
    notes: [{ text: 'Listing appointment Oct 2. Comparing two agents.', date: 'Sep 26' }],
    activity: ['Referral claimed · Sep 12'],
  },
]

export const people: Person[] = [...briefPeople, ...contactPeople]
