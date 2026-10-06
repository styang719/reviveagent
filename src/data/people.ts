import type { Person } from './types'

export const people: Person[] = [
  {
    id: 'sarah', name: 'Sarah Kim', relationship: 'Sphere', source: 'Your CRM', since: 'In your CRM since 2019',
    lastTouchDays: 120, sellScore: 72, reviveScore: 88,
    notes: [
      { text: 'Kids leaving for college next fall. Thinking about what to do with the house.', date: 'Jun 8' },
      { text: 'Met at the Linda Vista block party. Loves the neighborhood.', date: 'Mar 2023' },
    ],
    activity: [],
  },
  {
    id: 'mark', name: 'Mark Diaz', relationship: 'Homeowner', source: 'Your lead form', since: 'New lead · Oct 4',
    lastTouchDays: null, sellScore: 74, reviveScore: 81,
    notes: [],
    activity: ['Ran a Revive AI report on 412 Oak Ave through your lead form · Oct 4', 'Viewed the ADU section 3× · Oct 4–5'],
  },
  {
    id: 'david', name: 'David Park', relationship: 'Seller client', source: 'Your CRM', since: 'Seller client since Aug 2026',
    lastTouchDays: 3, reviveScore: 64,
    notes: [{ text: 'Open to price reductions but wants to net at least $1.1M.', date: 'Sep 19' }],
    activity: [],
  },
  {
    id: 'ana', name: 'Ana Lopez', relationship: 'Seller client', source: 'Your CRM', since: 'Seller client since Sep 2026',
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
    id: 'olivia', name: 'Olivia Chen', relationship: 'Seller client', source: 'Your CRM', since: 'Seller client since Jul 2026',
    lastTouchDays: 1, reviveScore: 90,
    notes: [{ text: 'Prefers texts. Wants the house listed before the holidays.', date: 'Aug 30' }],
    activity: ['Started a Renovate to Sell project with Revive · Aug 28'],
  },
  {
    id: 'hale', name: 'Robert and Joan Hale', relationship: 'Past client', source: 'Your CRM', since: 'Bought with you in 2017',
    lastTouchDays: 210, sellScore: 41, reviveScore: 62,
    notes: [{ text: 'Grandkids visit every summer. Might want more space.', date: 'Mar 2026' }],
    activity: [],
  },
  {
    id: 'priya', name: 'Priya Shah', relationship: 'Sphere', source: 'Your CRM', since: 'In your CRM since 2021',
    lastTouchDays: 40, sellScore: 38, reviveScore: 79,
    notes: [{ text: 'Mother may move in. Asked about ADU rules in Altadena.', date: 'Aug 27' }],
    activity: [],
  },
  {
    id: 'kevin', name: "Kevin O'Brien", relationship: 'Homeowner', source: 'Your CRM', since: 'In your CRM since 2022',
    lastTouchDays: 75, sellScore: 55, reviveScore: 44,
    notes: [],
    activity: [],
  },
  {
    id: 'helen', name: 'Helen Park', relationship: 'Past client', source: 'Your CRM', since: 'Listed with you in 2026',
    lastTouchDays: 50, sellScore: 90, reviveScore: 70,
    notes: [{ text: 'Listing expired Aug 22. Went with another brokerage.', date: 'Sep 28' }],
    activity: [],
  },
  {
    id: 'james', name: 'James Whitfield', relationship: 'Homeowner', source: 'Your CRM', since: 'In your CRM since 2024',
    lastTouchDays: 60, sellScore: 62, reviveScore: 55,
    notes: [{ text: 'Withdrew listing in June, wants to wait for rates.', date: 'Jun 4' }],
    activity: [],
  },
  {
    id: 'carlos', name: 'Carlos Ruiz', relationship: 'Homeowner', source: 'Your CRM', since: 'In your CRM since 2023',
    lastTouchDays: 95, sellScore: 30, reviveScore: 68,
    notes: [],
    activity: [],
  },
  {
    id: 'mei', name: 'Mei Lin', relationship: 'Sphere', source: 'Your CRM', since: 'In your CRM since 2020',
    lastTouchDays: 30, sellScore: 65, reviveScore: 40,
    notes: [{ text: 'Thinking about downsizing in a couple of years.', date: 'Sep 6' }],
    activity: [],
  },
  {
    id: 'nora', name: 'Nora Feld', relationship: 'Homeowner', source: 'Your lead form', since: 'Lead since Aug 2026',
    lastTouchDays: 35, sellScore: 52, reviveScore: 57,
    notes: [],
    activity: ['Ran a Revive AI report through your lead form · Aug 26'],
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
