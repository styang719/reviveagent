import { ArrowLeft, Check, Download, Loader2, Share2, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import openHouse from '@/assets/marketing/open-house.webp'
import postcard from '@/assets/marketing/postcard.webp'
import social from '@/assets/marketing/social-post.webp'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { AGENT } from '@/data/tiers'
import { money } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Create marketing for one home: pick a template, adjust the headline and what's on it, then Revive generates it
// with the home's photo, numbers and the agent's branding. The finished piece lands in the home's Marketing tab.

export type Format = 'Postcard' | 'Socials' | 'Flyer' | 'One pager'
export interface Template {
  id: string
  name: string
  type: Format
  img: string
  headline: string
  forProject: boolean // listing marketing (a project) or a conversation starter (a report)
}

export const TEMPLATES: Template[] = [
  { id: 'coming-soon', name: 'Coming soon', type: 'Postcard', img: postcard, headline: 'Coming soon, freshly renovated', forProject: true },
  { id: 'before-after', name: 'Before & after', type: 'Socials', img: social, headline: 'Watch this home transform', forProject: true },
  { id: 'open-house', name: 'Open house', type: 'Flyer', img: openHouse, headline: 'Open house this Sunday, 1–4 pm', forProject: true },
  { id: 'story', name: 'Renovation story', type: 'One pager', img: postcard, headline: 'How we made this home sell for more', forProject: true },
  { id: 'just-listed', name: 'Just listed', type: 'Socials', img: social, headline: 'Just listed', forProject: true },
  { id: 'could-sell', name: 'What it could sell for', type: 'One pager', img: postcard, headline: 'What your home could sell for', forProject: false },
  { id: 'potential', name: 'Your home’s potential', type: 'Socials', img: social, headline: 'Your home has more value inside', forProject: false },
  { id: 'renovate', name: 'Renovate with Revive', type: 'Flyer', img: openHouse, headline: 'Renovate now, pay at closing', forProject: false },
]

export interface Material {
  id: string
  template: Template
  headline: string
  showPrice: boolean
  showQr: boolean
  at: number
}

export interface Home {
  address: string
  city: string
  photo?: string
  product: string
  price: number
  project: boolean
}

const STEPS = (h: Home, t: Template) => [
  `Pulling ${h.address}’s photos and details`,
  'Writing the copy in your voice',
  'Adding your photo, name and license',
  `Laying out the ${t.type.toLowerCase()}`,
]
const STEP_MS = 1100

/** The finished design, drawn from the home and the agent's profile (also the thumbnail in "Your materials"). */
export function MaterialPreview({ m, home, small = false }: { m: Material; home: Home; small?: boolean }) {
  const profile = useDemo((s) => s.marketingProfile)
  const name = profile?.name || AGENT.name
  const aspect = m.template.type === 'Socials' ? 'aspect-square' : m.template.type === 'Postcard' ? 'aspect-[3/2]' : 'aspect-[3/4]'
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-navy text-white shadow-[0_10px_30px_rgba(28,46,88,0.25)]', aspect)}>
      {home.photo && <img src={home.photo} alt="" className="absolute inset-0 size-full object-cover" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a36] via-[#0f1a36]/40 to-transparent" />
      <div className={cn('absolute inset-x-0 top-0 flex items-center justify-between', small ? 'p-2' : 'p-4')}>
        <span className={cn('rounded-full bg-white/90 font-semibold text-navy', small ? 'px-1.5 py-0.5 text-[8px]' : 'px-2.5 py-1 text-[11px]')}>{home.product}</span>
        {m.showQr && !small && (
          <span className="grid size-12 place-items-center rounded-md bg-white p-1" aria-label="QR code to the report">
            <span className="size-full bg-[repeating-conic-gradient(#1c2e58_0_25%,#fff_0_50%)] bg-[length:8px_8px]" />
          </span>
        )}
      </div>
      <div className={cn('absolute inset-x-0 bottom-0', small ? 'p-2' : 'p-4')}>
        <p className={cn('font-semibold leading-tight text-balance', small ? 'text-[11px]' : 'text-[22px]')}>{m.headline}</p>
        <p className={cn('mt-1 text-white/85', small ? 'text-[8px]' : 'text-[13px]')}>
          {home.address}, {home.city}
          {m.showPrice && ` · ${money(home.price)}`}
        </p>
        {!small && (
          <div className="mt-3 flex items-center justify-between border-t border-white/25 pt-2.5 text-[12px]">
            <span className="font-semibold">{name}</span>
            <span className="text-white/75">{profile?.brokerage || 'Revive Partner agent'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function CreateMaterialDialog({
  open,
  onOpenChange,
  home,
  initial,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  home: Home
  initial?: string // a template id to start on
  onCreated: (m: Material) => void
}) {
  const list = TEMPLATES.filter((t) => t.forProject === home.project)
  const [step, setStep] = useState<'pick' | 'edit' | 'make' | 'done'>('pick')
  const [format, setFormat] = useState<Format | 'All'>('All')
  const [pick, setPick] = useState<Template | null>(null)
  const [headline, setHeadline] = useState('')
  const [showPrice, setShowPrice] = useState(true)
  const [showQr, setShowQr] = useState(true)
  const [made, setMade] = useState(0)
  const [result, setResult] = useState<Material | null>(null)

  // each time it opens: start over, or straight at the template that was tapped
  useEffect(() => {
    if (!open) return
    const t = list.find((x) => x.id === initial) ?? null
    setPick(t)
    setHeadline(t?.headline ?? '')
    setStep(t ? 'edit' : 'pick')
    setFormat('All')
    setResult(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  // the generation: one step at a time, then the finished piece
  useEffect(() => {
    if (step !== 'make' || !pick) return
    setMade(0)
    const timers = STEPS(home, pick).map((_, i) => setTimeout(() => setMade(i + 1), STEP_MS * (i + 1)))
    const done = setTimeout(() => {
      const m: Material = { id: `${pick.id}-${Date.now()}`, template: pick, headline: headline.trim() || pick.headline, showPrice, showQr, at: Date.now() }
      setResult(m)
      onCreated(m)
      setStep('done')
    }, STEP_MS * 4 + 500)
    return () => [...timers, done].forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const formats = ['All', ...Array.from(new Set(list.map((t) => t.type)))] as (Format | 'All')[]
  const shown = list.filter((t) => format === 'All' || t.type === format)
  const choose = (t: Template) => {
    setPick(t)
    setHeadline(t.headline)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => step !== 'make' && onOpenChange(o)}>
      <DialogContent className="max-h-[calc(100dvh-32px)] max-w-2xl overflow-y-auto p-0">
        {step === 'pick' && (
          <div className="p-6">
            <DialogTitle>Create marketing for {home.address}</DialogTitle>
            <DialogDescription>Pick a template. Revive fills it with this home’s photos and numbers, and your branding.</DialogDescription>
            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Format">
              {formats.map((f) => (
                <button
                  key={f}
                  role="radio"
                  aria-checked={format === f}
                  onClick={() => setFormat(f)}
                  className={cn('h-8 rounded-full border px-3 text-[13px] font-medium', format === f ? 'border-navy bg-navy text-white' : 'border-line bg-white text-ink-2 hover:bg-head')}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Template">
              {shown.map((t) => {
                const on = pick?.id === t.id
                return (
                  <button
                    key={t.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => choose(t)}
                    className={cn('relative overflow-hidden rounded-xl border bg-white text-left transition-shadow', on ? 'border-brand ring-2 ring-[var(--brand-primary-border)]' : 'border-line hover:shadow-card')}
                  >
                    <img src={t.img} alt="" className="h-24 w-full object-cover" />
                    <span className="block px-2.5 pt-2 text-[13.5px] font-semibold text-ink">{t.name}</span>
                    <span className="block px-2.5 pb-2.5 text-[12px] text-muted">{t.type}</span>
                    {on && (
                      <span className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-brand text-white">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={!pick} onClick={() => setStep('edit')}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'edit' && pick && (
          <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <button onClick={() => setStep('pick')} className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-ink">
                <ArrowLeft className="size-3.5" /> All templates
              </button>
              <DialogTitle>
                {pick.name} · {pick.type}
              </DialogTitle>
              <DialogDescription>For {home.address}. Change anything; Revive handles the design.</DialogDescription>
              <label className="mt-5 block text-[13px] font-medium text-ink" htmlFor="mat-headline">
                Headline
              </label>
              <input
                id="mat-headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-line px-3 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              />
              <fieldset className="mt-4 flex flex-col gap-2.5">
                <legend className="text-[13px] font-medium text-ink">Include</legend>
                <label className="flex items-center gap-2.5 text-[14px] text-ink-2">
                  <input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="size-4 accent-[var(--brand-primary)]" />
                  {home.project ? 'Target list price' : 'Value today'} ({money(home.price)})
                </label>
                <label className="flex items-center gap-2.5 text-[14px] text-ink-2">
                  <input type="checkbox" checked={showQr} onChange={(e) => setShowQr(e.target.checked)} className="size-4 accent-[var(--brand-primary)]" />
                  QR code to the Revive AI report
                </label>
              </fieldset>
              <Button className="mt-6 w-full" onClick={() => setStep('make')}>
                <Sparkles /> Generate {pick.type.toLowerCase()}
              </Button>
            </div>
            <div className="min-w-0">
              <p className="mb-2 text-[12px] font-medium tracking-wide text-muted uppercase">Preview</p>
              <MaterialPreview m={{ id: 'draft', template: pick, headline: headline || pick.headline, showPrice, showQr, at: 0 }} home={home} />
            </div>
          </div>
        )}

        {step === 'make' && pick && (
          <div className="flex flex-col items-center px-6 py-10 text-center" aria-live="polite">
            <DialogTitle>Creating your {pick.type.toLowerCase()}</DialogTitle>
            <DialogDescription>About 5 seconds.</DialogDescription>
            <div className="relative mt-6 w-56">
              <div className="rv-shimmer overflow-hidden rounded-xl opacity-60 blur-[2px]">
                <MaterialPreview m={{ id: 'draft', template: pick, headline: headline || pick.headline, showPrice, showQr, at: 0 }} home={home} small />
              </div>
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid size-12 place-items-center rounded-full bg-white shadow-lg">
                  <Loader2 className="size-6 animate-spin text-brand" />
                </span>
              </span>
            </div>
            <div className="mt-6 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-line-soft">
              <div className="h-full rounded-full bg-brand transition-[width] duration-700 ease-out" style={{ width: `${Math.max(8, (made / 4) * 100)}%` }} />
            </div>
            <ol className="mt-5 flex w-full max-w-sm flex-col gap-2 text-left">
              {STEPS(home, pick).map((s, i) => (
                <li key={s} className={cn('flex items-center gap-2.5 text-[14px] transition-colors', i < made ? 'text-ink' : i === made ? 'font-medium text-ink' : 'text-faint')}>
                  <span className={cn('grid size-5 shrink-0 place-items-center rounded-full', i < made ? 'bg-[var(--green)] text-white' : i === made ? 'text-brand' : 'border border-line')}>
                    {i < made ? <Check className="size-3" strokeWidth={3} /> : i === made ? <Loader2 className="size-4 animate-spin" /> : null}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}

        {step === 'done' && result && (
          <div className="p-6">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-full bg-[var(--green)] text-white">
                <Check className="size-4" strokeWidth={3} />
              </span>
              <DialogTitle>Your {result.template.type.toLowerCase()} is ready</DialogTitle>
            </div>
            <DialogDescription>Saved to {home.address}’s Marketing tab.</DialogDescription>
            <div className="mx-auto mt-5 max-w-sm">
              <MaterialPreview m={result} home={home} />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('pick')}>
                Create another
              </Button>
              <Button variant="outline" onClick={() => toast.success('Link copied', { description: 'Share it by text, email or social.' })}>
                <Share2 /> Share
              </Button>
              <Button
                onClick={() => {
                  toast.success(`Downloading ${result.template.name.toLowerCase()} ${result.template.type.toLowerCase()}`, { description: 'Print-ready PDF and PNG.' })
                  onOpenChange(false)
                }}
              >
                <Download /> Download
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
