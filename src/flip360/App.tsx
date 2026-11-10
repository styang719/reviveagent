import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import wordmark from '@/assets/revive-wordmark.svg'
import OpportunityMap from './OpportunityMap'
import { ReviveMark } from './Summary'

// The Flip360 opportunity map as its own app. On a phone it fills the screen; on a wider screen it sits in a
// phone frame, with a short note on what it is and how to read the pins.

const wide = () => typeof window !== 'undefined' && window.innerWidth >= 640

function Legend() {
  const rows = [
    { pin: <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[var(--green)] px-2 text-[11.5px] font-bold text-white"><ReviveMark className="h-[11px] w-[10px]" />$899K</span>, label: 'Flip360 opportunity', sub: 'Qualified by Revive: worth pursuing' },
    { pin: <span className="inline-flex h-6 items-center gap-1 rounded-full border-[1.5px] border-[var(--green)] bg-white px-2 text-[11.5px] font-bold text-[var(--green)]"><ReviveMark className="h-[11px] w-[10px]" />$1.05M</span>, label: 'Potential', sub: 'Promising, needs a Revive review' },
    { pin: <span className="inline-flex h-6 items-center rounded-full border border-[#d9dde4] bg-white px-2 text-[11.5px] font-medium text-[#4b5563]">$1.2M</span>, label: 'MLS listing', sub: 'Checked by Revive, not a flip; tap to see why' },
  ]
  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((r) => (
        <li key={r.label} className="flex items-center gap-3">
          <span className="w-[78px] shrink-0">{r.pin}</span>
          <span>
            <span className="block text-[14px] font-semibold text-ink">{r.label}</span>
            <span className="block text-[13px] text-muted">{r.sub}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function App() {
  const [isWide, setWide] = useState(wide)
  useEffect(() => {
    const on = () => setWide(wide())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  if (!isWide)
    return (
      <div className="h-[100dvh] overflow-hidden bg-white pt-[env(safe-area-inset-top)]">
        <OpportunityMap />
        <Toaster position="top-center" richColors />
      </div>
    )

  return (
    <div className="flex min-h-[100dvh] items-center justify-center gap-14 bg-[radial-gradient(110%_90%_at_0%_0%,var(--green-soft)_0%,#fff_60%)] px-6 py-6">
      <aside className="hidden max-w-[340px] lg:block">
        <span
          aria-label="Revive"
          role="img"
          className="block h-[30px] w-[110px] bg-navy"
          style={{ WebkitMask: `url(${JSON.stringify(wordmark)}) left center / contain no-repeat`, mask: `url(${JSON.stringify(wordmark)}) left center / contain no-repeat` }}
        />
        <h1 className="mt-6 text-[30px] leading-9 font-semibold tracking-[-0.01em] text-ink">Flip360 opportunity map</h1>
        <p className="mt-3 text-[15px] leading-6 text-ink-2">Which homes nearby are actually worth pursuing, and why. Revive checks every active MLS listing against renovated sales, likely scope and Flip360’s 10% margin floor.</p>
        <div className="mt-8">
          <Legend />
        </div>
        <p className="mt-8 text-[12.5px] leading-5 text-muted">Prototype with sample listings around Eagle Rock and Highland Park, Los Angeles.</p>
      </aside>
      <div className="h-[min(868px,calc(100dvh-48px))] w-[414px] shrink-0 overflow-hidden rounded-[52px] border-[12px] border-navy bg-white shadow-[0_30px_80px_rgba(28,46,88,0.3)]">
        <OpportunityMap />
      </div>
      <Toaster position="top-center" richColors />
    </div>
  )
}
