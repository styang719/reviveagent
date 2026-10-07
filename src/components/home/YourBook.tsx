import { BadgeCheck, Contact, Home as HomeIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { plural } from '@/lib/format'
import { useConnections, type Opportunity } from '@/lib/opportunities'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'
import { ContactExample, ListingExample } from './BookExamples'
import { LicenseForm } from './ConnectBook'

// "Your opportunities" before the book is fully connected: the two sources side by side,
// each saying what it pulls in, so it's clear both are needed (not either/or).
export function YourBook({ opps }: { opps: Opportunity[] }) {
  const conn = useConnections()
  const openStep = useUi((s) => s.openStep)
  const openCrm = useUi((s) => s.openCrm)
  if (conn.mls && conn.crm) return null
  const listings = opps.filter((o) => o.property.source === 'listings').length
  const contacts = opps.filter((o) => o.property.source === 'contacts').length
  const connected = [conn.mls, conn.crm].filter(Boolean).length

  const sources = [
    {
      key: 'mls',
      icon: HomeIcon,
      title: 'Your listings',
      from: 'from the MLS',
      body: 'See which listings would sell faster, or for more, with Revive.',
      done: conn.mls,
      result: `${plural(listings, 'active listing')} found`,
      cta: 'Add license number',
      onClick: () => {
        openStep('license')
        document.getElementById('setup')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      },
    },
    {
      key: 'crm',
      icon: Contact,
      title: 'Your contacts',
      from: 'from your CRM',
      body: 'Homeowners you know who are likely to sell or renovate.',
      done: conn.crm,
      result: `${plural(contacts, 'contact')} checked`,
      cta: 'Connect CRM',
      onClick: () => openCrm('Follow Up Boss'),
    },
  ]

  return (
    <section aria-labelledby="book-title">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="book-title" className="text-xl font-semibold text-ink">
            {connected ? 'Connect the rest of your book' : 'Your opportunities'}
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">Revive pulls in two sources and ranks who to call, and why. Connect both to see everyone.</p>
        </div>
        <span className="rounded-full bg-line-soft px-2.5 py-1 text-xs font-medium text-ink-2 tabular-nums">{connected} of 2 connected</span>
      </div>
      {/* the two sources side by side; until one is connected it shows an example of what it brings in */}
      <div className="grid gap-5 sm:grid-cols-2">
        {sources.map((s) => (
          // each source is its own tinted panel: what it is, an example of what it brings in, the button
          <div key={s.key} className={cn('flex min-w-0 flex-col gap-6 rounded-2xl p-5 2xl:p-6', s.done ? 'bg-ok-soft/60' : 'bg-[var(--brand-primary-subtle)]')}>
            <div>
              <p className="text-lg font-semibold text-ink">
                {s.title} <span className="font-normal text-muted">{s.from}</span>
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-ink-2">{s.body}</p>
            </div>
            {!s.done && <div className="mt-1 flex-1">{s.key === 'mls' ? <ListingExample /> : <ContactExample />}</div>}
            <div>
              {s.done ? (
                <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--green)]">
                  <BadgeCheck className="size-4" /> {s.result}
                </p>
              ) : s.key === 'mls' ? (
                <LicenseForm inline />
              ) : (
                <div className="flex justify-end">
                  <Button onClick={s.onClick}>{s.cta}</Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
