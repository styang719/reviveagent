import { Command } from 'cmdk'
import { Building2, Search, Sparkles, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { people } from '@/data/people'
import { gain } from '@/lib/format'
import { STAGE_LABEL, useOpportunities } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

const looksLikeAddress = (q: string) => /^\d+\s+[a-z]/i.test(q.trim())

export function GlobalSearch({ className }: { className?: string }) {
  const navigate = useNavigate()
  const opps = useOpportunities() // already filtered to what this tier can see
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onClick)
    }
  }, [])

  const term = q.trim().toLowerCase()
  const visiblePeople = useMemo(() => {
    const ids = new Set(opps.map((o) => o.person?.id).filter(Boolean))
    return people.filter((p) => ids.has(p.id))
  }, [opps])

  const propResults = term
    ? opps.filter((o) => `${o.property.address} ${o.property.city}`.toLowerCase().includes(term)).slice(0, 5)
    : opps.slice(0, 3)
  const peopleResults = term ? visiblePeople.filter((p) => p.name.toLowerCase().includes(term)).slice(0, 5) : []
  const showRun = term.length > 0 && propResults.length === 0 && looksLikeAddress(q)

  const go = (path: string) => {
    setOpen(false)
    setQ('')
    inputRef.current?.blur()
    navigate(path)
  }

  return (
    <div ref={wrapRef} className={cn('relative w-full max-w-xl', className)}>
      <Command shouldFilter={false} label="Search" className="relative">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 shadow-card focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <Sparkles className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <Command.Input
            data-global-search=""
            ref={inputRef}
            value={q}
            onValueChange={(v) => {
              setQ(v)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setOpen(false)
                inputRef.current?.blur()
              }
            }}
            placeholder="Ask Revive AI about any address or person"
            className="h-full min-w-0 flex-1 truncate bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <kbd className="hidden rounded border border-line px-1.5 text-[11px] text-muted sm:block">⌘K</kbd>
        </div>

        {open && (
          <Command.List className="absolute top-12 right-0 left-0 z-30 max-h-[420px] overflow-y-auto rounded-xl border border-line bg-white p-2 shadow-xl">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
              No matches. Type a full address to run Revive AI on it.
            </Command.Empty>

            {propResults.length > 0 && (
              <Command.Group heading={term ? 'Properties' : 'Top opportunities'} className={groupCls}>
                {propResults.map((o) => (
                  <Command.Item key={o.id} value={`p-${o.id}`} onSelect={() => go(`/property/${o.id}`)} className={itemCls}>
                    <Building2 className="size-4 text-muted" />
                    <span className="flex-1">
                      <span className="block font-medium text-ink">{o.property.address}</span>
                      <span className="block text-xs text-muted">
                        {o.property.city} · {STAGE_LABEL[o.stage]}
                        {o.person ? ` · ${o.person.name}` : ''}
                      </span>
                    </span>
                    {o.gain > 0 && <span className="text-xs font-semibold text-ok">{gain(o.gain)}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {peopleResults.length > 0 && (
              <Command.Group heading="People" className={groupCls}>
                {peopleResults.map((p) => (
                  <Command.Item key={p.id} value={`u-${p.id}`} onSelect={() => go(`/person/${p.id}`)} className={itemCls}>
                    <User className="size-4 text-muted" />
                    <span className="flex-1">
                      <span className="block font-medium text-ink">{p.name}</span>
                      <span className="block text-xs text-muted">
                        {p.relationship} · {p.source}
                      </span>
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {showRun && (
              <Command.Group heading="Revive AI" className={groupCls}>
                <Command.Item
                  value="run-ai"
                  onSelect={() => go(`/property/new?address=${encodeURIComponent(q.trim())}&tab=report`)}
                  className={itemCls}
                >
                  <Search className="size-4 text-brand" />
                  <span className="flex-1 font-medium text-brand">Run Revive AI on “{q.trim()}”</span>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>
        )}
      </Command>
    </div>
  )
}

const groupCls =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint [&_[cmdk-group-heading]]:uppercase'
const itemCls =
  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-brand-soft'
