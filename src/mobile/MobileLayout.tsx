import { House, Map, MessageCircle, MoreHorizontal, UserCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CrmDialog } from '@/components/home/ConnectBook'
import { ReviveLogo, ReviveMark } from '@/components/shell/Logo'
import { TIERS } from '@/data/tiers'
import type { Tier } from '@/data/types'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { ChatDrawer, useChatDrawer } from './ChatDrawer'
import { inPhoneFrame, PHONE_FRAME_NAME, setMobileApp } from './mode'
import { ViewSwitch } from './ViewSwitch'

// Mobile prototype shell: Revive AI is home, the map sits in the middle of the tab bar, and Homes, Leads and
// More hold the rest. On a wide screen the app runs inside a phone frame (an iframe, so every page lays out
// at phone width); on a phone it runs full screen.

const TABS = [
  { to: '/m', label: 'Revive AI', icon: MessageCircle, end: true },
  { to: '/m/properties', label: 'Homes', icon: House },
  { to: '/m/map', label: 'Map', icon: Map },
  { to: '/m/leads', label: 'Leads', icon: UserCheck },
  { to: '/m/more', label: 'More', icon: MoreHorizontal },
] as const

function TabBar() {
  const { pathname } = useLocation()
  return (
    // frosted glass pill, floating over the page so content scrolls under it; icons only, the current tab sits in a soft pill
    <nav
      aria-label="Main"
      className="absolute inset-x-4 bottom-[calc(10px+env(safe-area-inset-bottom))] z-[700] rounded-full border border-white/60 bg-white/30 p-1.5 shadow-[0_10px_36px_rgba(28,46,88,0.16),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[6px] backdrop-saturate-[1.8]"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = t.to === '/m' ? pathname === '/m' || pathname === '/m/' || pathname === '/m/ai' : pathname.startsWith(t.to)
          return (
            <li key={t.to}>
              <NavLink
                to={t.to}
                end={'end' in t}
                aria-label={t.label}
                title={t.label}
                className={cn(
                  'grid h-12 place-items-center rounded-full transition-colors active:scale-95',
                  active ? 'bg-white/70 text-ink shadow-[0_1px_4px_rgba(28,46,88,0.08)]' : 'text-ink-2',
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2 : 1.75} />
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

  const drawer = useChatDrawer((s) => s.open)
  const setDrawer = useChatDrawer((s) => s.setOpen)
  useEffect(() => setDrawer(false), [pathname, setDrawer])
  const fullBleed = /^\/m(\/ai|\/map)?\/?$/.test(pathname)
  if (wide) return <PhoneShell />
  return (
    <div className="relative h-[100dvh] overflow-hidden bg-white [--tab-h:calc(72px+env(safe-area-inset-bottom))]">
      <ChatDrawer />
      {/* the app; it slides aside, rounded, when the chat drawer opens */}
      <div
        className={cn(
          'absolute inset-0 z-10 flex flex-col overflow-hidden bg-white transition-[transform,border-radius,box-shadow] duration-300 ease-[cubic-bezier(.32,.72,0,1)]',
          drawer && 'translate-x-[84%] rounded-l-[40px] shadow-[-12px_0_48px_rgba(28,46,88,0.14)]',
        )}
      >
        {/* the map and the chat run edge to edge under the glass; other pages leave room so their last row clears it */}
        {/* every page but the chat and the map carries the Revive bar */}
        {!fullBleed && (
          <header className="z-20 flex shrink-0 justify-center bg-navy pt-[env(safe-area-inset-top)]">
            <Link to="/m" aria-label="Revive AI home" className="flex h-12 items-center">
              <ReviveLogo className="h-6 w-auto" />
            </Link>
          </header>
        )}
        <main ref={main} id="main" className={cn('relative min-h-0 flex-1 overflow-y-auto', fullBleed ? 'pt-[env(safe-area-inset-top)]' : 'pb-[calc(var(--tab-h)+16px)]')}>
          <Outlet />
        </main>
        <TabBar />
        {drawer && <button aria-label="Close chats" onClick={() => setDrawer(false)} className="absolute inset-0 z-[900] bg-white/20" />}
      </div>
      <CrmDialog />
      <Toaster position="top-center" richColors closeButton />
    </div>
  )
}
