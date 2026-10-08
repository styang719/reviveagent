import { FileText, Mail, MessageCircle, Phone, RefreshCw, Signpost, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { CrmEvent } from '@/data/types'
import { useNow } from '@/hooks/useNow'
import { ago, firstName } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Everything that's happened with this homeowner, newest first: what the agent does here (emails, replies,
// calls, notes) on top of what the CRM already knew and what the MLS shows for the home.

type Kind = CrmEvent['kind'] | 'reply'
interface Item {
  key: string
  kind: Kind
  title: string
  body?: string
  quote?: string
  tag?: string
  when: string
}

const ICON: Record<Kind, { icon: typeof Mail; cls: string }> = {
  reply: { icon: MessageCircle, cls: 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white' },
  text: { icon: MessageCircle, cls: 'border-[var(--brand-agent-border)] text-[var(--brand-agent)]' },
  email: { icon: Mail, cls: 'border-[var(--brand-primary-border)] text-brand' },
  call: { icon: Phone, cls: 'border-[var(--brand-primary-border)] text-brand' },
  note: { icon: FileText, cls: 'border-line text-ink-2' },
  meet: { icon: Users, cls: 'border-line text-ink-2' },
  crm: { icon: UserPlus, cls: 'border-line text-ink-2' },
  mls: { icon: Signpost, cls: 'border-line text-ink-2' },
}

const DAY = 86_400_000
function dateLabel(daysAgo: number, now: number) {
  const d = new Date(now - daysAgo * DAY)
  return daysAgo > 300 ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "You called Robert · Oct 8" → { text, date } */
const split = (line: string) => {
  const i = line.lastIndexOf(' · ')
  return i > 0 ? { text: line.slice(0, i), date: line.slice(i + 3) } : { text: line, date: '' }
}

function useItems(o: Opportunity): Item[] {
  const now = useNow(20_000)
  const out = useDemo((s) => s.outreach[o.id])
  const logged = useDemo((s) => s.logged[o.id])
  const first = o.person ? firstName(o.person.name) : 'The homeowner'

  // this session, in time order: the template email, what came back, and calls and notes logged here
  const recent: (Item & { at: number })[] = []
  if (out?.answeredAt && out.reply?.intent !== 'not-now') recent.push({ key: 'answer', kind: 'email', title: `Emailed: Re: ${out.subject.replace(/^Re: /, '')}`, when: ago(out.answeredAt, now), at: out.answeredAt })
  if (out?.reply) recent.push({ key: 'reply', kind: 'reply', title: `${first} replied`, quote: out.reply.text, when: ago(out.reply.at, now), at: out.reply.at })
  if (out) recent.push({ key: 'sent', kind: 'email', title: `Emailed: ${out.subject}`, tag: out.reply ? 'Replied' : out.openedAt ? 'Opened' : 'Not opened yet', when: ago(out.sentAt, now), at: out.sentAt })
  for (const l of logged ?? [])
    recent.push({ key: `l${l.at}`, kind: l.kind, title: l.kind === 'note' ? 'Note' : l.text, body: l.kind === 'note' ? l.text : undefined, when: ago(l.at, now), at: l.at })
  const items: Item[] = recent.sort((a, b) => b.at - a.at)

  // what the CRM already knew
  for (const [i, h] of (o.person?.history ?? []).entries())
    items.push({ key: `h${i}`, kind: h.kind, title: h.title, body: h.kind !== 'crm' && h.inbound ? undefined : h.body, quote: h.inbound ? h.body : undefined, tag: h.tag, when: h.when ?? dateLabel(h.daysAgo, now) })

  // a listing or lead without CRM history: the home's own events
  if (!o.person?.history?.length)
    for (const [i, line] of [...o.property.activity].reverse().entries()) {
      const { text, date } = split(line)
      items.push({ key: `p${i}`, kind: /MLS|listing|Price/i.test(text) ? 'mls' : 'crm', title: text, when: date })
    }
  return items
}

export function ContactTimeline({ o, onMessage }: { o: Opportunity; onMessage: () => void }) {
  const items = useItems(o)
  const add = useDemo((s) => s.addActivity)
  const [noting, setNoting] = useState(false)
  const [note, setNote] = useState('')
  const [all, setAll] = useState(false)
  const first = o.person ? firstName(o.person.name) : 'the homeowner'
  const shown = all ? items : items.slice(0, 5)

  return (
    <section>
      <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5">
        <h3 className="text-[12px] font-semibold tracking-wide text-muted uppercase">Contact history</h3>
        {o.person?.source === 'Your CRM' && (
          <span className="flex items-center gap-1.5 text-[12px] text-muted">
            <RefreshCw className="size-3.5" /> Synced from Follow Up Boss
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            add(o.id, `Called ${first}`)
            toast.success(`Call with ${first} logged`)
          }}
        >
          <Phone /> Log a call
        </Button>
        <Button size="sm" variant="outline" onClick={() => setNoting((v) => !v)}>
          <FileText /> Add note
        </Button>
        {o.person && (
          <Button size="sm" variant="outline" onClick={onMessage}>
            <Mail /> Message
          </Button>
        )}
      </div>
      {noting && (
        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!note.trim()) return
            add(o.id, `Note: ${note.trim()}`)
            setNote('')
            setNoting(false)
          }}
        >
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={`A note about ${first}…`}
            className="rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
          />
          <Button size="sm" type="submit" className="self-start" disabled={!note.trim()}>
            Save note
          </Button>
        </form>
      )}

      <ol className="mt-4">
        {shown.map((it, i) => {
          const { icon: Icon, cls } = ICON[it.kind]
          const last = i === shown.length - 1
          return (
            <li key={it.key} className="relative flex gap-3 pb-5">
              {!last && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" aria-hidden="true" />}
              <span className={cn('relative grid size-8 shrink-0 place-items-center rounded-full border bg-white', cls)}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[14px] font-semibold text-ink">{it.title}</p>
                  <span className="shrink-0 text-[12.5px] text-muted">{it.when}</span>
                </div>
                {it.body && <p className="mt-0.5 text-[13px] text-ink-2">{it.body}</p>}
                {it.quote && <p className="mt-2 rounded-xl bg-[var(--brand-primary-subtle)] px-3.5 py-2.5 text-[13.5px] text-ink">“{it.quote.replace(/^"|"$/g, '')}”</p>}
                {it.tag && <span className="mt-2 inline-block rounded-full border border-line bg-head px-2.5 py-0.5 text-[12px] font-medium text-ink-2">{it.tag}</span>}
              </div>
            </li>
          )
        })}
      </ol>
      {items.length > 5 && (
        <button type="button" onClick={() => setAll((v) => !v)} className="text-[13px] font-medium text-brand hover:underline">
          {all ? 'Show less' : `Show all ${items.length}`}
        </button>
      )}
    </section>
  )
}
