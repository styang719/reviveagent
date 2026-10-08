import L from 'leaflet'
import { ArrowRight, MapPin } from 'lucide-react'
import { Circle, Marker } from 'react-leaflet'
import { Link, useNavigate } from 'react-router-dom'
import { BaseMap } from '@/components/map/BaseMap'
import { pinIcon, pinZ } from '@/components/map/pins'
import { Card } from '@/components/ui/card'
import { AGENT } from '@/data/tiers'
import { plural } from '@/lib/format'
import { isActionable, useIsProperty, type Opportunity } from '@/lib/opportunities'

const baseIcon = L.divIcon({ className: 'rv-pinwrap', html: `<span class="rv-office" title="${AGENT.office.label}"></span>`, iconAnchor: [0, 0] })

const LABELED = 3 // label the top few; the rest are dots so a small map stays readable

const miles = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const r = (d: number) => (d * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function NearbyMini({ opps }: { opps: Opportunity[] }) {
  const navigate = useNavigate()
  const isProperty = useIsProperty()
  const inArea = opps.filter((o) => miles(AGENT.office, o.property) <= AGENT.marketRadiusMiles)
  // the mini map shows only what's worth acting on; the full map has the whole book
  const worth = inArea.filter((o) => isActionable(o) || o.stage === 'project')
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
          <MapPin className="size-4 text-brand" /> Nearby
        </h2>
        <span className="text-xs text-muted">{plural(worth.length, 'opportunity', 'opportunities')} in your area</span>
      </div>
      <div className="h-60 border-y border-line">
        <BaseMap
          center={[AGENT.office.lat, AGENT.office.lng]}
          zoom={11}
          bounds={worth.map((o) => [o.property.lat, o.property.lng] as [number, number])}
          interactive={false}
        >
          <Circle
            center={[AGENT.office.lat, AGENT.office.lng]}
            radius={AGENT.marketRadiusMiles * 1609}
            pathOptions={{ color: '#3e62b6', weight: 1.5, opacity: 0.6, fillOpacity: 0.04, dashArray: '6 5' }}
            interactive={false}
          />
          <Marker position={[AGENT.office.lat, AGENT.office.lng]} icon={baseIcon} interactive={false} zIndexOffset={-100} />
          {worth.map((o, i) => (
            <Marker
              key={o.id}
              position={[o.property.lat, o.property.lng]}
              icon={pinIcon(o, false, true, i >= LABELED)}
              zIndexOffset={pinZ(o) + (i < LABELED ? 1000 : 0)}
              title={o.property.address}
              eventHandlers={{ click: () => isProperty(o) && navigate(`/property/${o.id}`) }}
            />
          ))}
        </BaseMap>
      </div>
      <Link to="/opportunities?view=map" className="flex items-center justify-between px-4 py-3 text-sm font-medium text-brand hover:bg-head">
        Open the map <ArrowRight className="size-4" />
      </Link>
    </Card>
  )
}
