import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
      <path d="M17 12l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="var(--brand-primary)" opacity="0.5" />
      <circle cx="55" cy="30" r="1.6" fill="var(--brand-primary)" opacity="0.4" />
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

/** Refer & Earn, at the bottom of the dashboard's right column for every agent. */
export function ReferEarn() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <GiftArt className="size-14 shrink-0" />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-ink">Refer &amp; Earn</h2>
          <p className="mt-1 text-sm text-ink-2">Know an agent who should work with Revive? Earn [AMOUNT] when they close their first Revive deal.</p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="mt-3 w-full" onClick={copyLink}>
        Copy your referral link
      </Button>
    </Card>
  )
}
