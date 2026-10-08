import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, Hammer, HousePlus, Mail, Plus, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AGENT } from '@/data/tiers'
import { firstName, money } from '@/lib/format'
import type { Opportunity, Tag } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// A ready-to-send email for one opportunity, from a template that matches what Revive spotted
// (listing issue, ADU room, renovation). Details pulled from the record are highlighted so the agent
// can check them; the body is editable in place.

type Seg = string | { v: string } // { v } = a detail from the record, highlighted
interface Template {
  key: string
  label: string
  icon: typeof Mail
  subject: string
  body: Seg[][] // paragraphs
  attach: string[]
}

const street = (o: Opportunity) => o.property.address.split(' ').slice(1).join(' ')
const ago = (d: number) => (d <= 7 ? 'this week' : d <= 45 ? `${d} days ago` : 'recently')

function templates(o: Opportunity): Template[] {
  const hi: Seg[] = ['Hi ', { v: o.person ? firstName(o.person.name) : 'there' }, ',']
  const sign: Seg[] = [`Warmly,\n${AGENT.firstName}`]
  const f = o.property.facts
  const st = street(o)
  const upside = o.gain ? money(o.gain) : null
  const city = o.property.city
  const out: Template[] = []
  const tags: Tag[] = o.tags.length ? o.tags : ['Renovation']

  if (tags.includes('Listing issue')) {
    if (o.property.source === 'listings')
      out.push({
        key: 'listing',
        label: 'Listing issue',
        icon: AlertTriangle,
        subject: `A faster path for ${st}`,
        body: [
          hi,
          ["We're at ", { v: `${f.daysOnMarket} days on market` }, ', while renovated homes nearby are selling in about ', { v: '12 days' }, '.'],
          ["One option worth a look is Revive's Renovate to Sell: Revive covers a refresh of the kitchen, baths and paint now and is repaid at closing, so nothing comes out of pocket.", ...(upside ? [' Revive estimates it could add about ', { v: upside }, ' to the sale.'] : [])],
          ["If you're open to it, I can walk you through the numbers this week."],
          sign,
        ],
        attach: ['Renovate to Sell one-pager', `${city} market snapshot`],
      })
    else
      out.push({
        key: 'listing',
        label: 'Listing issue',
        icon: AlertTriangle,
        subject: `About your home on ${st}`,
        body: [
          hi,
          ['I noticed your home came off the market ', { v: ago(f.expiredDaysAgo ?? f.withdrawnDaysAgo ?? 99) }, ". That's frustrating, especially after all the work of getting it listed."],
          ["One approach that's been working well nearby is Revive's Sell 360: a light refresh and staging before relisting, with Revive covering the cost until it sells. I've attached a one-pager on how it works."],
          ['If it would help, I can put together a no-commitment relaunch plan for ', { v: st }, '. Happy to chat whenever suits you.'],
          sign,
        ],
        attach: ['Sell 360 one-pager', `${city} market snapshot`],
      })
  }
  if (tags.includes('ADU room')) {
    const adu = o.property.scenarios.find((s) => s.product.includes('ADU') && s.gain)
    out.push({
      key: 'adu',
      label: 'ADU room',
      icon: HousePlus,
      subject: `Your lot on ${st} has room for an ADU`,
      body: [
        hi,
        ['Your lot on ', { v: st }, " has room for a detached ADU, which most homes nearby don't."],
        ["With Revive's Renovate to Stay + ADU, Revive builds it and you pay over time, so it can start earning rent before it's paid off.", ...(adu?.gain ? [' Revive estimates it adds about ', { v: money(adu.gain) }, ' in value.'] : []), " I've attached a short guide."],
        ['Want me to send the numbers for your lot?'],
        sign,
      ],
      attach: ['ADU guide', `Revive AI report · ${o.property.address}`],
    })
  }
  if (tags.includes('Renovation')) {
    out.push({
      key: 'renovation',
      label: 'Renovation',
      icon: Hammer,
      subject: `What your home on ${st} could sell for`,
      body: [
        hi,
        ['I ran the numbers on your home on ', { v: st }, '.', ...(upside ? [' With an updated kitchen and baths, homes like yours nearby are selling for about ', { v: upside }, ' more.'] : [])],
        ["Revive's ", { v: o.product ?? 'Renovate to Sell' }, " covers the work up front and is repaid at closing. I've attached your Revive AI report with the details."],
        ['Happy to talk it through whenever suits you.'],
        sign,
      ],
      attach: [`Revive AI report · ${o.property.address}`, 'Renovate to Sell one-pager'],
    })
  }
  return out
}

const MORE = (o: Opportunity) => [`Revive AI report · ${o.property.address}`, `Recent Revive projects in ${o.property.city}`, 'How Revive works']

