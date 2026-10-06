import L from 'leaflet'
import { BadgeCheck, Contact, Home as HomeIcon } from 'lucide-react'
import { Marker } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { BaseMap } from '@/components/map/BaseMap'
import { pinIcon, pinZ } from '@/components/map/pins'
import { Button } from '@/components/ui/button'
import { properties } from '@/data/properties'
import { AGENT } from '@/data/tiers'
import type { Source } from '@/data/types'
import { plural } from '@/lib/format'
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

export function OpportunitiesPreview({ opps }: { opps: Opportunity[] }) {
  const navigate = useNavigate()
  const conn = useConnections()
  const openStep = useUi((s) => s.openStep)
  const openCrm = useUi((s) => s.openCrm)
  const addLicense = () => {
    openStep('license')
    document.getElementById('setup')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

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
        <Button size="sm" onClick={addLicense}>
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
        <Button size="sm" onClick={() => openCrm('Follow Up Boss')}>
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

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-white shadow-card">
        <div className="relative h-72 sm:h-80">
          <BaseMap center={[AGENT.office.lat, AGENT.office.lng]} zoom={11} bounds={bounds} interactive={false}>
            {locked.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={lockIcon(p.source === 'listings' ? 'listing' : 'contact')}
                title={p.source === 'listings' ? 'Add your license number to see this listing' : 'Connect your CRM to see this contact'}
                eventHandlers={{ click: p.source === 'listings' ? addLicense : () => openCrm('Follow Up Boss') }}
              />
            ))}
            {live.map((o, i) => (
              <Marker
                key={o.id}
                position={[o.property.lat, o.property.lng]}
                icon={pinIcon(o, false, true, i >= LABELED || !isActionable(o))}
                zIndexOffset={pinZ(o) + (i < LABELED ? 1000 : 0)}
                title={o.property.address}
                eventHandlers={{ click: () => navigate(`/property/${o.id}`) }}
              />
            ))}
          </BaseMap>
          <div className="pointer-events-none absolute top-3 left-3 z-[500] flex flex-wrap gap-1.5 text-[12px] font-medium text-ink-2">
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
        </div>

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
