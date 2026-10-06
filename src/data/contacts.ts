import raw from './generated/contacts.json'
import type { CrmEvent, Person, Property } from './types'

// Michelle's CRM (Follow Up Boss), imported from the built Contacts page by scripts/import-contacts.mjs.
// Same records, history and valuation fields that page ranks.

interface RawComp { addr: string; sqft: number; ppsf: number; price: number; dist: number; mo: number; feat: string[]; photo: string | null }
interface RawContact {
  id: number; contact: string; lat: number; lng: number; lot: number | null; address: string; city: string; state: string; zip: string
  year_built: number | null; sqft: number; beds: number | null; baths: number | null; ptype: string
  avm: number; attom_avm: number | null; rel: string; sell: number; revive: number; touch: number; touchVia: string | null
  opp: string; sig: string; sources: { n: string; v: number }[]; cv: number; pv: number; st: string; stSub: string
  evt?: { k: string; d: number } | null; iHead?: string; iBody?: string; iProduct?: string; photo: string
  dr: { head: string; why: string; ppsf?: number; compsFound?: number; compsUsed?: number; comps: RawComp[] } | null
  hist: { t: CrmEvent['kind']; d: number; when?: string; h: string; b?: string; tag?: string; in?: boolean }[]
}

const decode = (s: string) => s.replace(/&middot;/g, '·').replace(/&amp;/g, '&').replace(/&rsquo;/g, '’').replace(/&mdash;/g, '—')
const street = (r: RawContact) => r.address.replace(` ${r.city} ${r.state} ${r.zip}`, '')
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const agoLabel = (d: number) => (d < 14 ? `${d} days ago` : d < 60 ? `${Math.round(d / 7)} weeks ago` : d < 730 ? `${Math.round(d / 30)} mo ago` : `${Math.round(d / 365)} yrs ago`)

const HOME_TYPE: Record<string, Property['homeType']> = {
  'Single Family Residential': 'Single family',
  Condominium: 'Condo',
  'Multi-Family': 'Multi-family',
}
const PRODUCTS = ['Renovate to Sell', 'Renovate to Stay', 'Sell 360', 'Flip 360']

const records = raw as unknown as RawContact[]

export const contactPeople: Person[] = records.map((r) => {
  const hist: CrmEvent[] = r.hist.map((h) => ({ kind: h.t, daysAgo: h.d, when: h.when, title: h.h, body: h.b || undefined, tag: h.tag, inbound: h.in }))
  const added = hist.find((h) => h.kind === 'crm')
  return {
    id: `p${r.id}`,
    name: r.contact,
    relationship: (['Past client', 'Sphere', 'Homeowner'].includes(r.rel) ? r.rel : 'Homeowner') as Person['relationship'],
    source: 'Your CRM',
    since: added ? `${added.title} · ${added.when ?? agoLabel(added.daysAgo)}` : 'In your CRM',
    lastTouchDays: r.touch,
    touchVia: r.touchVia ?? undefined,
    phone: `(818) 555-01${String(10 + ((r.id - 100) % 80)).padStart(2, '0')}`,
    notes: hist.filter((h) => h.kind === 'note').map((h) => ({ text: h.body ?? '', date: agoLabel(h.daysAgo) })),
    history: hist,
    activity: [],
    sellScore: r.sell,
    reviveScore: r.revive,
  }
})

export const contactProperties: Property[] = records.map((r) => {
  const e = r.evt ?? undefined
  const owned = /Owned (\d+) yrs/.exec(r.stSub)
  const spread = r.attom_avm ? Math.abs(r.avm - r.attom_avm) / Math.min(r.avm, r.attom_avm) : null
  const top = r.hist[0]
  const product = PRODUCTS.includes(r.iProduct ?? '') ? r.iProduct! : 'Renovate to Sell'
  return {
    id: slug(street(r)),
    address: street(r),
    city: r.city,
    lat: r.lat,
    lng: r.lng,
    homeType: HOME_TYPE[r.ptype] ?? 'Single family',
    beds: r.beds ?? undefined,
    baths: r.baths ?? undefined,
    sqft: r.sqft,
    yearBuilt: r.year_built ?? 0,
    lot: r.lot ?? undefined,
    photo: r.photo,
    ownerId: `p${r.id}`,
    ownerRole: 'Owner',
    source: 'contacts',
    minTier: 'new',
    stage: 'spotted',
    reportRun: false,
    valueNow: r.cv,
    valueAfter: r.pv,
    valueSources: r.sources.map((s) => ({ name: s.n, value: s.v })),
    signals: decode(r.sig).split('·').map((s) => s.trim()).filter(Boolean),
    facts: {
      yearsOwned: owned ? +owned[1] : undefined,
      expiredDaysAgo: e?.k === 'expired' ? e.d : undefined,
      withdrawnDaysAgo: e?.k === 'withdrawn' ? e.d : undefined,
      boughtDaysAgo: e?.k === 'bought' ? e.d : undefined,
      otherBrokerage: e?.k === 'active' || e?.k === 'pending' || undefined,
      underContract: e?.k === 'pending' || undefined,
      repliedUnansweredDays: top?.in ? top.d : undefined,
      valueSourcesDisagree: (spread !== null && spread > 0.15) || !r.year_built || undefined,
    },
    scenarios: [{ product, note: r.iHead ? `${r.iHead}. ${decode(r.iBody ?? '')}` : '', gain: r.pv - r.cv }],
    activity: r.hist
      .filter((h) => h.t !== 'note')
      .map((h) => `${h.h}${h.tag ? ` (${h.tag})` : ''} · ${h.when ?? agoLabel(h.d)}`)
      .reverse(),
    comps: (r.dr?.comps ?? []).map((c) => ({
      address: c.addr, sqft: c.sqft, ppsf: c.ppsf, price: c.price, distMi: c.dist, monthsAgo: c.mo, features: c.feat, photo: c.photo ?? undefined,
    })),
    report: r.dr ? { headline: r.dr.head, why: decode(r.dr.why), ppsf: r.dr.ppsf, compsFound: r.dr.compsFound, compsUsed: r.dr.compsUsed } : undefined,
  }
})
