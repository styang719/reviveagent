import L from 'leaflet'
import { Marker } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import { AGENT } from '@/data/tiers'
import { photoUrl } from '@/lib/assets'
import { gain } from '@/lib/format'
import { lookupProperty } from '@/lib/lookup'
import type { Opportunity } from '@/lib/opportunities'
import { properties } from '@/data/properties'
import { useUi } from '@/store/ui'
import { BookPins, EXAMPLE_IDS, FlyTo, LockLegend, PreviewCard, SearchField, SourcesRow, useBook, useExamples, type Example } from './shared'

// A · Map first. The search floats on the map, like a maps app, so the answer to a search
// can only appear in one place: right there. Sample: photo pins with a callout card.

const exampleIcon = (e: Example, callout: boolean) =>
  L.divIcon({
    className: 'rv-pinwrap',
    iconAnchor: [0, 0],
    html:
      `<span class="rv-expin"><span class="rv-expin-ph" style="background-image:url('${photoUrl(e.photo) ?? ''}')"></span><b>${gain(e.gain)}</b></span><span class="rv-fdot"></span>` +
      (callout
        ? `<span class="rv-callout"><em>Example · after you connect</em><strong class="${e.tag === 'Call this week' ? 'hot' : ''}">${e.tag}</strong><span>${e.who}</span><span class="muted">${e.reason}</span><span class="up">${gain(e.gain)} · ${e.product}</span></span>`
        : ''),
  })

export function DirectionA({ opps }: { opps: Opportunity[] }) {
  const { bounds } = useBook(opps)
  const examples = useExamples()
  const lookup = useUi((s) => s.lookup)
  const setLookup = useUi((s) => s.setLookup)

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="relative h-[30rem] sm:h-[34rem]">
        <BaseMap center={[AGENT.office.lat, AGENT.office.lng]} zoom={11} bounds={bounds} interactive wheelZoom={false} zoomPosition="bottomleft" padTop={150}>
          <FlyTo lookup={lookup} />
          <BookPins opps={opps} exclude={EXAMPLE_IDS} />
          {!lookup &&
            examples.map((e, i) => (
              <Marker
                key={e.id}
                position={[e.lat, e.lng]}
                icon={exampleIcon(e, i === 0)}
                zIndexOffset={2000 - i}
                eventHandlers={{ click: () => setLookup(lookupProperty(properties.find((p) => p.id === e.id)!)) }}
              />
            ))}
        </BaseMap>

        {/* the search sits on the map: results can only land here */}
        <div className="absolute inset-x-3 top-3 z-[700] sm:inset-x-6 sm:top-5">
          <SearchField look="floating" className="mx-auto max-w-xl" />
          <LockLegend className="mx-auto mt-2 max-w-xl justify-center" />
        </div>

        {lookup && (
          <div className="absolute top-24 right-3 bottom-3 z-[600] hidden w-[300px] sm:block">
            <PreviewCard l={lookup} opps={opps} onClose={() => setLookup(null)} />
          </div>
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
