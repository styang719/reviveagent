import { Bookmark } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// A marketing template: a preview image, the name and the type. Tapping it gets it ready, branded; the bookmark
// saves it. Used by the Marketing center and by each home's Marketing tab.

export function TemplateCard({ name, type, img, saved, onSave }: { name: string; type: string; img: string; saved?: boolean; onSave?: () => void }) {
  const [own, setOwn] = useState(false)
  const on = saved ?? own
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <button type="button" className="block w-full text-left" onClick={() => toast.success(`${name} ${type.toLowerCase()} is ready`, { description: 'Branded with your photo, name and license.' })}>
        <div className="h-48 overflow-hidden bg-head">
          <img src={img} alt={`${name} ${type.toLowerCase()}`} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="flex items-center gap-2 p-3">
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{name}</span>
          <span className="shrink-0 rounded-full bg-line-soft px-3 py-1 text-[12px] font-medium text-ink">{type}</span>
        </div>
      </button>
      <button
        type="button"
        aria-label={on ? 'Remove from saved' : 'Save template'}
        aria-pressed={on}
        onClick={() => (onSave ? onSave() : setOwn((v) => !v))}
        className={cn('absolute top-3 right-3 grid size-8 place-items-center rounded-lg shadow-sm', on ? 'bg-brand text-white' : 'bg-white/90 text-ink hover:bg-white')}
      >
        <Bookmark className={cn('size-3.5', on && 'fill-current')} />
      </button>
    </article>
  )
}
