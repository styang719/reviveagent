import L from 'leaflet'
import { Marker } from 'react-leaflet'
import { BaseMap } from '@/components/map/BaseMap'
import { GlobalSearch, runAiPath } from '@/components/shell/GlobalSearch'
import { projectGain, reviveProjects } from '@/data/reviveProjects'
import { AGENT } from '@/data/tiers'
import { photoUrl } from '@/lib/assets'
import { money } from '@/lib/format'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

// First visit, nothing connected: the page is a search. Two backdrops to compare (demo bar → "Hero").
const EXAMPLES = ['1847 Las Lunas St, Pasadena', '4218 Ocean View Blvd, Montrose']

function SearchCard({ className }: { className?: string }) {
  return (
    <div className={cn('relative z-10 mx-auto w-full max-w-2xl rounded-2xl bg-white/95 p-5 text-center shadow-xl ring-1 ring-black/5 backdrop-blur sm:p-8', className)}>
      <p className="text-[12px] font-semibold tracking-[0.08em] text-brand uppercase">Revive AI</p>
      <h2 className="mt-1 text-2xl font-semibold text-balance text-ink sm:text-[32px] sm:leading-10">Have a property in mind?</h2>
      <p className="mx-auto mt-2 max-w-lg text-[15px] leading-6 text-ink-2">
        Enter any address to see what it’s worth today, what a renovation could add, and which Revive product fits.
      </p>
      <GlobalSearch variant="hero" className="mx-auto mt-5 text-left" />
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13px] text-muted">
        Try
        {EXAMPLES.map((a) => (
          <Link key={a} to={runAiPath(a)} className="font-medium text-brand underline-offset-2 hover:underline">
            {a}
          </Link>
        ))}
      </p>
    </div>
  )
}

const projectIcon = (label: string) =>
  L.divIcon({ className: 'rv-pinwrap', html: `<span class="rv-pill k-project-done">${label}</span>`, iconAnchor: [0, 0] })

/** Option A: the neighbourhood map, with recent Revive projects as proof of what Revive adds. */
function MapHero() {
  return (
    <section aria-label="Look up a property" className="relative overflow-hidden rounded-2xl border border-line">
      <div className="absolute inset-0" aria-hidden="true">
        <BaseMap center={[AGENT.office.lat - 0.01, AGENT.office.lng - 0.02]} zoom={12} interactive={false}>
          {reviveProjects.map((p) => (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={projectIcon(`+${money(projectGain(p))}`)} interactive={false} />
          ))}
        </BaseMap>
        <div className="pointer-events-none absolute inset-0 z-[500] bg-[radial-gradient(ellipse_60%_70%_at_50%_50%,rgba(255,255,255,0.85),rgba(255,255,255,0.35)_70%,rgba(255,255,255,0.1))]" />
      </div>
      <div className="relative z-[600] px-4 py-14 sm:py-20">
        <SearchCard />
      </div>
      <p className="absolute bottom-3 left-3 z-[600] flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-medium text-ink-2 shadow-sm">
        <span className="inline-block size-2.5 rounded-full bg-ok" /> Recent Revive projects near {AGENT.office.label.replace(' office', '')}
      </p>
    </section>
  )
}

const MOSAIC = ['contact-100', 'contact-109', 'contact-103', 'contact-104', 'contact-107', 'contact-111', 'contact-105', 'contact-102', 'contact-110', 'contact-106', 'contact-108', 'contact-101']

/** Option B: a wall of homes, like a listings site, softened behind the search. */
function PhotoHero() {
  return (
    <section aria-label="Look up a property" className="relative overflow-hidden rounded-2xl border border-line bg-head">
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-1.5 p-1.5 sm:grid-cols-6 sm:grid-rows-2" aria-hidden="true">
        {MOSAIC.map((k) => (
          <img key={k} src={photoUrl(k)} alt="" className="h-full w-full rounded-lg object-cover" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_75%_at_50%_50%,rgba(255,255,255,0.75),rgba(255,255,255,0.2)_75%,rgba(255,255,255,0))]" />
      <div className="relative px-4 py-14 sm:py-20">
        <SearchCard />
      </div>
    </section>
  )
}

export function EmptyHero({ style }: { style: 'map' | 'photos' }) {
  return style === 'map' ? <MapHero /> : <PhotoHero />
}
