import { House, MapPin, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'
import { suggestAddresses } from '@/lib/flows'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'

// Properties → Revive projects, when there are none yet: an AI address search. Picking a home starts the
// conversation with Revive AI in the docked chat (confirm the home, then sell, flip, stay or a report).
export function StartWithRevive() {
  const requestAi = useUi((s) => s.requestAi)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestions = dismissed ? [] : suggestAddresses(q)
  const open = suggestions.length > 0
  const go = (address: string) => {
    requestAi(`/ai?flow=home&address=${encodeURIComponent(address)}`)
    setQ('')
    setActive(0)
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-[var(--brand-primary-subtle)] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h3 className="text-lg font-semibold text-ink">Have a property in mind?</h3>
        <p className="mt-1.5 text-[14px] text-ink-2">Enter the address to start the conversation with Revive.</p>
      </div>
      <form
        className="relative flex w-full flex-col gap-3 sm:flex-row lg:max-w-[600px]"
        onSubmit={(e) => {
          e.preventDefault()
          if (open) return go(suggestions[active].value)
          if (!q.trim()) return inputRef.current?.focus()
          go(q.trim())
        }}
      >
        <label className="relative flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line bg-white px-4 focus-within:border-[var(--brand-agent-border)] focus-within:ring-2 focus-within:ring-[var(--brand-agent-subtle)]">
          <House className="size-[18px] shrink-0 text-muted" aria-hidden="true" />
          <span className="sr-only">Property address</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setActive(0)
              setDismissed(false)
            }}
            onKeyDown={(e) => {
              if (!open) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => (a + 1) % suggestions.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => (a - 1 + suggestions.length) % suggestions.length)
              } else if (e.key === 'Escape') setDismissed(true)
            }}
            onBlur={() => setTimeout(() => setDismissed(true), 120)}
            onFocus={() => setDismissed(false)}
            role="combobox"
            aria-expanded={open}
            aria-controls={open ? 'start-revive-list' : undefined}
            aria-autocomplete="list"
            placeholder="Enter a property address"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
        </label>
        {open && (
          <ul
            id="start-revive-list"
            role="listbox"
            aria-label="Address suggestions"
            className="absolute top-[3.25rem] left-0 z-30 w-full overflow-hidden rounded-xl border border-line bg-white py-1.5 shadow-[0_16px_40px_rgba(28,46,88,0.16)] sm:w-[calc(100%-11.25rem)]"
          >
            {suggestions.map((sg, i) => (
              <li
                key={sg.value}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault()
                  go(sg.value)
                }}
                onMouseEnter={() => setActive(i)}
                className={cn('flex cursor-pointer items-center gap-3 px-4 py-2.5', i === active && 'bg-[var(--brand-primary-subtle)]')}
              >
                <MapPin className={cn('size-4 shrink-0', sg.known ? 'text-[var(--brand-agent)]' : 'text-muted')} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink">{sg.line}</span>
                  <span className="block truncate text-[12px] text-muted">{sg.area}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <button type="submit" className="rv-ai-btn flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white">
          <Sparkles className="size-4" /> Ask Revive AI
        </button>
      </form>
    </div>
  )
}
