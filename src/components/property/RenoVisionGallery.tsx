import { Sparkles } from 'lucide-react'
import { AiLink } from '@/components/ai/AiLink'
import { Button } from '@/components/ui/button'
import type { RenoVisionDesign } from '@/lib/flows'
import { useDemo } from '@/store/demo'

// RenoVision designs for a home, shown with its Revive AI report.
export function RenoVisionGallery({ propertyId, title = 'RenoVision designs', empty }: { propertyId?: string | null; title?: string; empty?: string }) {
  const all = useDemo((s) => s.renovisions)
  const list: RenoVisionDesign[] = Object.values(all)
    .filter((d) => (propertyId === null ? !d.propertyId : propertyId ? d.propertyId === propertyId : true))
    .sort((a, b) => b.createdAt - a.createdAt)
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        <Button size="sm" variant="outline" className="text-brand" asChild>
          <AiLink to={propertyId ? `/ai?flow=renovision&property=${propertyId}` : '/ai?flow=renovision'}>
            <Sparkles /> New RenoVision design
          </AiLink>
        </Button>
      </div>
      {list.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {list.flatMap((d) =>
            d.pairs.map((p, i) => (
              <figure key={`${d.id}-${i}`} className="overflow-hidden rounded-xl border border-line bg-white">
                <div className="grid grid-cols-2 gap-px bg-line">
                  <img src={p.before} alt="Before" className="aspect-[4/3] w-full object-cover" />
                  <img src={p.after} alt={`After, ${d.style}`} className="aspect-[4/3] w-full object-cover" />
                </div>
                <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[12.5px]">
                  <span className="font-medium text-ink">{d.style}</span>
                  <span className="text-muted">{d.address ?? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </figcaption>
              </figure>
            )),
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-line px-4 py-3 text-[13px] text-muted">{empty ?? 'No designs yet. Pick photos and a style, and RenoVision shows the home renovated.'}</p>
      )}
    </section>
  )
}
