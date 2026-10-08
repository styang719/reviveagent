import { Eye, FileText, Mail, MessageCircle, MousePointerClick } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { ago, firstName } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// What the homeowner has done with what the agent sent: opened the report, clicked into a section,
// opened or answered an email. Leads the report tab, because it says whether to call today.

interface Item {
  key: string
  icon: typeof Eye
  text: string
  quote?: string
  when: string
  hot?: boolean
}

const LEAD = /ran a revive ai report|viewed|opened|clicked|replied|asked/i
const split = (line: string) => {
  const i = line.lastIndexOf(' · ')
  return i > 0 ? { text: line.slice(0, i), when: line.slice(i + 3) } : { text: line, when: '' }
}
const iconFor = (t: string) => (/repl/i.test(t) ? MessageCircle : /report/i.test(t) ? FileText : /clicked|viewed/i.test(t) ? MousePointerClick : /email/i.test(t) ? Mail : Eye)

export function LeadActivity({ o }: { o: Opportunity }) {
  const now = useNow(20_000)
  const out = useDemo((s) => s.outreach[o.id])
  const logged = useDemo((s) => s.activity[o.id])
  if (!o.person) return null
  const first = firstName(o.person.name)
  const items: Item[] = []

  if (out?.reply) items.push({ key: 'reply', icon: MessageCircle, text: `${first} replied to your email`, quote: out.reply.text, when: ago(out.reply.at, now), hot: true })
  if (out?.openedAt) items.push({ key: 'open', icon: Mail, text: `${first} opened your email “${out.subject}”`, when: ago(out.openedAt, now) })
  // things that happened here this session (e.g. they opened a shared report), then what was already on record
  for (const [i, line] of (logged ?? []).entries()) {
    const { text, when } = split(line)
    if (/^You /.test(text) || !LEAD.test(text) || /replied: “/.test(text)) continue
    items.push({ key: `s${i}`, icon: iconFor(text), text, when, hot: true })
  }
  for (const [i, line] of o.property.activity.entries()) {
    const { text, when } = split(line)
    if (/^You/.test(text) || !LEAD.test(text)) continue
    items.push({ key: `p${i}`, icon: iconFor(text), text: /^Viewed/.test(text) ? `${first} ${text.charAt(0).toLowerCase()}${text.slice(1)}` : text, when })
  }
  for (const [i, h] of (o.person.history ?? []).entries()) {
    if (h.inbound) items.push({ key: `h${i}`, icon: MessageCircle, text: `${first} replied`, quote: h.body?.replace(/^"|"$/g, ''), when: h.when ?? `${h.daysAgo} days ago` })
    else if (h.kind === 'email' && h.tag && /open/i.test(h.tag)) items.push({ key: `h${i}`, icon: Mail, text: `${h.tag}: ${h.title.replace(/^Emailed: /, '')}`, when: h.when ?? `${h.daysAgo} days ago` })
  }

  return (
    <section aria-labelledby="lead-activity" className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="lead-activity" className="text-[15px] font-semibold text-ink">
          Lead activity
        </h2>
        <span className="text-[12.5px] text-muted">What {first} has done with your report and emails</span>
      </div>
      {items.length ? (
        <ul className="mt-3 flex flex-col gap-2.5">
          {items.slice(0, 4).map(({ key, icon: Icon, text, quote, when, hot }) => (
            <li key={key} className="flex items-start gap-3">
              <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', hot ? 'bg-[var(--brand-primary)] text-white' : 'bg-[var(--brand-primary-subtle)] text-brand')}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13.5px] font-medium text-ink">{text}</p>
                  {when && <span className="shrink-0 text-[12px] text-muted">{when}</span>}
                </div>
                {quote && <p className="mt-1.5 rounded-lg bg-[var(--brand-primary-subtle)] px-3 py-2 text-[13px] text-ink-2">“{quote}”</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[13.5px] text-muted">{first} hasn’t opened anything yet. Share the report and you’ll see here when they do.</p>
      )}
    </section>
  )
}
