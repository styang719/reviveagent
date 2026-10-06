import L from 'leaflet'
import { ArrowRight, BadgeCheck, Contact, Home as HomeIcon, Lock, Search, X } from 'lucide-react'
import { useEffect } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { BaseMap } from '@/components/map/BaseMap'
import { pinIcon, pinZ } from '@/components/map/pins'
import { Button } from '@/components/ui/button'
import { properties } from '@/data/properties'
import { AGENT } from '@/data/tiers'
import type { Source } from '@/data/types'
import { runAiPath } from '@/components/shell/GlobalSearch'
import { photoUrl } from '@/lib/assets'
import { gain as fmtGain, money, plural } from '@/lib/format'
import { lookupProperty, type Lookup } from '@/lib/lookup'
import { isActionable, sourceConnected, useConnections, type Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'

// The agent's book as a map, before and while it is connected. Homes Revive can't see yet are
// locked, and each lock says where it will come from: a house for listings (MLS, via the license
// number), a person for contacts (CRM). Connecting one unlocks its own pins.

const LOCK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
const HOUSE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-6h6v6"/></svg>'
const PERSON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>'

const lockIcon = (kind: 'listing' | 'contact') =>
  L.divIcon({
    className: 'rv-pinwrap',
    html: `<span class="rv-lock k-${kind}">${kind === 'listing' ? HOUSE_SVG : PERSON_SVG}<i>${LOCK_SVG}</i></span>`,
    iconAnchor: [0, 0],
  })

const miles = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const BOOK_SOURCES: Source[] = ['listings', 'contacts', 'leadform']
const LABELED = 3

const searchedIcon = L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-searched"></span>', iconAnchor: [0, 0] })

const CARD_W = 300

/** Fly to the looked-up home, landing it in the open part of the map (left of the preview card). */
function FlyTo({ lookup }: { lookup: Lookup | null }) {
  const map = useMap()
  useEffect(() => {
    if (!lookup) return
    const zoom = 13
    const wide = map.getSize().x >= 600
    const p = map.project([lookup.lat, lookup.lng], zoom).add([wide ? CARD_W / 2 + 12 : 0, 0])
    map.flyTo(map.unproject(p, zoom), zoom, { duration: 0.8 })
  }, [lookup, map])
  return null
}

function useConnectActions() {
  const openStep = useUi((s) => s.openStep)
  const openCrm = useUi((s) => s.openCrm)
  return {
    license: () => {
      openStep('license')
      document.getElementById('setup')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    },
    crm: () => openCrm('Follow Up Boss'),
  }
}

/** What Revive shows anyone about a home, and what each connection adds for this one. */
function PreviewCard({ l, opps, onClose }: { l: Lookup; opps: Opportunity[]; onClose: () => void }) {
  const conn = useConnections()
  const act = useConnectActions()
  const o = l.propertyId ? opps.find((x) => x.id === l.propertyId) : undefined // visible only once connected
  const photo = photoUrl(l.photo)
  const inBook = l.source === 'listings' || l.source === 'contacts' || l.source === 'leadform'

  // Each row: what this connection would tell her about this home
  const listingRow = (() => {
    if (l.source === 'listings' && conn.mls && o)
      return { open: true, text: `Your listing · ${o.property.facts.daysOnMarket ?? '—'} days on market` }
    if (l.source === 'listings') return { open: false, text: 'Days on market, price cuts and showings', cta: 'Add license number', onClick: act.license }
    if (!inBook) return { open: false, text: 'If it’s your listing: days on market and price cuts', cta: 'Add license number', onClick: act.license }
    return null
  })()
  const ownerRow = (() => {
    if (o?.person && conn.crm)
      return { open: true, text: `${o.person.name} · ${o.person.relationship}${o.person.touchVia ? ` · ${o.person.touchVia.toLowerCase()} ${o.person.lastTouchDays} days ago` : ''}` }
    if (o?.person && l.source === 'listings') return { open: true, text: `${o.person.name} · your seller` }
    if (l.source === 'contacts' || l.source === 'leadform')
      return { open: false, text: 'Who owns it, and when you last talked', cta: 'Connect CRM', onClick: act.crm }
    if (!inBook) return { open: false, text: 'If the owner is in your CRM: who, and your history', cta: 'Connect CRM', onClick: act.crm }
    return null
  })()

  const reportTo = o ? `/property/${o.id}?tab=report` : runAiPath(`${l.address}, ${l.city}`)

  return (
    <div className="flex max-h-full flex-col overflow-hidden rounded-xl border border-line bg-white shadow-xl" role="dialog" aria-label={`Preview of ${l.address}`}>
      <div className="relative shrink-0">
        {photo ? (
          <img src={photo} alt={`Photo of ${l.address}`} className="h-24 w-full object-cover" />
        ) : (
          <div className="grid h-14 w-full place-items-center bg-gradient-to-br from-brand-soft to-[#dbe6ff]">
            <HomeIcon className="size-7 text-brand/60" />
          </div>
        )}
        <button onClick={onClose} className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/95 text-ink-2 shadow hover:bg-white" aria-label="Close preview">
          <X className="size-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-3">
        <p className="text-[15px] leading-5 font-semibold text-ink">{l.address}</p>
        <p className="text-[13px] text-muted">
          {l.city}
          {l.facts.length > 0 && ` · ${l.facts.join(' · ')}`}
        </p>

        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-head p-2.5">
            <p className="text-[11px] text-muted">Value today</p>
            <p className="text-base font-semibold text-ink tabular-nums">{money(l.valueNow)}</p>
            <p className="text-[11px] text-muted tabular-nums">
              {money(l.valueLo)}–{money(l.valueHi)}
            </p>
          </div>
          <div className="rounded-lg bg-ok-soft/60 p-2.5">
            <p className="text-[11px] text-muted">Est. upside</p>
            <p className="text-base font-semibold text-[#08795a] tabular-nums">{fmtGain(l.gain)}</p>
            <p className="truncate text-[11px] text-muted">{l.product}</p>
          </div>
        </div>
        {l.sample && <p className="mt-1.5 text-[11px] text-faint">Sample estimate for the prototype.</p>}

        {(listingRow || ownerRow) && (
          <div className="mt-3">
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">From your book</p>
            <ul className="mt-1.5 flex flex-col gap-2">
              {[
                listingRow && { icon: HomeIcon, label: 'Listing', ...listingRow },
                ownerRow && { icon: Contact, label: 'Owner', ...ownerRow },
              ]
                .filter((r): r is NonNullable<typeof r> => !!r)
                .map((r) => (
                  <li key={r.label} className={cn('rounded-lg border px-2.5 py-2', r.open ? 'border-line' : 'border-dashed border-[#c9d1e0] bg-head')}>
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
                      <r.icon className="size-3.5" /> {r.label}
                      {!r.open && <Lock className="ml-auto size-3 text-faint" aria-label="Locked" />}
                    </p>
                    <p className={cn('mt-0.5 text-[13px] leading-5', r.open ? 'text-ink' : 'text-muted')}>{r.text}</p>
                    {'cta' in r && r.cta && (
                      <button onClick={r.onClick} className="mt-1 text-[13px] font-semibold text-brand hover:underline">
                        {r.cta} →
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>
        )}

      </div>
      <div className="shrink-0 border-t border-line p-3">
        <Button asChild className="w-full">
          <Link to={reportTo}>
            Open full report <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  )
}

export function OpportunitiesPreview({ opps }: { opps: Opportunity[] }) {
  const conn = useConnections()
  const act = useConnectActions()
  const lookup = useUi((s) => s.lookup)
  const setLookup = useUi((s) => s.setLookup)

  // every home in a book like hers, in her market; the ones not connected yet stay locked
  const book = properties.filter((p) => p.minTier === 'new' && BOOK_SOURCES.includes(p.source) && miles(AGENT.office, p) <= AGENT.marketRadiusMiles)
  const locked = book.filter((p) => !sourceConnected(p.source, conn))
  const live = opps
    .filter((o) => miles(AGENT.office, o.property) <= AGENT.marketRadiusMiles)
    .filter((o) => isActionable(o) || o.urgency === 'keep')
  // frame the core of the book; a far-off contact or two shouldn't zoom the whole map out
  const bounds = book.filter((p) => miles(AGENT.office, p) <= 11).map((p) => [p.lat, p.lng] as [number, number])
  const connected = [conn.mls, conn.crm].filter(Boolean).length
  const listings = opps.filter((o) => o.property.source === 'listings').length
  const contacts = opps.filter((o) => o.property.source === 'contacts').length

  const sources = [
    {
      key: 'mls',
      icon: HomeIcon,
      title: 'Your listings',
      from: 'from the MLS',
      body: 'Listings that would sell faster, or for more, after a refresh.',
      done: conn.mls,
      result: `${plural(listings, 'active listing')} found`,
      action: (
        <Button size="sm" onClick={act.license}>
          Add license number
        </Button>
      ),
    },
    {
      key: 'crm',
      icon: Contact,
      title: 'Your contacts',
      from: 'from your CRM',
      body: 'Homeowners you know who are likely to sell or renovate.',
      done: conn.crm,
      result: `${plural(contacts, 'contact')} checked`,
      action: (
        <Button size="sm" onClick={act.crm}>
          Connect CRM
        </Button>
      ),
    },
  ]

  return (
    <section aria-labelledby="book-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="book-title" className="text-lg font-semibold text-ink sm:text-xl">
            Your opportunities
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">Revive pulls in two sources. Connect both to see everyone worth a call.</p>
        </div>
        <span className="rounded-full bg-line-soft px-2.5 py-1 text-xs font-medium text-ink-2 tabular-nums">{connected} of 2 connected</span>
      </div>

      <div id="book-map" className="mt-4 scroll-mt-24 overflow-hidden rounded-xl border border-line bg-white shadow-card">
        <div className="relative h-80 sm:h-[28rem]">
          <BaseMap center={[AGENT.office.lat, AGENT.office.lng]} zoom={11} bounds={bounds} interactive wheelZoom={false}>
            <FlyTo lookup={lookup} />
            {locked.filter((p) => p.id !== lookup?.propertyId).map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={lockIcon(p.source === 'listings' ? 'listing' : 'contact')}
                title={p.address}
                eventHandlers={{ click: () => setLookup(lookupProperty(p)) }}
              />
            ))}
            {live.filter((o) => o.id !== lookup?.propertyId).map((o, i) => (
              <Marker
                key={o.id}
                position={[o.property.lat, o.property.lng]}
                icon={pinIcon(o, false, true, i >= LABELED || !isActionable(o))}
                zIndexOffset={pinZ(o) + (i < LABELED ? 1000 : 0)}
                title={o.property.address}
                eventHandlers={{ click: () => setLookup(lookupProperty(o.property)) }}
              />
            ))}
            {lookup && <Marker position={[lookup.lat, lookup.lng]} icon={searchedIcon} zIndexOffset={3000} interactive={false} />}
          </BaseMap>

          <div className="pointer-events-none absolute top-3 left-14 z-[500] flex flex-wrap gap-1.5 text-[12px] font-medium text-ink-2">
            {!conn.mls && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
                <span className="rv-lock k-listing is-legend" dangerouslySetInnerHTML={{ __html: HOUSE_SVG }} /> Listings, locked
              </span>
            )}
            {!conn.crm && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
                <span className="rv-lock k-contact is-legend" dangerouslySetInnerHTML={{ __html: PERSON_SVG }} /> Contacts, locked
              </span>
            )}
          </div>
          {!lookup && (
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-[12px] font-medium whitespace-nowrap text-white shadow">
              <Search className="size-3.5" /> Search an address above, or tap a home
            </p>
          )}
          {lookup && (
            <div className="absolute top-3 right-3 bottom-3 z-[600] hidden w-[300px] sm:block">
              <PreviewCard l={lookup} opps={opps} onClose={() => setLookup(null)} />
            </div>
          )}
        </div>
        {lookup && (
          <div className="border-t border-line p-3 sm:hidden">
            <PreviewCard l={lookup} opps={opps} onClose={() => setLookup(null)} />
          </div>
        )}

        <div className="grid divide-y divide-line border-t border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {sources.map((s) => (
            <div key={s.key} className={cn('flex gap-3 p-4', s.done && 'bg-ok-soft/40')}>
              <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', s.done ? 'bg-ok-soft text-ok' : 'bg-brand-soft text-brand')}>
                <s.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-ink">
                  {s.title} <span className="font-normal text-muted">{s.from}</span>
                </p>
                <p className="mt-0.5 text-[13px] leading-5 text-ink-2">{s.body}</p>
                <div className="mt-2.5">
                  {s.done ? (
                    <p className="flex items-center gap-1.5 text-sm font-medium text-[#08795a]">
                      <BadgeCheck className="size-4" /> {s.result}
                    </p>
                  ) : (
                    s.action
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
