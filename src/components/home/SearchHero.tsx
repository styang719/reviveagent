import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import mark from '@/assets/revive-mark.svg'
import { GlobalSearch } from '@/components/shell/GlobalSearch'
import type { Opportunity } from '@/lib/opportunities'

// First visit: lead with the thing that has value before any deal. Any address, any time.
export function SearchHero({ opps }: { opps: Opportunity[] }) {
  const tries = [
    opps.find((o) => o.property.source === 'contacts' && o.urgency === 'now'),
    opps.find((o) => o.property.source === 'listings'),
  ].filter((o): o is Opportunity => !!o)

  return (
    <section aria-labelledby="hero-title" className="relative overflow-visible rounded-2xl bg-navy px-5 py-8 text-white sm:px-10 sm:py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
        <img src={mark} alt="" className="absolute -right-10 -bottom-16 h-72 w-auto opacity-[0.06]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(82,116,192,0.45),transparent_60%)]" />
      </div>
      <div className="relative">
        <p className="text-[13px] font-semibold tracking-wide text-[#A8B0D0] uppercase">Revive AI</p>
        <h2 id="hero-title" className="mt-1 max-w-2xl text-2xl font-semibold text-balance sm:text-[32px] sm:leading-10">
          Have a property in mind?
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#C9CEE4]">
          Type any address. Revive AI shows what the home is worth today, what a renovation could add, and which Revive product fits, in
          a report you can share with the owner.
        </p>
        <GlobalSearch variant="hero" className="mt-6" />
        {tries.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-[#A8B0D0]">
            Try one from your book:
            {tries.map((o) => (
              <Link
                key={o.id}
                to={`/property/${o.id}?tab=report`}
                className="inline-flex items-center gap-1 rounded-full border border-white/25 px-3 py-1 font-medium text-white hover:bg-white/10"
              >
                {o.property.address} <ArrowRight className="size-3.5" />
              </Link>
            ))}
          </p>
        )}
      </div>
    </section>
  )
}
