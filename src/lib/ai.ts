import { people } from '@/data/people'
import { properties } from '@/data/properties'
import { AGENT } from '@/data/tiers'
import type { Person, Property } from '@/data/types'
import { firstName, gain, money } from './format'
import { isActionable, type Opportunity } from './opportunities'
import { topGain } from './urgency'

// Revive AI for the prototype: answers built from the sample data, no model behind it.
// It recognises an address, a person, or a "who should I call" question, and answers with
// cards the agent can act on. Anything else gets suggestions.

export type Block =
  | { kind: 'text'; text: string }
  | {
      kind: 'property'
      propertyId?: string
      address: string
      city: string
      photo?: string
      facts: string[]
      valueNow: number
      valueLo: number
      valueHi: number
      gain: number
      product: string
      sample: boolean
    }
  | { kind: 'opps'; ids: string[] }
  | { kind: 'draft'; to: string; personId: string; body: string }
  | { kind: 'connect'; need: 'crm' | 'mls' }
  | { kind: 'suggestions'; items: string[] }
  | { kind: 'flow'; step: FlowStep; refId?: string } // an interactive step in a guided flow

export type FlowStep =
  | 'report-details'
  | 'report-photos'
  | 'report-questions'
  | 'home-intent'
  | 'rv-source'
  | 'rv-photos'
  | 'rv-style'
  | 'rv-progress'
  | 'rv-ready'
  | 'rv-share'
  | 'report-progress'
  | 'report-ready'
  | 'project-property'
  | 'project-product'
  | 'project-details'
  | 'project-review'
  | 'project-progress'
  | 'project-ready'

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text?: string
  blocks?: Block[]
  answered?: boolean // a flow step the agent already completed (shown read-only)
}

export const STARTERS = [
  'What could 1847 Las Lunas St be worth after a renovation?',
  'Who in my book is most likely to sell?',
  'Does 412 Oak Ave have room for an ADU?',
  'Draft a note to Maya about her home’s value',
]

/** The property page the agent is on, so "what's it worth?" or "draft a note" mean this home. */
export interface HereCtx {
  property?: Property // set when the home is in the sample data
  person?: Person // its owner, when visible
  address: string // "33 Fair Oaks Ave, Pasadena"
  block: Extract<Block, { kind: 'property' }>
  scenarios: { product: string; note: string; gain: number | null }[]
}

interface Ctx {
  opps: Opportunity[] // what this agent can see (tier + connections)
  crm: boolean
  here?: HereCtx
}

const STREET = /\b\d+\s+[a-z][a-z ]*?\b(st|street|ave|avenue|blvd|dr|drive|rd|road|ln|lane|ct|court|pl|place|way)\b\.?/i

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()

function findProperty(q: string): Property | undefined {
  const t = norm(q)
  return properties.find((p) => {
    const a = norm(p.address)
    const [num, word] = a.split(' ')
    return t.includes(a) || (num && word && t.includes(`${num} ${word}`))
  })
}

function findPerson(q: string, visible: Person[]): Person | undefined {
  const t = ` ${norm(q)} `
  return visible.find((p) => t.includes(` ${norm(p.name)} `) || t.includes(` ${norm(firstName(p.name))} `))
}

function aduFit(p: Property) {
  if (p.homeType !== 'Single family') return `No. It’s a ${p.homeType.toLowerCase()}, so it can’t take a detached ADU.`
  if (!p.lot) return 'I don’t have the lot size on record, so I can’t say yet.'
  const spare = p.lot - p.sqft
  return spare >= 6000
    ? `Likely yes. The lot is ${p.lot.toLocaleString()} sqft with about ${spare.toLocaleString()} sqft beyond the house, enough for a detached ADU.`
    : `Probably not. The lot leaves about ${spare.toLocaleString()} sqft beyond the house; a detached ADU usually needs 6,000+.`
}

