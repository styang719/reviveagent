import { ArrowRight, Mail, Megaphone, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import avatar from '@/assets/avatar-michelle.jpg'
import mark from '@/assets/revive-mark.svg'
import after from '@/assets/cases/case-2.jpg'
import { Button } from '@/components/ui/button'
import { AGENT } from '@/data/tiers'
import { photoUrl } from '@/lib/assets'

// Dashboard (connected new agent): marketing made for them. Each example is a small, real-looking
// preview of a piece Revive drafts with the agent's photo, name and license, ready to send or post.

const before = photoUrl('comp-101-1')
const brand = (
  <span className="flex items-center gap-1.5">
    <img src={avatar} alt="" className="size-5 rounded-full object-cover" />
    <span className="text-[9.5px] leading-3 font-semibold text-ink">
      {AGENT.name}
      <span className="block font-normal text-muted">DRE #02134589</span>
    </span>
  </span>
)

function BeforeAfter() {
  return (
    <div className="flex h-full flex-col rounded-lg bg-white p-2.5 shadow-sm">
      <div className="grid flex-1 grid-cols-2 gap-1 overflow-hidden rounded-md">
        <span className="relative">
          <img src={before} alt="" className="size-full object-cover grayscale-[40%]" />
          <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 text-[8.5px] font-semibold text-white">BEFORE</span>
        </span>
        <span className="relative">
          <img src={after} alt="" className="size-full object-cover" />
          <span className="absolute bottom-1 left-1 rounded bg-[var(--brand-primary)] px-1 text-[8.5px] font-semibold text-white">AFTER</span>
        </span>
      </div>
      <p className="mt-2 text-[11px] leading-4 font-semibold text-ink">Sold 12 days after a Revive refresh</p>
      <div className="mt-1.5">{brand}</div>
    </div>
  )
}

function OnePager() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between bg-navy px-2.5 py-2">
        <img src={mark} alt="" className="h-3.5 brightness-0 invert" />
        <span className="text-[8.5px] font-semibold tracking-wide text-[var(--teal)] uppercase">Renovate to Sell</span>
      </div>
      <div className="flex-1 p-2.5">
        <p className="text-[11.5px] leading-4 font-semibold text-ink">Sell for more, pay nothing up front</p>
        <ul className="mt-1.5 flex flex-col gap-1">
          {['Revive covers the work', 'Repaid at closing', 'Lists in about 6 weeks'].map((x) => (
            <li key={x} className="flex items-center gap-1.5 text-[9.5px] text-ink-2">
              <span className="size-1 rounded-full bg-[var(--brand-primary)]" /> {x}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[16px] font-semibold text-[var(--green)]">+$62K</p>
        <p className="text-[8.5px] text-muted">average upside nearby</p>
      </div>
      <div className="border-t border-line px-2.5 py-1.5">{brand}</div>
    </div>
  )
}

function EmailPreview() {
  return (
    <div className="flex h-full flex-col rounded-lg bg-white p-2.5 shadow-sm">
      <p className="flex items-center gap-1 text-[9px] text-muted">
        <Mail className="size-3" /> To: your homeowners
      </p>
      <p className="mt-1 text-[11px] leading-4 font-semibold text-ink">What your home could sell for this spring</p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        <span className="rounded-md bg-head px-1.5 py-1">
          <span className="block text-[8px] text-muted">Value today</span>
          <span className="text-[11px] font-semibold text-ink">$972K</span>
        </span>
        <span className="rounded-md bg-ok-soft px-1.5 py-1">
          <span className="block text-[8px] text-muted">With Revive</span>
          <span className="text-[11px] font-semibold text-[var(--green)]">+$148K</span>
        </span>
      </div>
      <span className="mt-2 self-start rounded bg-[var(--brand-primary)] px-2 py-0.5 text-[9px] font-semibold text-white">See your report</span>
      <div className="mt-auto pt-2">{brand}</div>
    </div>
  )
}

const ITEMS = [
  { name: 'Before & after post', body: 'Instagram and Facebook, from a Revive project near you', Preview: BeforeAfter },
  { name: 'Seller one-pager', body: 'Renovate to Sell, explained for a listing appointment', Preview: OnePager },
  { name: 'Home value email', body: 'Each contact’s own numbers, sent from you', Preview: EmailPreview },
]

export function MarketingCenter() {
  return (
    <section aria-labelledby="marketing-center">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 id="marketing-center" className="flex items-center gap-2 text-xl font-semibold text-ink">
            <Megaphone className="size-5 text-brand" /> Marketing center
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">Generate marketing materials branded for you: your photo, name and license on every piece.</p>
        </div>
        <Button variant="ghost" className="h-10 shrink-0 px-3 text-[14px] text-brand" asChild>
          <Link to="/marketing">
            Open Marketing <ArrowRight />
          </Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {ITEMS.map(({ name, body, Preview }) => (
          <article key={name} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <div className="h-64 bg-[var(--brand-primary-subtle)] p-4">
              <Preview />
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="text-[14.5px] font-semibold text-ink">{name}</p>
              <p className="mt-0.5 mb-3 text-[12.5px] text-muted">{body}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-auto h-9 self-start text-brand"
                onClick={() => toast.success(`${name} is ready`, { description: 'Branded with your photo, name and license. Find it in Marketing.' })}
              >
                <Sparkles /> Generate
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
