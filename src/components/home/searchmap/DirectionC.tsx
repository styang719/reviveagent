import L from 'leaflet'
import { ArrowDown } from 'lucide-react'
import { useState } from 'react'
import { Circle, Marker } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import { AGENT } from '@/data/tiers'
import { money, plural } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { topGain } from '@/lib/urgency'
import { useUi } from '@/store/ui'
import { BookPins, FlyTo, LockLegend, PreviewCard, SearchField, SourcesRow, useBook } from './shared'

// C · Docked. The search bar is the map's header: one object, search on top, answer below.
// Sample: neighbourhood bubbles sized by how much opportunity a book like hers holds there.

const bubbleLabel = (city: string, n: number, value: number) =>
  L.divIcon({
    className: 'rv-pinwrap',
    iconAnchor: [0, 0],
    html: `<span class="rv-bubble"><b>${city}</b><span>${plural(n, 'home')}${value > 0 ? ` · +${money(value)}` : ''}</span></span>`,
  })

export function DirectionC({ opps }: { opps: Opportunity[] }) {
  const { book, bounds, conn } = useBook(opps)
  const lookup = useUi((s) => s.lookup)
  const setLookup = useUi((s) => s.setLookup)

  // group the (still locked) book by town: count and upside, as a sample of what's there
  const groups = new Map<string, { n: number; value: number; lat: number; lng: number }>()
  for (const p of book) {
    if ((p.source === 'listings' && conn.mls) || (p.source !== 'listings' && conn.crm)) continue
    const g = groups.get(p.city) ?? { n: 0, value: 0, lat: 0, lng: 0 }
    g.n += 1
    g.value += topGain(p)
    g.lat += p.lat
    g.lng += p.lng
    groups.set(p.city, g)
  }
  const bubbles = [...groups.entries()].map(([city, g]) => ({ city, n: g.n, value: g.value, lat: g.lat / g.n, lng: g.lng / g.n }))
  const [homes, setHomes] = useState(false)
  const showBubbles = !lookup && !homes && bubbles.length > 0

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="relative z-[1100] border-b border-line bg-white p-3 sm:p-4">
        <SearchField look="docked" />
        <p className="mt-2 flex items-center gap-1.5 px-1 text-[12px] text-muted">
          <ArrowDown className="size-3.5" /> Results appear on the map below, with what Revive sees for that home.
        </p>
      </div>
      <div className="relative h-[26rem] sm:h-[30rem]">
        <BaseMap center={[AGENT.office.lat, AGENT.office.lng]} zoom={11} bounds={bounds} interactive wheelZoom={false}>
          <FlyTo lookup={lookup} />
          {showBubbles &&
            bubbles.map((b) => (
              <Circle
                key={b.city}
                center={[b.lat, b.lng]}
                radius={900 + b.n * 450}
                pathOptions={{ color: '#2563EB', weight: 1.5, fillColor: '#2563EB', fillOpacity: 0.12, dashArray: '5 4' }}
                interactive={false}
              />
            ))}
          {showBubbles &&
            bubbles.map((b) => (
              <Marker key={`l-${b.city}`} position={[b.lat, b.lng]} icon={bubbleLabel(b.city, b.n, b.value)} zIndexOffset={2500} interactive={false} />
            ))}
          <BookPins opps={opps} showLocked={!showBubbles} />
        </BaseMap>
        {showBubbles ? (
          <p className="pointer-events-none absolute top-3 left-14 z-[500] rounded-full bg-navy px-3 py-1.5 text-[12px] font-medium text-white shadow">
            Sample: where opportunity sits in a book like yours
          </p>
        ) : (
          <LockLegend className="absolute top-3 left-14 z-[500]" />
        )}
        {lookup && (
          <div className="absolute top-3 right-3 bottom-3 z-[600] hidden w-[300px] sm:block">
            <PreviewCard l={lookup} opps={opps} onClose={() => setLookup(null)} />
          </div>
        )}
        {!lookup && bubbles.length > 0 && (
          <button
            onClick={() => setHomes((h) => !h)}
            aria-pressed={homes}
            className="absolute right-3 bottom-8 z-[500] rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-brand shadow hover:bg-brand-soft"
          >
            {homes ? 'Show sample by area' : 'Show homes'}
          </button>
        )}
      </div>
      {lookup && (
        <div className="border-t border-line p-3 sm:hidden">
          <PreviewCard l={lookup} opps={opps} onClose={() => setLookup(null)} />
        </div>
      )}
      <SourcesRow opps={opps} />
    </div>
  )
}
