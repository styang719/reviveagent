import { ArrowRight, Sparkles, UserRoundPen } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import openHouse from '@/assets/marketing/open-house.png'
import postcard from '@/assets/marketing/postcard.png'
import social from '@/assets/marketing/social-post.png'
import { ProfileDialog } from '@/components/marketing/ProfileDialog'
import { Button } from '@/components/ui/button'
import { useDemo } from '@/store/demo'

// Dashboard (connected new agent): marketing Revive drafts for the agent, branded with their photo,
// name and license, ready to post, mail or print.

const ITEMS = [
  { name: 'Social media post', body: 'Ready for Instagram and Facebook, with your contact details on every post.', img: social },
  { name: 'Postcard', body: 'Renovate now, pay later, sell for more. Mail it to homeowners in your farm.', img: postcard },
  { name: 'Open house one-pager', body: 'A QR code to Revive and $1,000 off a project, for visitors to take home.', img: openHouse },
]

export function MarketingCenter() {
  const profile = useDemo((s) => s.marketingProfile)
  const [setup, setSetup] = useState(false)
  return (
    <section aria-labelledby="marketing-center">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 id="marketing-center" className="text-xl font-semibold text-ink">
            Generate marketing materials branded for you
          </h2>
        </div>
        <Button variant="ghost" className="h-10 shrink-0 px-3 text-[14px] text-brand" asChild>
          <Link to="/marketing">
            Open Marketing center <ArrowRight />
          </Link>
        </Button>
      </div>
      {/* one-time setup: the agent's photo, name and license go on every template */}
      {!profile && (
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--brand-primary-border-subtle)] bg-[var(--brand-primary-subtle)] px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-brand">
          <UserRoundPen className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">Set up your marketing profile</p>
          <p className="text-[13.5px] text-ink-2">Add your photo, name, license and brokerage once. Every template comes out branded for you.</p>
        </div>
        <Button className="h-10 shrink-0" onClick={() => setSetup(true)}>
          Set up profile <ArrowRight />
        </Button>
      </div>
      )}
      <ProfileDialog open={setup} onOpenChange={setSetup} />
      <div className="grid gap-4 sm:grid-cols-3">
        {ITEMS.map(({ name, body, img }) => (
          <article key={name} className="flex flex-col overflow-hidden rounded-xl border border-line bg-white shadow-card">
            <img src={img} alt={`Example ${name.toLowerCase()}`} className="aspect-[548/400] w-full object-cover" />
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
