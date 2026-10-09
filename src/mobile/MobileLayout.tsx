import { House, Map, MoreHorizontal, Sparkles, UserCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CrmDialog } from '@/components/home/ConnectBook'
import { ReviveMark } from '@/components/shell/Logo'
import { TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { inPhoneFrame, PHONE_FRAME_NAME, setMobileApp } from './mode'
import { ViewSwitch } from './ViewSwitch'

// Mobile prototype shell: Revive AI is home, the map sits in the middle of the tab bar, and Homes, Leads and
// More hold the rest. On a wide screen the app runs inside a phone frame (an iframe, so every page lays out
// at phone width); on a phone it runs full screen.

const TABS = [
  { to: '/m', label: 'Revive AI', icon: Sparkles, end: true },
  { to: '/m/properties', label: 'Homes', icon: House },
  { to: '/m/map', label: 'Map', icon: Map, center: true },
  { to: '/m/leads', label: 'Leads', icon: UserCheck },
  { to: '/m/more', label: 'More', icon: MoreHorizontal },
] as const

function TabBar() {
  const { pathname } = useLocation()
  return (
    <nav aria-label="Main" className="relative z-30 shrink-0 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.to === '/m' ? pathname === '/m' || pathname === '/m/' || pathname === '/m/ai' : pathname.startsWith(t.to)
          if ('center' in t)
            return (
              <li key={t.to} className="flex justify-center">
                <NavLink
                  to={t.to}
                  aria-label={t.label}
                  className={cn(
                    '-mt-6 grid size-16 place-items-center rounded-full border-4 border-white shadow-[0_8px_24px_rgba(28,46,88,0.25)] transition-transform active:scale-95',
                    active ? 'bg-navy text-white' : 'bg-[var(--brand-primary)] text-white',
                  )}
                >
                  <Icon className="size-7" />
                </NavLink>
              </li>
            )
          return (
            <li key={t.to}>
              <NavLink to={t.to} end={'end' in t} className={cn('flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] font-medium', active ? 'text-brand' : 'text-muted')}>
                <Icon className="size-[22px]" />
                {t.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Wide screens: the phone, plus the demo scenarios beside it. */
function PhoneShell() {
  const tier = useDemo((s) => s.tier)
  const setTier = useDemo((s) => s.setTier)
  const setNewAgent = useDemo((s) => s.setNewAgent)
  const frame = useRef<HTMLIFrameElement>(null)
  const { pathname, search } = useLocation()
  const [src] = useState(() => `${window.location.pathname}${window.location.search}#${pathname}${search}`)
  const pick = (t: Tier) => {
    if (t === 'new') setNewAgent(false)
    else setTier(t)
    // the phone is its own window: reload it so it reads the new scenario
    setTimeout(() => frame.current?.contentWindow?.location.reload(), 50)
  }
  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center gap-16 bg-[radial-gradient(120%_120%_at_0%_0%,var(--brand-primary-subtle)_0%,#fff_55%)] p-8">
      <div className="hidden max-w-xs flex-col gap-6 lg:flex">
        <ViewSwitch tone="light" />
        <span className="grid size-12 place-items-center rounded-2xl bg-navy">
          <ReviveMark className="h-7 w-auto" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-ink">Revive, mobile</h1>
          <p className="mt-2 text-[15px] leading-6 text-ink-2">Revive AI is home. The map in the middle of the tab bar shows every opportunity, like Redfin or Zillow. Homes, Leads and More hold the rest.</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">Demo scenario</p>
          <div className="mt-2 flex flex-col gap-1.5" role="radiogroup" aria-label="Demo scenario">
            {(Object.keys(TIERS) as Tier[]).map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={tier === t}
                onClick={() => pick(t)}
                className={cn('rounded-xl border px-4 py-2.5 text-left text-[14px] font-medium', tier === t ? 'border-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] text-brand' : 'border-line bg-white text-ink-2 hover:bg-head')}
              >
                {TIERS[t].demoLabel}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[12.5px] text-faint">Sample data. Open this page on your phone to use it full screen.</p>
      </div>
      <div className="absolute top-4 left-4 lg:hidden">
        <ViewSwitch tone="light" />
      </div>
      <div className="relative h-[844px] max-h-[calc(100dvh-64px)] w-[390px] shrink-0 overflow-hidden rounded-[52px] border-[12px] border-navy bg-white shadow-[0_30px_80px_rgba(28,46,88,0.35)]">
        <iframe ref={frame} name={PHONE_FRAME_NAME} title="Revive mobile prototype" src={src} className="size-full border-0" />
      </div>
    </div>
  )
}

export function MobileLayout() {
  const { pathname } = useLocation()
  const [wide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 640 && !inPhoneFrame())
  useEffect(() => setMobileApp(true), [])
  // each tab starts at the top
  const main = useRef<HTMLElement>(null)
  useEffect(() => main.current?.scrollTo(0, 0), [pathname])

  if (wide) return <PhoneShell />
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-white">
      <main ref={main} id="main" className="relative min-h-0 flex-1 overflow-y-auto pt-[env(safe-area-inset-top)]">
        <Outlet />
      </main>
      <TabBar />
      <CrmDialog />
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
