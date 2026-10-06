import { ArrowRight, ArrowUp, Copy, Hammer, Home as HomeIcon, MessageSquareText, RotateCcw, Sparkles, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Estimate, Reasons } from '@/components/opportunity/OpportunityCard'
import { UrgencyTag } from '@/components/opportunity/Tags'
import { runAiPath } from '@/components/shell/GlobalSearch'
import { Button } from '@/components/ui/button'
import { answer, STARTERS, type Block, type ChatMessage } from '@/lib/ai'
import { photoUrl } from '@/lib/assets'
import { gain, money } from '@/lib/format'
import { useConnections, useOpportunities } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'

// Revive AI as its own page: a chat about any home or anyone in the agent's book.
// Answers come from the sample data (see lib/ai.ts), shown as cards she can act on.

const STARTER_ICONS = [Hammer, Users, HomeIcon, MessageSquareText]
let seq = 0
const uid = () => `m${Date.now()}-${seq++}`

function AiAvatar({ className }: { className?: string }) {
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
            <p className="text-base font-semibold text-[#08795a] tabular-nums">{gain(b.gain)}</p>
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

function Blocks({ blocks, onAsk }: { blocks: Block[]; onAsk: (q: string) => void }) {
  const openCrm = useUi((s) => s.openCrm)
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b, i) => {
        if (b.kind === 'text') return <p key={i} className="text-[15px] leading-6 text-ink">{b.text}</p>
        if (b.kind === 'property') return <PropertyBlock key={i} b={b} />
        if (b.kind === 'opps') return <OppsBlock key={i} ids={b.ids} />
        if (b.kind === 'draft') return <DraftBlock key={i} b={b} />
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

export default function ReviveAI() {
  const chat = useUi((s) => s.chat)
  const addChat = useUi((s) => s.addChat)
  const clearChat = useUi((s) => s.clearChat)
  const opps = useOpportunities()
  const { crm } = useConnections()
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), [chat.length, thinking])
  useEffect(() => inputRef.current?.focus(), [])

  const ask = (q: string) => {
    const text = q.trim()
    if (!text || thinking) return
    addChat({ id: uid(), role: 'user', text })
    setDraft('')
    setThinking(true)
    setTimeout(() => {
      addChat({ id: uid(), role: 'ai', blocks: answer(text, { opps, crm }) })
      setThinking(false)
    }, 750)
  }

  const empty = chat.length === 0

  return (
    <div className="flex h-[calc(100dvh-var(--demo-h,0px)-65px)] flex-col lg:h-[calc(100dvh-var(--demo-h,0px))]">
      <header className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-10 sm:pt-8">
        <h1 className="flex items-center gap-2.5 text-xl font-semibold text-ink">
          <AiAvatar /> Revive AI
        </h1>
        {!empty && (
          <Button variant="outline" size="sm" onClick={clearChat}>
            <RotateCcw /> New chat
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {empty ? (
            <div className="flex flex-col items-center pt-6 text-center sm:pt-14">
              <span className="rv-ai-tile grid size-16 place-items-center rounded-2xl text-white">
                <Sparkles className="size-8" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold text-balance text-ink sm:text-[28px]">What can I help you find?</h2>
              <p className="mt-2 max-w-md text-[15px] text-ink-2">Ask about any home or anyone in your book. I’ll pull the value, the renovation upside and who to call.</p>
              <div className="mt-8 grid w-full gap-3 text-left sm:grid-cols-2">
                {STARTERS.map((s, i) => {
                  const Icon = STARTER_ICONS[i]
                  return (
                    <button
                      key={s}
                      onClick={() => ask(s)}
                      className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-left text-sm text-ink-2 shadow-card transition-colors hover:border-brand hover:text-ink"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-brand" />
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <ol className="flex flex-col gap-6" aria-live="polite">
              {chat.map((m: ChatMessage) =>
                m.role === 'user' ? (
                  <li key={m.id} className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl rounded-br-md bg-navy px-4 py-2.5 text-[15px] text-white">{m.text}</p>
                  </li>
                ) : (
                  <li key={m.id} className="flex gap-3">
                    <AiAvatar />
                    <div className="min-w-0 flex-1 pt-1">
                      <Blocks blocks={m.blocks ?? []} onAsk={ask} />
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
            </ol>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-10 sm:pb-8">
        <form
          className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-line bg-white p-2 pl-4 shadow-card focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10"
          onSubmit={(e) => {
            e.preventDefault()
            ask(draft)
          }}
        >
          <label htmlFor="ai-input" className="sr-only">
            Ask Revive AI
          </label>
          <textarea
            id="ai-input"
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                ask(draft)
              }
            }}
            rows={1}
            placeholder="Ask about an address, a contact, or who to call"
            className="max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="submit"
            disabled={!draft.trim() || thinking}
            className="rv-ai-tile grid size-10 shrink-0 place-items-center rounded-xl text-white disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="size-5" />
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[12px] text-faint">Prototype: answers come from sample data. Estimates aren’t appraisals.</p>
      </div>
    </div>
  )
}
