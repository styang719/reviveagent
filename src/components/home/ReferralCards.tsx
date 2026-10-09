import { Gift } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const LINK = 'https://revive.re/r/michelle-phillips'

function copyLink() {
  navigator.clipboard?.writeText(LINK).catch(() => {})
  toast('Referral link copied', { description: LINK })
}

/** A small gift with a coin popping out: the Refer & Earn graphic. */
function GiftArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="34" r="28" fill="var(--teal)" opacity="0.14" />
      {/* coin */}
      <g transform="rotate(-12 44 15)">
        <circle cx="44" cy="15" r="8" fill="#f5c451" />
        <circle cx="44" cy="15" r="5.6" fill="none" stroke="#e0a82e" strokeWidth="1.4" />
        <text x="44" y="18.4" textAnchor="middle" fontSize="9" fontWeight="700" fill="#b9851a" fontFamily="inherit">$</text>
      </g>
      {/* sparkles */}
      <path d="M17 12l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#fff" opacity="0.85" />
      <circle cx="55" cy="30" r="1.6" fill="#fff" opacity="0.7" />
      {/* box */}
      <rect x="14" y="34" width="36" height="22" rx="3" fill="var(--teal)" />
      <rect x="11" y="27" width="42" height="9" rx="2.5" fill="#2fdcc1" />
      <rect x="29" y="27" width="6" height="29" fill="#fff" />
      {/* bow */}
      <path d="M32 27c-3-6-11-7-11-2.5S28 28 32 27z" fill="#fff" />
      <path d="M32 27c3-6 11-7 11-2.5S36 28 32 27z" fill="#fff" />
    </svg>
  )
}

/** Refer & Earn, in the sidebar on every page. Collapsed, it's just the gift. */
export function ReferEarn({ collapsed }: { collapsed?: boolean }) {
  if (collapsed)
    return (
      <button onClick={copyLink} title="Refer & Earn: copy your referral link" className="mx-auto mb-4 grid size-10 place-items-center rounded-lg text-sb-ink hover:bg-white/8 hover:text-white">
        <Gift className="size-4" />
      </button>
    )
  return (
    <div className="relative mb-4 overflow-hidden rounded-xl bg-white/8 p-3.5 ring-1 ring-white/10">
      <div className="flex items-start gap-3">
        <GiftArt className="size-14 shrink-0" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-white">Refer &amp; Earn</p>
          <p className="mt-0.5 text-[12.5px] leading-[18px] text-sb-ink">Earn [AMOUNT] when an agent you refer closes their first Revive deal.</p>
        </div>
      </div>
      <button
        onClick={copyLink}
        className={cn('mt-3 h-8 w-full rounded-lg bg-white text-[13px] font-medium text-navy transition-colors hover:bg-white/90')}
      >
        Copy your referral link
      </button>
    </div>
  )
}