export function MessageDialog({ o, open, onOpenChange }: { o: Opportunity; open: boolean; onOpenChange: (v: boolean) => void }) {
  const list = templates(o)
  const [key, setKey] = useState(list[0]?.key)
  const [version, setVersion] = useState(0) // bump to reset the editable body
  const t = list.find((x) => x.key === key) ?? list[0]
  const [subject, setSubject] = useState(t.subject)
  const [attach, setAttach] = useState(t.attach)
  const log = useDemo((s) => s.logMessage)
  const name = o.person?.name ?? 'the homeowner'
  const email = o.person ? `${o.person.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com` : ''
  const role = o.property.ownerRole === 'Seller' ? 'Your seller' : (o.person?.relationship ?? 'Homeowner')

  const pick = (k: string) => {
    const n = list.find((x) => x.key === k)!
    setKey(k)
    setSubject(n.subject)
    setAttach(n.attach)
    setVersion((v) => v + 1)
  }
  const extra = MORE(o).find((m) => !attach.includes(m))

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy-3/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100%-32px)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl focus:outline-none"
        >
          <div className="px-6 pt-6 pb-4">
            <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">Message · {role}</p>
            <DialogPrimitive.Title className="mt-1 text-2xl font-semibold text-ink">{name}</DialogPrimitive.Title>
            {list.length > 1 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-muted">Template</span>
                {list.map((x) => (
                  <button
                    key={x.key}
                    type="button"
                    onClick={() => pick(x.key)}
                    aria-pressed={x.key === t.key}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors',
                      x.key === t.key ? 'border-navy bg-navy text-white' : 'border-line text-ink hover:border-[var(--brand-primary-border)]',
                    )}
                  >
                    <x.icon className="size-4" /> {x.label}
                  </button>
                ))}
              </div>
            )}
            <DialogPrimitive.Close className="absolute top-5 right-5 grid size-10 place-items-center rounded-full border border-line text-ink hover:bg-line-soft" aria-label="Close">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto border-t border-line px-6 pb-6">
            <div className="flex items-center gap-4 border-b border-line py-3.5 text-[14px]">
              <span className="w-16 shrink-0 text-muted">To</span>
              <span className="font-semibold text-ink">{name}</span>
              <span className="truncate text-muted">{email}</span>
            </div>
            <label className="flex items-center gap-4 border-b border-line py-2.5 text-[14px]">
              <span className="w-16 shrink-0 text-muted">Subject</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="min-w-0 flex-1 rounded-md px-2 py-1.5 font-semibold text-ink outline-none focus:ring-2 focus:ring-[var(--brand-primary-border)]" />
            </label>
            <div
              key={`${t.key}-${version}`}
              contentEditable
              suppressContentEditableWarning
              aria-label="Message"
              role="textbox"
              aria-multiline="true"
              className="mt-4 flex flex-col gap-3.5 rounded-xl border border-line p-5 text-[15px] leading-7 text-ink outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
            >
              {t.body.map((para, i) => (
                <p key={i} className="whitespace-pre-line">
                  {para.map((seg, j) =>
                    typeof seg === 'string' ? (
                      seg
                    ) : (
                      <span key={j} className="rounded bg-[var(--brand-primary-subtle)] px-0.5 underline decoration-[var(--brand-primary)] decoration-dotted underline-offset-4">
                        {seg.v}
                      </span>
                    ),
                  )}
                </p>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-2 text-[13px] text-muted">
              <Sparkles className="size-3.5 text-[var(--brand-primary)]" /> Highlighted details come from {o.person ? `${firstName(o.person.name)}’s` : 'the'} record. Give them a look before you send.
            </p>

            <p className="mt-6 text-[14px] font-semibold text-ink">
              Attached <span className="ml-2 font-normal text-muted">Branded with your photo, logo and license</span>
            </p>
            <ul className="mt-3 flex flex-col gap-2.5">
              {attach.map((a) => (
                <li key={a} className="flex items-center gap-3 rounded-xl border border-line bg-head/60 px-3 py-2.5">
                  <span className="grid h-12 w-10 shrink-0 place-items-center rounded-md border border-line bg-white text-[9px] font-bold text-[var(--green)]">PDF</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ink">{a}</span>
                    <span className="text-[12.5px] text-muted">PDF · {a.startsWith('Revive AI report') ? '4 pages' : a.includes('one-pager') ? '2 pages' : '1 page'}</span>
                  </span>
                  <button type="button" onClick={() => setAttach((l) => l.filter((x) => x !== a))} className="rounded-md p-1.5 text-muted hover:bg-line-soft hover:text-ink" aria-label={`Remove ${a}`}>
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            {extra && (
              <button
                type="button"
                onClick={() => setAttach((l) => [...l, extra])}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--brand-primary-border)] px-3.5 py-2 text-[13.5px] font-semibold text-brand hover:bg-[var(--brand-primary-subtle)]"
              >
                <Plus className="size-4" /> Add material
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-line px-6 py-4">
            <Button variant="ghost" onClick={() => pick(t.key)}>
              Reset template
            </Button>
            <Button
              variant="outline"
              className="ml-auto h-10"
              onClick={() => {
                toast.success('Draft saved')
                onOpenChange(false)
              }}
            >
              Save draft
            </Button>
            <Button
              className="h-10"
              onClick={() => {
                log(o.id, `You emailed ${name}: “${subject}”`)
                toast.success(`Email sent to ${name}`, { description: 'Logged on the home and ticked off this week’s list.' })
                onOpenChange(false)
              }}
            >
              <Mail /> Send email
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
