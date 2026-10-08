import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Clock, X } from 'lucide-react'
import { img, TagPill, tagsOf } from '@/components/home/TopOpportunities'
import { gain, money } from '@/lib/format'
import type { Opportunity, Tag } from '@/lib/opportunities'
import { cn } from '@/lib/utils'

// "Value to unlock" breakdown (Opportunities → See the breakdown), after the Contacts page: where the
// added value comes from by opportunity type, then every home ranked by it, with the agent's share.

const URGENCY: Record<string, { label: string; cls: string }> = {
  now: { label: 'This week', cls: 'bg-[var(--brand-primary)] text-white' },
  soon: { label: 'This month', cls: 'bg-navy text-white' },
  hold: { label: 'Hands off', cls: 'text-ink-2' },
  verify: { label: 'Verify first', cls: 'text-ink-2' },
}

export function ValueDrawer({ opps, open, onClose, onOpenRow, commission }: { opps: Opportunity[]; open: boolean; onClose: () => void; onOpenRow: (id: string) => void; commission: number }) {
  const list = opps.filter((o) => o.gain > 0).sort((a, b) => b.gain - a.gain)
  const total = list.reduce((n, o) => n + o.gain, 0)
  const max = list[0]?.gain || 1
  const by = new Map<Tag | 'Other', number>()
  for (const o of list) {
    const k = tagsOf(o)[0] ?? 'Other'
    by.set(k, (by.get(k) ?? 0) + o.gain)
  }
  const groups = [...by.entries()].sort((a, b) => b[1] - a[1])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy-3/30" />
        <DialogPrimitive.Content aria-describedby={undefined} className="fixed inset-y-0 right-0 z-50 flex w-[min(560px,100vw)] flex-col bg-white shadow-2xl focus:outline-none">
          <header className="relative border-b border-line px-6 pt-5 pb-4">
            <p className="text-[13px] text-muted">Value to unlock</p>
            <DialogPrimitive.Title className="mt-0.5 text-[22px] font-semibold text-ink">
              {money(total)} across {list.length} homes
            </DialogPrimitive.Title>
            <p className="mt-1 text-[14px] text-ink-2">
              About <b className="font-semibold text-[var(--green)]">+{money(Math.round(total * commission))}</b> more commission for you at {(commission * 100).toFixed(1)}% on the listing side
            </p>
            <DialogPrimitive.Close className="absolute top-5 right-5 grid size-9 place-items-center rounded-lg border border-line text-ink hover:bg-line-soft" aria-label="Close">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <section>
              <h3 className="border-b border-line pb-2.5 text-[12px] font-semibold tracking-wide text-muted uppercase">Where it comes from</h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {groups.map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between gap-3">
                    {k === 'Other' ? <span className="rounded-lg border border-dashed border-line px-2 py-1 text-[12px] font-medium text-ink-2">Other</span> : <TagPill tag={k} />}
                    <b className="text-[15px] font-semibold text-[var(--green)] tabular-nums">{gain(v)}</b>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] leading-5 text-ink-2">
                The added value each home could sell for after the work Revive would recommend, from renovated comps nearby. Your commission is that added value at your listing-side rate, so it’s extra on top of what the home would earn you today.
              </p>
            </section>

            <section className="mt-6">
              <h3 className="border-b border-line pb-2.5 text-[12px] font-semibold tracking-wide text-muted uppercase">By home</h3>
              <ul className="mt-1">
                {list.map((o) => {
                  const u = URGENCY[o.urgency]
                  const tag = tagsOf(o)[0] ?? o.product
                  return (
                    <li key={o.id} className="border-b border-line-soft last:border-0">
                      <button type="button" onClick={() => onOpenRow(o.id)} className="flex w-full items-center gap-3 py-3 text-left hover:bg-head/60">
                        <img src={img(o)} alt="" className="size-11 shrink-0 rounded-lg object-cover" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14.5px] font-semibold text-ink">{o.person?.name ?? o.property.address}</span>
                          <span className="block truncate text-[12.5px] text-muted">
                            {tag} · {o.property.city}
                          </span>
                          <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-line-soft">
                            <span className="block h-full rounded-full bg-[var(--green)]" style={{ width: `${Math.max(6, Math.round((o.gain / max) * 100))}%` }} />
                          </span>
                        </span>
                        <span className="w-[104px] shrink-0 text-right whitespace-nowrap tabular-nums">
                          <b className="block text-[15px] font-semibold text-[var(--green)]">{gain(o.gain)}</b>
                          <span className="text-[11.5px] text-muted">+{money(Math.round(o.gain * commission))} for you</span>
                        </span>
                        <span className="w-[92px] shrink-0 text-right">
                          {u && (
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold tracking-wide whitespace-nowrap uppercase', u.cls)}>
                              {o.urgency === 'now' && <Clock className="size-3" />}
                              {u.label}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>

          <footer className="border-t border-line px-6 py-3.5 text-[12.5px] text-muted">Estimates, not appraisals. Open any home to see the comps behind its number.</footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
