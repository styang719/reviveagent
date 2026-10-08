import { Download, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AiLink } from '@/components/ai/AiLink'
import { downloadBeforeAfter } from '@/components/ai/RvShareCard'
import { Button } from '@/components/ui/button'
import { RV_STYLES } from '@/lib/flows'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { CompareSlider } from './CompareSlider'

// RenoVision on a home's page: one large drag-to-compare before & after, the other designs as a strip
// to switch between, and download for sharing.
export function RenoVisionGallery({ propertyId, address, title = 'RenoVision' }: { propertyId: string; address: string; title?: string; empty?: string }) {
  const all = useDemo((s) => s.renovisions)
  const shots = Object.values(all)
    .filter((d) => d.propertyId === propertyId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .flatMap((d) => d.pairs.map((p, i) => ({ key: `${d.id}-${i}`, style: d.style, createdAt: d.createdAt, ...p })))
  const [sel, setSel] = useState(0)
  const cur = shots[Math.min(sel, shots.length - 1)]
  const newLink = `/ai?flow=renovision&property=${propertyId}`

  if (!cur)
    return (
      <section className="overflow-hidden rounded-2xl bg-navy text-white">
        <div className="p-6">
          <p className="text-[11.5px] font-semibold tracking-[0.12em] text-[var(--teal)] uppercase">RenoVision</p>
          <h2 className="mt-1 text-[20px] font-semibold">See {address} renovated</h2>
          <p className="mt-1.5 max-w-xl text-[14px] text-white/75">Pick photos and a style, and RenoVision renders the after. A before & after is the easiest way to show the homeowner what’s possible.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RV_STYLES.slice(0, 4).map((s) => (
              <span key={s.name} className="rounded-full bg-white/10 px-3 py-1 text-[12px] text-white/85">
                {s.name}
              </span>
            ))}
          </div>
          <Button asChild className="mt-5 h-10 bg-white text-navy hover:bg-white/90">
            <AiLink to={newLink}>
              <Sparkles /> Create a RenoVision design
            </AiLink>
          </Button>
        </div>
      </section>
    )

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
          <p className="text-[12.5px] text-muted">Drag to compare. {shots.length} design{shots.length === 1 ? '' : 's'} for this home.</p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await downloadBeforeAfter(cur.before, cur.after, `${address}, renovated`, cur.style)
                toast.success('Before & after downloaded', { description: 'Ready to text, email or post.' })
              } catch (e) {
                if ((e as { code?: string }).code !== 'declined') toast.error('Couldn’t download here')
              }
            }}
          >
            <Download /> Download
          </Button>
          <Button size="sm" variant="outline" className="text-brand" asChild>
            <AiLink to={newLink}>
              <Sparkles /> New design
            </AiLink>
          </Button>
        </div>
      </div>
      <CompareSlider key={cur.key} before={cur.before} after={cur.after} afterLabel={cur.style} className="mt-3 aspect-[16/9] w-full shadow-card" />
      {shots.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {shots.map((s, i) => (
            <li key={s.key} className="shrink-0">
              <button
                type="button"
                onClick={() => setSel(i)}
                aria-pressed={s.key === cur.key}
                className={cn('relative block h-16 w-24 overflow-hidden rounded-lg ring-2 transition', s.key === cur.key ? 'ring-[var(--brand-primary)]' : 'ring-transparent opacity-75 hover:opacity-100')}
              >
                <img src={s.after} alt={s.style} className="size-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 px-1.5 pt-3 pb-0.5 text-left text-[9.5px] font-medium text-white">{s.style}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
