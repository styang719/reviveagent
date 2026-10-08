import { ArrowRight, Megaphone, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import openHouse from '@/assets/marketing/open-house.png'
import postcard from '@/assets/marketing/postcard.png'
import social from '@/assets/marketing/social-post.png'
import { Button } from '@/components/ui/button'

// Dashboard (connected new agent): marketing Revive drafts for the agent, branded with their photo,
// name and license, ready to post, mail or print.

const ITEMS = [
  { name: 'Social media post', body: 'Ready for Instagram and Facebook, with your contact details on every post.', img: social },
  { name: 'Postcard', body: 'Renovate now, pay later, sell for more. Mail it to homeowners in your farm.', img: postcard },
  { name: 'Open house one-pager', body: 'A QR code to Revive and $1,000 off a project, for visitors to take home.', img: openHouse },
]

export function MarketingCenter() {
  return (
    <section aria-labelledby="marketing-center">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <h2 id="marketing-center" className="flex items-center gap-2 text-xl font-semibold text-ink">
            <Megaphone className="size-5 text-brand" /> Marketing center
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">Generate marketing materials branded for you.</p>
        </div>
        <Button variant="ghost" className="h-10 shrink-0 px-3 text-[14px] text-brand" asChild>
          <Link to="/marketing">
            Open Marketing <ArrowRight />
          </Link>
        </Button>
      </div>
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
