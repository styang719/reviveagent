import { ArrowRight, MapPin } from 'lucide-react'
import { Circle, MapContainer, Marker, TileLayer } from 'react-leaflet'
import { Link, useNavigate } from 'react-router-dom'
import { pinIcon, TILE_ATTRIBUTION, TILE_URL } from '@/components/map/pins'
import { Card } from '@/components/ui/card'
import { AGENT } from '@/data/tiers'
import { plural } from '@/lib/format'
import { isActionable, type Opportunity } from '@/lib/opportunities'

export function NearbyMini({ opps }: { opps: Opportunity[] }) {
  const navigate = useNavigate()
  const shown = opps.filter((o) => isActionable(o) || o.stage === 'project')
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="flex items-center gap-1.5 text-[15px] font-semibold text-ink">
          <MapPin className="size-4 text-brand" /> Nearby
        </h2>
        <span className="text-xs text-muted">{plural(shown.length, 'opportunity', 'opportunities')} within {AGENT.homeRadiusMiles} mi</span>
      </div>
      <div className="h-52 border-y border-line">
        <MapContainer
          center={[AGENT.office.lat, AGENT.office.lng]}
          zoom={12}
          zoomControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
          <Circle
            center={[AGENT.office.lat, AGENT.office.lng]}
            radius={AGENT.homeRadiusMiles * 1609}
            pathOptions={{ color: '#2563EB', weight: 1, fillOpacity: 0.05, dashArray: '4 4' }}
          />
          {shown.map((o) => (
            <Marker
              key={o.id}
              position={[o.property.lat, o.property.lng]}
              icon={pinIcon(o)}
              title={o.property.address}
              eventHandlers={{ click: () => navigate(`/property/${o.id}`) }}
            />
          ))}
        </MapContainer>
      </div>
      <Link to="/opportunities?view=map" className="flex items-center justify-between px-4 py-3 text-sm font-medium text-brand hover:bg-head">
        Open map <ArrowRight className="size-4" />
      </Link>
    </Card>
  )
}