function propertyBlock(p: Property): Block {
  const vals = p.valueSources?.map((s) => s.value) ?? [p.valueNow]
  const best = [...p.scenarios].sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))[0]
  return {
    kind: 'property',
    propertyId: p.id,
    address: p.address,
    city: p.city,
    photo: p.photo,
    facts: [p.beds && `${p.beds} bd`, p.baths && `${p.baths} ba`, p.sqft && `${p.sqft.toLocaleString()} sqft`, p.yearBuilt && `built ${p.yearBuilt}`].filter(Boolean) as string[],
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

/** An address that isn't in the sample data: a clearly labelled sample estimate. */
function sampleBlock(address: string): Block {
  const h = hash(address)
  const valueNow = 850_000 + (h % 1100) * 1000
  const [street, city] = address.split(',').map((s) => s.trim())
  return {
    kind: 'property',
    address: street,
    city: city || 'Pasadena',
    facts: [],
    valueNow,
    valueLo: Math.round((valueNow * 0.94) / 5000) * 5000,
    valueHi: Math.round((valueNow * 1.06) / 5000) * 5000,
    gain: 40_000 + ((h >>> 11) % 140) * 1000,
    product: ['Renovate to Sell', 'Renovate to Stay', 'Sell 360'][h % 3],
    sample: true,
  }
}

export function answer(q: string, ctx: Ctx): Block[] {
  const t = norm(q)
  const visiblePeople = people.filter((p) => ctx.opps.some((o) => o.person?.id === p.id))
  // on a property page, a question that names no other home or person is about this one
  const named = findPerson(q, visiblePeople)
  const otherHome = findProperty(q) ?? (STREET.test(q) ? 'other' : undefined)
  const here = !named && !otherHome ? ctx.here : undefined
  const person = named ?? here?.person
  const home = findProperty(q) ?? (named ? ctx.opps.find((o) => o.person?.id === named.id)?.property : undefined) ?? here?.property
  const wantsDraft = /\b(draft|write|note|email|text|message)\b/.test(t)


  // "Draft a note to Maya …"
  if (wantsDraft) {
    if (!person && here) {
      return [{ kind: 'text', text: `I don’t know who owns ${here.address.split(',')[0]} yet. Tell me their name, like “Draft a note to Alex Rivera about this home”, or connect your CRM so I can find them.` }]
    }
    if (!person) {
      if (!ctx.crm) return [{ kind: 'text', text: 'I can draft notes to your contacts once your CRM is connected.' }, { kind: 'connect', need: 'crm' }]
      return [{ kind: 'text', text: 'Who should it go to? Name someone in your book, like “Draft a note to Natalie”.' }]
    }
    const p = home
    const first = firstName(person.name)
    const body = p
      ? `Hi ${first},\n\nI ran a quick Revive AI report on ${p.address}. Homes like yours nearby are selling for more after a few targeted updates, about ${gain(topGain(p))} by Revive’s estimate, and Revive covers the work until closing.\n\nWant me to send you the full report? Happy to walk through it.\n\n${AGENT.firstName}`
      : `Hi ${first},\n\nIt’s been a while! I’ve been tracking what homes near you are selling for and thought you’d want to know. Want me to send a quick update?\n\n${AGENT.firstName}`
    return [{ kind: 'text', text: `Here’s a note to ${person.name}. Edit it, then send it from your CRM.` }, { kind: 'draft', to: person.name, personId: person.id, body }]
  }

  // "Who should I call / who's likely to sell"
  if (/(likely to sell|who should i call|who to call|worth a call|opportunit|my book)/.test(t)) {
    const top = ctx.opps.filter((o) => isActionable(o) && o.referral?.status !== 'new').slice(0, 3)
    if (!top.length) {
      return [
        { kind: 'text', text: 'I can’t see your book yet. Connect your CRM and add your license number, and I’ll rank everyone by who to call first.' },
        { kind: 'connect', need: 'crm' },
      ]
    }
    return [{ kind: 'text', text: `These ${top.length} are worth a call this week, ranked by timing and what Revive can add:` }, { kind: 'opps', ids: top.map((o) => o.id) }]
  }

  // An address or a person in the book
  if (home) {
    const ranked = home.scenarios.filter((x) => x.gain).sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))
    if (/compar|scenario|option|which product|best product/.test(t) && ranked.length) {
      return [
        { kind: 'text', text: `Revive’s scenarios for ${home.address}, best first:` },
        { kind: 'text', text: ranked.map((x) => `• ${x.product}: ${gain(x.gain!)} — ${x.note}`).join('\n') },
      ]
    }
    const blocks: Block[] = []
    if (/\badu\b|granny|second unit|back ?house/.test(t)) blocks.push({ kind: 'text', text: aduFit(home) })
    else blocks.push({ kind: 'text', text: `Here’s what Revive sees at ${home.address}.` })
    blocks.push(propertyBlock(home))
    const o = ctx.opps.find((x) => x.id === home.id)
    if (o?.person) blocks.push({ kind: 'text', text: `${o.person.name} owns it (${o.person.relationship.toLowerCase()}). ${o.reasons[0] ? `Why now: ${o.reasons[0].toLowerCase()}.` : ''}` })
    else if ((home.source === 'contacts' || home.source === 'leadform') && !ctx.crm) {
      blocks.push({ kind: 'text', text: 'This home is in your CRM. Connect it to see the owner and your history with them.' })
      blocks.push({ kind: 'connect', need: 'crm' })
    }
    return blocks
  }

  // This page's home, when it isn't in the sample data (a report generated in Revive AI)
  if (here) {
    const ranked = [...here.scenarios].filter((x) => x.gain).sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0))
    const street = here.address.split(',')[0]
    if (/\badu\b|granny|second unit|back ?house/.test(t)) {
      const adu = ranked.find((x) => /adu/i.test(x.product))
      return [
        {
          kind: 'text',
          text: adu
            ? `Likely yes. The report has an ADU scenario for ${street}: ${adu.product} adds about ${gain(adu.gain!)} (${adu.note.toLowerCase()}).`
            : `The report doesn’t include an ADU scenario for ${street}. That usually means the lot is too tight; I’d confirm with the city before promising one.`,
        },
      ]
    }
    if (/compar|scenario|option|product|which|best/.test(t) && ranked.length) {
      return [
        { kind: 'text', text: `Revive’s scenarios for ${street}, best first:` },
        { kind: 'text', text: ranked.map((x) => `• ${x.product}: ${gain(x.gain!)} — ${x.note}`).join('\n') },
      ]
    }
    return [{ kind: 'text', text: `Here’s what Revive sees at ${street}.` }, here.block]
  }

  // An address we don't have: sample estimate
  const street = STREET.exec(q)
  if (street) {
    // a city only if it follows a comma and is capitalised: "…Blvd, Pasadena"
    const city = /^,\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/.exec(q.slice(street.index + street[0].length))
    const address = city ? `${street[0].trim()}, ${city[1]}` : street[0].trim()
    return [{ kind: 'text', text: `I don’t have ${address} on record, so here’s a quick estimate. Open the full report for comps and scenarios.` }, sampleBlock(address)]
  }

  return [
    { kind: 'text', text: 'I can tell you what any home is worth today, what a renovation could add, who in your book to call, and draft the note. Try one of these:' },
    { kind: 'suggestions', items: STARTERS },
  ]
}

export const describeGain = (b: { valueNow: number; gain: number }) => `${money(b.valueNow)} today, ${gain(b.gain)} with the right project`

/** Report page for an address that isn't in the agent's book yet. */
export const runAiPath = (address: string) => `/property/new?address=${encodeURIComponent(address)}&tab=report`
