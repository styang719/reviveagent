import { Command } from 'cmdk'
import { MapPin, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { looksLikeAddress, lookupAddress, lookupProperty, searchAddresses } from '@/lib/lookup'
import { useUi } from '@/store/ui'

// The big Home search for a new agent. It doesn't leave the page: the address lands on the
// map below with a preview card, so the search and the map tell one story.
export function HeroSearch() {
  const setLookup = useUi((s) => s.setLookup)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  const matches = searchAddresses(q)
  const term = q.trim()
  const canRun = looksLikeAddress(term) && !matches.some((p) => p.address.toLowerCase() === term.toLowerCase())

  const show = (l: ReturnType<typeof lookupAddress>) => {
    setLookup(l)
    setOpen(false)
    setQ(`${l.address}, ${l.city}`)
    inputRef.current?.blur()
    document.getElementById('book-map')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const submit = () => {
    if (!term) return inputRef.current?.focus()
    if (matches[0]) return show(lookupProperty(matches[0]))
    show(lookupAddress(term))
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <Command shouldFilter={false} label="Look up an address" className="relative">
        <div className="flex h-16 items-center gap-2 rounded-2xl border border-line bg-white pr-2 pl-5 shadow-card focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
          <Sparkles className="size-5 shrink-0 text-brand" aria-hidden="true" />
          <Command.Input
            ref={inputRef}
            data-hero-search=""
            value={q}
            onValueChange={(v) => {
              setQ(v)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false)
              if (e.key === 'Enter' && !(open && term)) submit()
            }}
            placeholder="Enter an address"
            className="h-full min-w-0 flex-1 truncate bg-transparent text-base text-ink outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={submit}
            className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white hover:bg-primary-hover sm:px-5"
          >
            <Sparkles className="size-4" />
            <span className="hidden sm:inline">Generate insights</span>
            <span className="sm:hidden">Go</span>
          </button>
        </div>
        {open && term && (
          <Command.List className="absolute top-[72px] right-0 left-0 z-[1100] max-h-80 overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-xl">
            <Command.Empty className="px-3 py-5 text-center text-sm text-muted">Type a street address, like 412 Oak Ave.</Command.Empty>
            {matches.map((p) => (
              <Command.Item key={p.id} value={p.id} onSelect={() => show(lookupProperty(p))} className={itemCls}>
                <MapPin className="size-4 text-muted" />
                <span className="flex-1">
                  <span className="block font-medium text-ink">{p.address}</span>
                  <span className="block text-xs text-muted">{p.city}, CA</span>
                </span>
              </Command.Item>
            ))}
            {canRun && (
              <Command.Item value="__run" onSelect={() => show(lookupAddress(term))} className={itemCls}>
                <Sparkles className="size-4 text-brand" />
                <span className="flex-1 font-medium text-brand">Look up “{term}”</span>
              </Command.Item>
            )}
          </Command.List>
        )}
      </Command>
    </div>
  )
}

const itemCls = 'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-brand-soft'
