import L from 'leaflet'
import { Command } from 'cmdk'
import { ArrowRight, BadgeCheck, Contact, Home as HomeIcon, Lock, MapPin, Sparkles, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { pinIcon, pinZ } from '@/components/map/pins'
import { Button } from '@/components/ui/button'
import { properties } from '@/data/properties'
import { AGENT } from '@/data/tiers'
import type { Source } from '@/data/types'
import { runAiPath } from '@/components/shell/GlobalSearch'
import { photoUrl } from '@/lib/assets'
import { gain as fmtGain, money, plural } from '@/lib/format'
import { looksLikeAddress, lookupAddress, lookupProperty, searchAddresses, type Lookup } from '@/lib/lookup'
import { isActionable, sourceConnected, useConnections, type Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'

// Shared pieces for the three Home search + map directions (A, B, C).
// The agent's book as a map, before and while it is connected. Homes Revive can't see yet are
// locked, and each lock says where it will come from: a house for listings (MLS, via the license
// number), a person for contacts (CRM). Connecting one unlocks its own pins.

export const LOCK_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
export const HOUSE_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21H3z"/><path d="M9 21v-6h6v6"/></svg>'
export const PERSON_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>'

export const lockIcon = (kind: 'listing' | 'contact') =>
  L.divIcon({
    className: 'rv-pinwrap',
    html: `<span class="rv-lock k-${kind}">${kind === 'listing' ? HOUSE_SVG : PERSON_SVG}<i>${LOCK_SVG}</i></span>`,
    iconAnchor: [0, 0],
  })

export const miles = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

const BOOK_SOURCES: Source[] = ['listings', 'contacts', 'leadform']
export const LABELED = 3

export const searchedIcon = L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-searched"></span>', iconAnchor: [0, 0] })

export const CARD_W = 300

/** Fly to the looked-up home, landing it in the open part of the map (left of the preview card). */
export function FlyTo({ lookup }: { lookup: Lookup | null }) {
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

export function useConnectActions() {
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
export function PreviewCard({ l, opps, onClose, flat = false }: { l: Lookup; opps: Opportunity[]; onClose: () => void; flat?: boolean }) {
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
    <div
      className={cn('flex max-h-full flex-col overflow-hidden bg-white', flat ? 'h-full' : 'rounded-xl border border-line shadow-xl')}
      role="dialog"
      aria-label={`Preview of ${l.address}`}
    >
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


/** FlyTo that keeps the pin centred (used when no card covers the map). */
export function FlyToCenter({ lookup }: { lookup: Lookup | null }) {
  const map = useMap()
  useEffect(() => {
    if (lookup) map.flyTo([lookup.lat, lookup.lng], 13, { duration: 0.8 })
  }, [lookup, map])
  return null
}

/** Her market's homes, split into what's locked and what's live for the current connections. */
export function useBook(opps: Opportunity[], exclude: string[] = []) {
  const conn = useConnections()
  const book = properties.filter((p) => p.minTier === 'new' && BOOK_SOURCES.includes(p.source) && miles(AGENT.office, p) <= AGENT.marketRadiusMiles)
  const locked = book.filter((p) => !sourceConnected(p.source, conn) && !exclude.includes(p.id))
  const live = opps.filter((o) => miles(AGENT.office, o.property) <= AGENT.marketRadiusMiles).filter((o) => isActionable(o) || o.urgency === 'keep')
  // frame the core of the book; a far-off contact or two shouldn't zoom the whole map out
  const bounds = book.filter((p) => miles(AGENT.office, p) <= 11).map((p) => [p.lat, p.lng] as [number, number])
  return { conn, book, locked, live, bounds }
}

/** Examples of what she'll see once connected: real-looking records, clearly labelled. */
export interface Example {
  n: number
  id: string
  source: 'listings' | 'contacts'
  who: string
  tag: 'Call this week' | 'This month'
  reason: string
  lat: number
  lng: number
  gain: number
  product: string
  photo?: string
}

export function useExamples(): Example[] {
  const conn = useConnections()
  const pick: [string, Example['tag'], string, string][] = [
    ['1847-las-lunas-st', 'Call this week', 'Maya C.', 'Likely seller · owned 18 yrs'],
    ['4218-ocean-view-blvd', 'Call this week', 'Robert N.', 'Listing expired 23 days ago'],
    ['main', 'This month', 'Your listing', '45 days on market'],
  ]
  return pick
    .map(([id, tag, who, reason], i) => {
      const p = properties.find((x) => x.id === id)!
      const l = lookupProperty(p)
      return { n: i + 1, id, source: p.source as Example['source'], who, tag, reason, lat: p.lat, lng: p.lng, gain: l.gain, product: l.product, photo: p.photo }
    })
    .filter((e) => !sourceConnected(e.source, conn)) // once connected, the real thing replaces the example
}

export const EXAMPLE_IDS = ['1847-las-lunas-st', '4218-ocean-view-blvd', 'main']

/** The two connections, side by side: what each pulls in and how to connect it. */
export function SourcesRow({ opps }: { opps: Opportunity[] }) {
  const conn = useConnections()
  const act = useConnectActions()
  const listings = opps.filter((o) => o.property.source === 'listings').length
  const contacts = opps.filter((o) => o.property.source === 'contacts').length
  const sources = [
    { key: 'mls', icon: HomeIcon, title: 'Your listings', from: 'from the MLS', body: 'Listings that would sell faster, or for more, after a refresh.', done: conn.mls, result: `${plural(listings, 'active listing')} found`, cta: 'Add license number', onClick: act.license },
    { key: 'crm', icon: Contact, title: 'Your contacts', from: 'from your CRM', body: 'Homeowners you know who are likely to sell or renovate.', done: conn.crm, result: `${plural(contacts, 'contact')} checked`, cta: 'Connect CRM', onClick: act.crm },
  ]
  return (
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
                <Button size="sm" onClick={s.onClick}>
                  {s.cta}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Locked and live pins for the book; the looked-up home and any examples are drawn by the caller. */
export function BookPins({ opps, exclude = [], showLocked = true }: { opps: Opportunity[]; exclude?: string[]; showLocked?: boolean }) {
  const { locked, live } = useBook(opps, exclude)
  const lookup = useUi((s) => s.lookup)
  const setLookup = useUi((s) => s.setLookup)
  return (
    <>
      {(showLocked ? locked : [])
        .filter((p) => p.id !== lookup?.propertyId)
        .map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={lockIcon(p.source === 'listings' ? 'listing' : 'contact')} title={p.address} eventHandlers={{ click: () => setLookup(lookupProperty(p)) }} />
        ))}
      {live
        .filter((o) => o.id !== lookup?.propertyId)
        .map((o, i) => (
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
    </>
  )
}

export function LockLegend({ className }: { className?: string }) {
  const conn = useConnections()
  if (conn.mls && conn.crm) return null
  return (
    <div className={cn('pointer-events-none flex flex-wrap gap-1.5 text-[12px] font-medium text-ink-2', className)}>
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
  )
}

/** The address search used by all three directions; `look` changes only its styling. */
export function SearchField({ look, className }: { look: 'floating' | 'panel' | 'docked'; className?: string }) {
  const setLookup = useUi((s) => s.setLookup)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  const matches = searchAddresses(q)
  const term = q.trim()
  const canRun = looksLikeAddress(term) && !matches.some((p) => p.address.toLowerCase() === term.toLowerCase())
  const show = (l: Lookup) => {
    setLookup(l)
    setOpen(false)
    setQ(`${l.address}, ${l.city}`)
    inputRef.current?.blur()
  }
  const submit = () => {
    if (!term) return inputRef.current?.focus()
    if (matches[0]) return show(lookupProperty(matches[0]))
    show(lookupAddress(term))
  }

  const box = {
    floating: 'h-14 rounded-xl border-white bg-white pr-1.5 pl-4 shadow-[0_6px_24px_rgba(27,37,89,0.18)]',
    panel: 'h-11 rounded-lg border-line bg-white pr-1 pl-3',
    docked: 'h-12 rounded-xl border-line bg-white pr-1.5 pl-4',
  }[look]

  return (
    <div ref={wrapRef} className={cn('relative w-full', className)}>
      <Command shouldFilter={false} label="Look up an address" className="relative">
        <div className={cn('flex items-center gap-2 border focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10', box)}>
          <Sparkles className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <Command.Input
            ref={inputRef}
            data-hero-search=""
            value={q}
            onValueChange={(v) => {
              setQ(v)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
              if (e.key === 'Enter' && !(open && term)) submit()
            }}
            placeholder="Enter an address"
            className="h-full min-w-0 flex-1 truncate bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
          {look === 'panel' ? (
            <button type="button" onClick={submit} className="grid size-9 shrink-0 place-items-center rounded-md bg-brand text-white hover:bg-primary-hover" aria-label="Generate insights">
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className={cn('flex shrink-0 items-center gap-2 rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-primary-hover sm:px-4', look === 'floating' ? 'h-11' : 'h-9')}
            >
              <Sparkles className="size-4" />
              <span className="hidden sm:inline">Generate insights</span>
              <span className="sm:hidden">Go</span>
            </button>
          )}
        </div>
        {open && term && (
          <Command.List className="absolute top-full right-0 left-0 z-[1100] mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-xl">
            <Command.Empty className="px-3 py-5 text-center text-sm text-muted">Type a street address, like 412 Oak Ave.</Command.Empty>
            {matches.map((p) => (
              <Command.Item key={p.id} value={p.id} onSelect={() => show(lookupProperty(p))} className={itemCls}>
                <MapPin className="size-4 text-muted" />
                <span className="flex-1">
                  <span className="block font-medium text-ink">{p.address}</span>
                  <span className="block text-xs text-muted">{p.city}, CA</span>
                </span>
              </Command.Item>
            ))}
            {canRun && (
              <Command.Item value="__run" onSelect={() => show(lookupAddress(term))} className={itemCls}>
                <Sparkles className="size-4 text-brand" />
                <span className="flex-1 font-medium text-brand">Look up “{term}”</span>
              </Command.Item>
            )}
          </Command.List>
        )}
      </Command>
    </div>
  )
}

const itemCls = 'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-brand-soft'
