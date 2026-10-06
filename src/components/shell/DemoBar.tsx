import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { cn } from '@/lib/utils'
import { EMPTY_STYLES, useDemo } from '@/store/demo'

export const DEMO_BAR_HEIGHT = 44

export function DemoBar() {
  const tier = useDemo((s) => s.tier)
  const setTier = useDemo((s) => s.setTier)
  const reset = useDemo((s) => s.reset)
  const emptyStyle = useDemo((s) => s.emptyStyle)
  const setEmptyStyle = useDemo((s) => s.setEmptyStyle)

  return (
    <div
      className="sticky top-0 z-40 flex items-center gap-3 overflow-x-auto bg-navy-3 px-4 text-[13px] text-white/80"
      style={{ height: DEMO_BAR_HEIGHT }}
      role="region"
      aria-label="Demo controls"
    >
      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">Demo</span>
      <span className="shrink-0">View as</span>
      <div className="flex shrink-0 rounded-lg bg-white/10 p-0.5" role="radiogroup" aria-label="Agent tier">
        {(Object.keys(TIERS) as Tier[]).map((t) => (
          <button
            key={t}
            role="radio"
            aria-checked={tier === t}
            onClick={() => setTier(t)}
            className={cn(
              'rounded-md px-3 py-1 font-medium whitespace-nowrap transition-colors',
              tier === t ? 'bg-white text-navy' : 'text-white/80 hover:text-white',
            )}
          >
            {TIERS[t].demoLabel}
          </button>
        ))}
      </div>
      {tier === 'new' && (
        <>
          <span className="ml-2 shrink-0">Empty state</span>
          <div className="flex shrink-0 rounded-lg bg-white/10 p-0.5" role="radiogroup" aria-label="Empty state design">
            {EMPTY_STYLES.map((h) => (
              <button
                key={h.id}
                role="radio"
                aria-checked={emptyStyle === h.id}
                onClick={() => setEmptyStyle(h.id)}
                className={cn('rounded-md px-3 py-1 font-medium whitespace-nowrap', emptyStyle === h.id ? 'bg-white text-navy' : 'text-white/80 hover:text-white')}
              >
                {h.label}
              </button>
            ))}
          </div>
        </>
      )}
      <span className="ml-auto shrink-0 rounded-full border border-white/25 px-2 py-0.5 text-[11px]">Sample data</span>
      <button
        onClick={() => {
          reset()
          toast('Demo reset', { description: 'Connections, stages, claims and activity are back to the start.' })
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/10 hover:text-white"
      >
        <RotateCcw className="size-3.5" /> Reset demo
      </button>
    </div>
  )
}
