import { ArrowRight, ArrowUp, Copy, MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Estimate, Reasons } from '@/components/opportunity/OpportunityCard'
import { UrgencyTag } from '@/components/opportunity/Tags'
import { Button } from '@/components/ui/button'
import { answer, runAiPath, type Block, type ChatMessage } from '@/lib/ai'
import { photoUrl } from '@/lib/assets'
import { flowInput } from '@/lib/flowEngine'
import { suggestAddresses } from '@/lib/flows'
import { gain, money } from '@/lib/format'
import { useConnections, useOpportunities } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import { Sparkles } from 'lucide-react'
import { FlowStepView } from './FlowSteps'

// The Revive AI conversation: thread + composer. Used on the Revive AI page and, in hand-off
// version C, docked on property pages so the conversation carries on there.

let seq = 0
const uid = () => `m${Date.now()}-${seq++}`

export function AiAvatar({ className }: { className?: string }) {
  return (
    <span className={cn('rv-ai-tile grid size-8 shrink-0 place-items-center rounded-lg text-white', className)} aria-hidden="true">
      <Sparkles className="size-4" />
    </span>
  )
}

function PropertyBlock({ b }: { b: Extract<Block, { kind: 'property' }> }) {
  const opps = useOpportunities()
  const visible = b.propertyId ? opps.find((o) => o.id === b.propertyId) : undefined
  const photo = photoUrl(b.photo)
  return (
    <div className="flex overflow-hidden rounded-xl border border-line bg-white">
      {photo && <img src={photo} alt={`Photo of ${b.address}`} className="hidden w-32 shrink-0 object-cover sm:block" />}
      <div className="min-w-0 flex-1 p-4">
        <p className="text-[15px] font-semibold text-ink">
          {b.address}
          <span className="font-normal text-muted">, {b.city}</span>
        </p>
        {b.facts.length > 0 && <p className="text-[13px] text-muted">{b.facts.join(' · ')}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm">
          <div className="rounded-lg bg-head p-2.5">
            <p className="text-[11px] text-muted">Value today</p>
            <p className="text-base font-semibold text-ink tabular-nums">{money(b.valueNow)}</p>
            <p className="text-[11px] text-muted tabular-nums">
              {money(b.valueLo)}–{money(b.valueHi)}
            </p>
          </div>
          <div className="rounded-lg bg-ok-soft/60 p-2.5">
            <p className="text-[11px] text-muted">Est. upside</p>
            <p className="text-base font-semibold text-[var(--green)] tabular-nums">{gain(b.gain)}</p>
            <p className="truncate text-[11px] text-muted">{b.product}</p>
          </div>
        </div>
        {b.sample && <p className="mt-1.5 text-[11px] text-faint">Sample estimate for the prototype.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link to={visible ? `/property/${visible.id}?tab=report` : runAiPath(`${b.address}, ${b.city}`)}>
              Open full report <ArrowRight />
            </Link>
          </Button>
          {visible?.person && (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/person/${visible.person.id}`}>See {visible.person.name.split(' ')[0]}’s history</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function OppsBlock({ ids }: { ids: string[] }) {
  const opps = useOpportunities()
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
      {ids
        .map((id) => opps.find((o) => o.id === id))
        .filter((o) => !!o)
        .map((o) => (
          <li key={o.id}>
            <Link to={`/property/${o.id}`} className="flex items-start gap-3 p-3 hover:bg-head">
              {o.photo && <img src={o.photo} alt="" className="size-14 shrink-0 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <UrgencyTag urgency={o.urgency} />
                <p className="mt-1 text-sm font-semibold text-ink">
                  {o.property.address} <span className="font-normal text-muted">· {o.person?.name ?? o.property.city}</span>
                </p>
                <Reasons o={o} max={2} />
              </div>
              <Estimate o={o} />
            </Link>
          </li>
        ))}
    </ul>
  )
}

function DraftBlock({ b }: { b: Extract<Block, { kind: 'draft' }> }) {
  const [text, setText] = useState(b.body)
  return (
    <div className="rounded-xl border border-line bg-white p-3">
      <p className="px-1 text-[12px] font-medium text-muted">To {b.to}</p>
      <label htmlFor={`draft-${b.personId}`} className="sr-only">
        Message to {b.to}
      </label>
      <textarea
        id={`draft-${b.personId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        className="mt-1 w-full resize-y rounded-lg border border-line bg-head p-3 text-sm leading-6 text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            navigator.clipboard?.writeText(text).then(
              () => toast.success('Copied'),
              () => toast('Select the text to copy it'),
            )
          }}
        >
          <Copy /> Copy
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to={`/person/${b.personId}`}>Open {b.to.split(' ')[0]}’s page</Link>
        </Button>
      </div>
    </div>
  )
}

function Blocks({ blocks, onAsk, answered }: { blocks: Block[]; onAsk: (q: string) => void; answered?: boolean }) {
  const openCrm = useUi((s) => s.openCrm)
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        if (b.kind === 'text') return <p key={i} className="text-[15px] leading-6 text-ink">{b.text}</p>
        if (b.kind === 'property') return <PropertyBlock key={i} b={b} />
        if (b.kind === 'opps') return <OppsBlock key={i} ids={b.ids} />
        if (b.kind === 'draft') return <DraftBlock key={i} b={b} />
        if (b.kind === 'flow') return <FlowStepView key={i} step={b.step} refId={b.refId} answered={answered} />
        if (b.kind === 'connect')
          return (
            <div key={i}>
              <Button size="sm" onClick={() => openCrm('Follow Up Boss')}>
                Connect your CRM
              </Button>
            </div>
          )
        return (
          <div key={i} className="flex flex-wrap gap-2">
            {b.items.map((s) => (
              <button key={s} onClick={() => onAsk(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-[13px] text-ink-2 hover:border-brand hover:text-brand">
                {s}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}


/** Ask Revive AI: free questions get an answer; while a guided flow waits for an address, it goes to the flow. */
export function useAsk() {
  const addChat = useUi((s) => s.addChat)
  const opps = useOpportunities()
  const { crm } = useConnections()
  const markReportGenerated = useDemo((s) => s.markReportGenerated)
  const [thinking, setThinking] = useState(false)
  const ask = (q: string) => {
    const text = q.trim()
    if (!text || thinking) return
    if (flowInput(text)) return
    addChat({ id: uid(), role: 'user', text })
    setThinking(true)
    setTimeout(() => {
      const blocks = answer(text, { opps, crm })
      if (blocks.some((b) => b.kind === 'property')) markReportGenerated()
      addChat({ id: uid(), role: 'ai', blocks })
      setThinking(false)
    }, 750)
  }
  return { ask, thinking }
}

export function Thread({ onAsk, thinking, compact = false }: { onAsk: (q: string) => void; thinking: boolean; compact?: boolean }) {
  const chat = useUi((s) => s.chat)
  const endRef = useRef<HTMLLIElement>(null)
  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [chat, thinking])
  return (
    <ol className={cn('flex flex-col', compact ? 'gap-4' : 'gap-6')} aria-live="polite">
      {chat.map((m: ChatMessage) =>
        m.role === 'user' ? (
          <li key={m.id} className="flex justify-end">
            <p className={cn('max-w-[85%] rounded-2xl rounded-br-md bg-navy text-white', compact ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-[15px]')}>{m.text}</p>
          </li>
        ) : (
          <li key={m.id} className="flex gap-3">
            <AiAvatar className={compact ? 'size-7' : undefined} />
            <div className="min-w-0 flex-1 pt-1">
              <Blocks blocks={m.blocks ?? []} onAsk={onAsk} answered={m.answered} />
            </div>
          </li>
        ),
      )}
      {thinking && (
        <li className="flex gap-3" aria-label="Revive AI is thinking">
          <AiAvatar />
          <span className="rv-typing mt-3 flex gap-1">
            <i />
            <i />
            <i />
          </span>
        </li>
      )}
      <li ref={endRef} aria-hidden="true" />
    </ol>
  )
}

export function Composer({ onAsk, disabled, autoFocus = false, compact = false }: { onAsk: (q: string) => void; disabled?: boolean; autoFocus?: boolean; compact?: boolean }) {
  const [draft, setDraft] = useState('')
  const [active, setActive] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const awaiting = useUi((s) => s.flow?.awaiting)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (autoFocus || awaiting) ref.current?.focus()
  }, [autoFocus, awaiting])

  // address autofill while a flow is waiting for an address
  const suggestions = awaiting === 'address' && !dismissed ? suggestAddresses(draft) : []
  const open = suggestions.length > 0
  const listId = compact ? 'addr-list-dock' : 'addr-list'

  const sendText = (text: string) => {
    if (!text.trim() || disabled) return
    onAsk(text)
    setDraft('')
    setActive(0)
    setDismissed(false)
  }
  return (
    <div className="relative w-full">
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Address suggestions"
          className="absolute right-0 bottom-full left-0 z-20 mb-2 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl"
        >
          {suggestions.map((sg, i) => (
            <li
              key={sg.value}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                sendText(sg.value)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-center gap-3 px-3 py-2', i === active && 'bg-[var(--brand-primary-subtle)]')}
            >
              <MapPin className={cn('size-4 shrink-0', sg.known ? 'text-[var(--brand-agent)]' : 'text-muted')} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">{sg.line}</span>
                <span className="block truncate text-[12px] text-muted">{sg.area}</span>
              </span>
              {sg.known && <span className="shrink-0 rounded-full bg-[var(--brand-agent-subtle)] px-2 py-0.5 text-[11px] font-medium text-[var(--brand-agent)]">On record</span>}
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex w-full items-end gap-2 rounded-2xl border border-line bg-white p-2 pl-4 shadow-card focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"
        onSubmit={(e) => {
          e.preventDefault()
          sendText(open ? suggestions[active].value : draft)
        }}
      >
        <label htmlFor={compact ? 'ai-input-dock' : 'ai-input'} className="sr-only">
          {awaiting === 'address' ? 'Property address' : 'Ask Revive AI'}
        </label>
        <textarea
          id={compact ? 'ai-input-dock' : 'ai-input'}
          ref={ref}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setActive(0)
            setDismissed(false)
          }}
          onKeyDown={(e) => {
            if (open && e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => (a + 1) % suggestions.length)
            } else if (open && e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => (a - 1 + suggestions.length) % suggestions.length)
            } else if (open && e.key === 'Escape') {
              setDismissed(true)
            } else if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendText(open ? suggestions[active].value : draft)
            }
          }}
          rows={1}
          role={awaiting === 'address' ? 'combobox' : undefined}
          aria-expanded={awaiting === 'address' ? open : undefined}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open ? `${listId}-${active}` : undefined}
          aria-autocomplete={awaiting === 'address' ? 'list' : undefined}
          autoComplete="off"
          placeholder={awaiting === 'address' ? 'Start typing the address' : 'Ask Revive AI anything'}
          className={cn('max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-ink outline-none placeholder:text-faint', compact ? 'text-sm' : 'text-[15px]')}
        />
        <button type="submit" disabled={!draft.trim() || disabled} className="rv-ai-btn grid size-10 shrink-0 place-items-center rounded-xl text-white disabled:opacity-40" aria-label="Send">
          <ArrowUp className="size-5" />
        </button>
      </form>
    </div>
  )
}
