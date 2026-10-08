import { ChevronsLeftRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

/** Before and after on top of each other; drag (or arrow-key) the handle to reveal one or the other. */
export function CompareSlider({ before, after, afterLabel, className }: { before: string; after: string; afterLabel: string; className?: string }) {
  const [pos, setPos] = useState(50)
  return (
    <div className={cn('group relative overflow-hidden rounded-2xl bg-line-soft select-none', className)}>
      <img src={after} alt={`After, ${afterLabel}`} className="absolute inset-0 size-full object-cover" draggable={false} />
      <img src={before} alt="Before" className="absolute inset-0 size-full object-cover" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} draggable={false} />
      <span className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow-[0_0_12px_rgba(0,0,0,.35)]" style={{ left: `${pos}%` }} aria-hidden="true">
        <span className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow-lg ring-4 ring-white/40 transition-transform group-active:scale-95">
          <ChevronsLeftRight className="size-5" />
        </span>
      </span>
      <span className="pointer-events-none absolute top-4 left-4 rounded-full bg-black/55 px-3 py-1 text-[12px] font-semibold tracking-wide text-white uppercase backdrop-blur">Before</span>
      <span className="pointer-events-none absolute top-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold tracking-wide text-navy uppercase backdrop-blur">After · {afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Compare before and after"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
      />
    </div>
  )
}
