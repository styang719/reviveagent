import L from 'leaflet'
import { Contact, Home as HomeIcon } from 'lucide-react'
import { useState } from 'react'
import { Marker } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import { properties } from '@/data/properties'
import { AGENT } from '@/data/tiers'
import { photoUrl } from '@/lib/assets'
import { gain } from '@/lib/format'
import { lookupProperty } from '@/lib/lookup'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'
import { BookPins, EXAMPLE_IDS, FlyToCenter, LockLegend, PreviewCard, SearchField, SourcesRow, useBook, useExamples } from './shared'

// B · Split view. Search and results share one panel next to the map, like a listings site:
// the list and the map are two views of the same thing. Sample: a numbered example list
// with matching numbered pins.

const numberIcon = (n: number, on: boolean) =>
  L.divIcon({ className: 'rv-pinwrap', iconAnchor: [0, 0], html: `<span class="rv-num${on ? ' on' : ''}">${n}</span>` })

export function DirectionB({ opps }: { opps: Opportunity[] }) {
  const { bounds } = useBook(opps)
  const examples = useExamples()
  const lookup = useUi((s) => s.lookup)
  const setLookup = useUi((s) => s.setLookup)
  const [hover, setHover] = useState<string | null>(null)
  const open = (id: string) => setLookup(lookupProperty(properties.find((p) => p.id === id)!))

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="grid sm:h-[34rem] sm:grid-cols-[minmax(0,330px)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col border-b border-line sm:border-r sm:border-b-0">
          <div className="relative z-[1100] border-b border-line p-3">
            <SearchField look="panel" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {lookup ? (
              <PreviewCard l={lookup} opps={opps} onClose={() => setLookup(null)} flat />
            ) : (
              <div className="p-3">
                <p className="px-1 text-[11px] font-semibold tracking-wide text-muted uppercase">
                  {examples.length ? 'Examples · what you’ll see once connected' : 'Search any address'}
                </p>
                <ol className="mt-2 flex flex-col gap-2">
                  {examples.map((e) => (
                    <li key={e.id}>
                      <button
                        onClick={() => open(e.id)}
                        onMouseEnter={() => setHover(e.id)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(e.id)}
                        onBlur={() => setHover(null)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border border-dashed p-2.5 text-left transition-colors',
                          hover === e.id ? 'border-brand bg-brand-soft' : 'border-[#c9d1e0] bg-white',
                        )}
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-[12px] font-bold text-white">{e.n}</span>
                        <img src={photoUrl(e.photo)} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className={cn('text-[11px] font-semibold', e.tag === 'Call this week' ? 'text-hot' : 'text-navy')}>{e.tag}</span>
                          <span className="block truncate text-[13px] font-semibold text-ink">{e.who}</span>
                          <span className="block truncate text-[12px] text-muted">{e.reason}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="block text-sm font-semibold text-ok">{gain(e.gain)}</span>
                          <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted">
                            {e.source === 'listings' ? <HomeIcon className="size-3" /> : <Contact className="size-3" />}
                            {e.source === 'listings' ? 'MLS' : 'CRM'}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 px-1 text-[12px] leading-5 text-muted">
                  Examples come from a typical book. Connect your listings and CRM below to see your own, ranked by who to call first.
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="relative h-80 sm:h-auto">
          <BaseMap center={[AGENT.office.lat, AGENT.office.lng]} zoom={11} bounds={bounds} interactive wheelZoom={false}>
            <FlyToCenter lookup={lookup} />
            <BookPins opps={opps} exclude={EXAMPLE_IDS} />
            {!lookup &&
              examples.map((e) => (
                <Marker
                  key={e.id}
                  position={[e.lat, e.lng]}
                  icon={numberIcon(e.n, hover === e.id)}
                  zIndexOffset={hover === e.id ? 3000 : 2000}
                  eventHandlers={{ click: () => open(e.id), mouseover: () => setHover(e.id), mouseout: () => setHover(null) }}
                />
              ))}
          </BaseMap>
          <LockLegend className="absolute top-3 right-3 z-[500] justify-end" />
        </div>
      </div>
      <SourcesRow opps={opps} />
    </div>
  )
}
