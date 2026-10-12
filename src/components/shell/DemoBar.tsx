import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import { ViewSwitch } from '@/mobile/ViewSwitch'

export const DEMO_BAR_HEIGHT = 44

export function DemoBar() {
  const tier = useDemo((s) => s.tier)
  const setTier = useDemo((s) => s.setTier)
  const setNewAgent = useDemo((s) => s.setNewAgent)
  const setImporting = useUi((s) => s.setImporting)

  // New agent starts with nothing connected (connecting from the dashboard shows the connected state);
  // Active stands in for a connected agent with their book, so it has no separate button
  const scenarios: { key: string; label: string; on: boolean; pick: () => void }[] = [
    { key: 'new', label: TIERS.new.demoLabel, on: tier === 'new', pick: () => setNewAgent(false) },
    ...(Object.keys(TIERS) as Tier[])
      .filter((t) => t !== 'new')
      .map((t) => ({ key: t, label: TIERS[t].demoLabel, on: tier === t, pick: () => setTier(t) })),
  ]
  const reset = useDemo((s) => s.reset)
  const resetChats = useUi((s) => s.resetChats)

  return (
    <div
      className="sticky top-0 z-40 flex items-center gap-3 overflow-x-auto bg-navy-3 px-4 text-[13px] text-white/80"
      style={{ height: DEMO_BAR_HEIGHT }}
      role="region"
      aria-label="Demo controls"
    >
      <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-white uppercase">Demo</span>
      <ViewSwitch />
      <span className="shrink-0">View as</span>
      <div className="flex shrink-0 rounded-lg bg-white/10 p-0.5" role="radiogroup" aria-label="Demo scenario">
        {scenarios.map((sc) => (
          <button
            key={sc.key}
            role="radio"
            aria-checked={sc.on}
            onClick={() => {
              setImporting(null)
              sc.pick()
            }}
            className={cn(
              'rounded-md px-3 py-1 font-medium whitespace-nowrap transition-colors',
              sc.on ? 'bg-white text-navy' : 'text-white/80 hover:text-white',
            )}
          >
            {sc.label}
          </button>
        ))}
      </div>
      <span className="ml-auto shrink-0 rounded-full border border-white/25 px-2 py-0.5 text-[11px]">Sample data</span>
      <button
        onClick={() => {
          reset()
          resetChats()
          toast('Demo reset', { description: 'Connections, reports, projects and the Revive AI chat are back to the start.' })
        }}
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 hover:bg-white/10 hover:text-white"
      >
        <RotateCcw className="size-3.5" /> Reset demo
      </button>
    </div>
  )
}
