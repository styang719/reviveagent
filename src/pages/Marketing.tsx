import { ArrowLeftRight, Bookmark, ChevronDown, Home, LayoutGrid, MapPin, Pencil, QrCode, Search, Sofa, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import openHouse from '@/assets/marketing/open-house.webp'
import postcard from '@/assets/marketing/postcard.webp'
import social from '@/assets/marketing/social-post.webp'
import { ProfileDialog } from '@/components/marketing/ProfileDialog'
import { Button } from '@/components/ui/button'
import { photoUrl } from '@/lib/assets'
import { useOpportunities } from '@/lib/opportunities'
import { cn, PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'

// Marketing center: brand-approved templates by product, marketing for each Revive project (opens that
// home's page on the Marketing tab), and the templates other agents downloaded most last month.

const img = (key?: string) => (key?.startsWith('data:') ? key : photoUrl(key))

const PRODUCTS = [
  { name: 'All products', icon: LayoutGrid, tint: 'bg-brand-soft text-brand' },
  { name: 'Renovate to Sell', icon: Home, tint: 'bg-[var(--hot-soft)] text-[var(--hot)]' },
  { name: 'Renovate to Stay', icon: Sofa, tint: 'bg-[var(--brand-agent-subtle)] text-[var(--brand-agent)]' },
  { name: 'Sell 360', icon: ArrowLeftRight, tint: 'bg-[var(--red-soft)] text-[var(--red)]' },
  { name: 'Flip 360', icon: TrendingUp, tint: 'bg-[var(--amber-soft)] text-[var(--amber)]' },
  { name: 'QR code', icon: QrCode, tint: 'bg-[var(--green-soft)] text-[var(--green)]' },
] as const

const TRENDING = [
  { name: 'Sell 360', type: 'Socials', img: social },
  { name: 'Renovate to Sell', type: 'Postcard', img: postcard },
  { name: 'Sell 360', type: 'Playbook', img: openHouse },
  { name: 'Refer & Earn', type: 'One pager', img: openHouse },
  { name: 'Renovate to Sell', type: 'One pager', img: postcard },
  { name: 'Renovate to Stay', type: 'Socials', img: social },
  { name: 'Revive Partner', type: 'Postcard', img: postcard },
  { name: 'Revive Partner', type: 'Playbook', img: openHouse },
  { name: 'Sell 360', type: 'Door hanger', img: social },
  { name: 'Refer & Earn', type: 'Interior design', img: openHouse },
]

interface ProjectRow {
  id: string
  address: string
  city: string
  photo?: string
  product: string
  status: string
  templates: number
}

function SectionHead({ title, hint, children }: { title: string; hint: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        <p className="mt-1 text-[13px] text-muted">{hint}</p>
      </div>
      {children}
    </div>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-line bg-white pr-9 pl-4 text-[14px] font-medium text-ink outline-none hover:bg-head focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-muted" />
    </label>
  )
}

function ProjectCard({ p }: { p: ProjectRow }) {
  return (
    <Link
      to={`/property/${p.id}?tab=marketing`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition-shadow hover:shadow-[0_12px_32px_rgba(28,46,88,0.12)]"
    >
      <div className="relative h-40 overflow-hidden bg-line-soft">
        {p.photo && <img src={img(p.photo)} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-55% to-black/80" />
        <span className="absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">{p.product}</span>
        <div className="absolute right-3 bottom-2.5 left-3 text-white">
          <p className="truncate text-[14px] font-medium">{p.address}</p>
          <p className="flex items-center gap-1 text-[12px] text-white/85">
            <MapPin className="size-3 shrink-0" /> <span className="truncate">{p.city}</span>
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-4 px-4 pt-3">
        <div className="min-w-0">
          <dt className="text-[12px] text-muted">Status</dt>
          <dd className="truncate text-[14px] font-semibold text-ink">{p.status}</dd>
        </div>
        <div>
          <dt className="text-[12px] text-muted">Templates</dt>
          <dd className="text-[14px] font-semibold text-ink tabular-nums">{p.templates}</dd>
        </div>
      </dl>
      <div className="p-3">
        <span className="flex h-9 items-center justify-center rounded-lg bg-line-soft text-[13px] font-medium text-ink transition-colors group-hover:bg-brand-soft group-hover:text-brand">
          View project templates
        </span>
      </div>
    </Link>
  )
}

export default function Marketing() {
  const [profileOpen, setProfileOpen] = useState(false)
  const created = useDemo((s) => s.projects)
  const reports = useDemo((s) => s.reports)
  const opps = useOpportunities()
  const [q, setQ] = useState('')
  const [product, setProduct] = useState('All products')
  const [status, setStatus] = useState('All status')
  const [showAll, setShowAll] = useState(false)
  const [saved, setSaved] = useState<Set<number>>(new Set())
  const needle = q.trim().toLowerCase()
  const match = (...fields: (string | undefined)[]) => !needle || fields.some((f) => f?.toLowerCase().includes(needle))

  // same homes as the Projects section on Homes; each project carries the Marketing tab's 4 templates
  const projects: ProjectRow[] = [
    ...Object.values(created).map((p) => ({
      id: p.propertyId,
      address: p.address,
      city: p.city,
      photo: opps.find((o) => o.id === p.propertyId)?.property.photo ?? reports[p.propertyId]?.photos[0],
      product: p.product,
      status: 'In review',
      templates: 4,
    })),
    ...opps
      .filter((o) => o.property.project && !created[o.id])
      .map((o) => ({
        id: o.id,
        address: o.property.address,
        city: o.property.city,
        photo: o.property.photo,
        product: o.property.project!.product,
        status: o.property.project!.status === 'active' ? 'In construction' : 'In review',
        templates: 4,
      })),
  ]
  const productOptions = ['All products', ...new Set(projects.map((p) => p.product))]
  const statusOptions = ['All status', ...new Set(projects.map((p) => p.status))]
  const shownProjects = projects.filter(
    (p) => (product === 'All products' || p.product === product) && (status === 'All status' || p.status === status) && match(p.address, p.city, p.product),
  )
  const visibleProjects = showAll ? shownProjects : shownProjects.slice(0, 4)
  const trending = TRENDING.map((t, i) => ({ ...t, i })).filter((t) => match(t.name, t.type))

  const pickProduct = (name: string) => {
    if (name === 'QR code') {
      toast.success('Your QR code is ready', { description: 'It opens your Revive lead form, branded with your photo and name.' })
      return
    }
    setProduct(name === 'All products' || productOptions.includes(name) ? name : 'All products')
    document.getElementById('marketing-projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={PAGE}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Marketing center</h1>
          <p className="mt-1 text-[15px] text-ink-2">Curated brand-approved templates for your own marketing.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search templates and homes"
              aria-label="Search templates and homes"
              className="h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[14px] outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
            />
          </label>
          <Button
            variant="outline"
            className="h-10"
            onClick={() => setProfileOpen(true)}
          >
            <Pencil /> Edit profile information
          </Button>
          <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
        </div>
      </div>

      <section className="mt-10">
        <SectionHead title="Ready-to-use marketing materials" hint="Explore ready-to-use templates to promote your brand." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map(({ name, icon: Icon, tint }) => (
            <button
              key={name}
              type="button"
              onClick={() => pickProduct(name)}
              className="flex items-center gap-3 rounded-2xl bg-head px-5 py-3 text-left transition-colors hover:bg-brand-soft"
            >
              <span className="flex-1 text-[17px] font-medium text-ink">{name}</span>
              <span className={cn('grid size-14 shrink-0 place-items-center rounded-2xl', tint)}>
                <Icon className="size-6" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section id="marketing-projects" className="mt-12 scroll-mt-6">
        <SectionHead title="Marketing for your Revive projects" hint="Templates made for each home you’re renovating with Revive. Opens the home’s Marketing tab.">
          {projects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Select label="Product" value={product} options={productOptions} onChange={setProduct} />
              <Select label="Status" value={status} options={statusOptions} onChange={setStatus} />
            </div>
          )}
        </SectionHead>
        {visibleProjects.length ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visibleProjects.map((p) => (
                <ProjectCard key={p.id} p={p} />
              ))}
            </div>
            {shownProjects.length > 4 && (
              <Button variant="secondary" className="mt-4 h-10 w-full" onClick={() => setShowAll((v) => !v)}>
                {showAll ? 'Show fewer projects' : `Show all ${shownProjects.length} projects`}
                <ChevronDown className={cn('transition-transform', showAll && 'rotate-180')} />
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line px-5 py-4">
            <p className="text-[13.5px] text-ink-2">
              {projects.length ? 'No projects match these filters.' : 'No Revive projects yet. Start one from any report and its marketing shows up here.'}
            </p>
            {!projects.length && (
              <Button size="sm" variant="outline" asChild>
                <Link to="/properties">See your homes</Link>
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="mt-12">
        <SectionHead title="Trending marketing materials" hint="These had the most downloads last month." />
        {trending.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {trending.map((t) => {
              const on = saved.has(t.i)
              return (
                <article key={t.i} className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-card">
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => toast.success(`${t.name} ${t.type.toLowerCase()} is ready`, { description: 'Branded with your photo, name and license.' })}
                  >
                    <div className="h-48 overflow-hidden bg-head">
                      <img src={t.img} alt={`${t.name} ${t.type.toLowerCase()}`} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="flex items-center gap-2 p-3">
                      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{t.name}</span>
                      <span className="shrink-0 rounded-full bg-line-soft px-3 py-1 text-[12px] font-medium text-ink">{t.type}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={on ? 'Remove from saved' : 'Save template'}
                    aria-pressed={on}
                    onClick={() =>
                      setSaved((s) => {
                        const n = new Set(s)
                        if (on) n.delete(t.i)
                        else n.add(t.i)
                        return n
                      })
                    }
                    className={cn('absolute top-3 right-3 grid size-8 place-items-center rounded-lg shadow-sm', on ? 'bg-brand text-white' : 'bg-white/90 text-ink hover:bg-white')}
                  >
                    <Bookmark className={cn('size-3.5', on && 'fill-current')} />
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-line px-5 py-4 text-[13.5px] text-muted">No templates match “{q.trim()}”.</p>
        )}
      </section>
    </div>
  )
}
