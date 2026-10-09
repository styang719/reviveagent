import { House, Map, MessageCircle, MoreHorizontal, UserCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { CrmDialog } from '@/components/home/ConnectBook'
import wordmark from '@/assets/revive-wordmark.svg'
import { DEMO_BAR_HEIGHT, DemoBar } from '@/components/shell/DemoBar'
import { cn } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import { ChatDrawer, useChatDrawer } from './ChatDrawer'
import { inPhoneFrame, PHONE_FRAME_NAME, setMobileApp } from './mode'

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

/** Wide screens: the desktop demo bar on top, and the phone, scaled to fill the rest of the window. */
function PhoneShell() {
  const frame = useRef<HTMLIFrameElement>(null)
  const { pathname, search } = useLocation()
  const [src] = useState(() => `${window.location.pathname}${window.location.search}#${pathname}${search}`)
  const [scale, setScale] = useState(1)

  // the phone is its own window: when the demo bar changes the scenario (or resets), reload it so it reads the change
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    const reload = () => {
      clearTimeout(t)
      t = setTimeout(() => frame.current?.contentWindow?.location.reload(), 80)
    }
    const offDemo = useDemo.subscribe(reload)
    const offUi = useUi.subscribe((s, prev) => {
      if (s.threads !== prev.threads && s.threads.length === 0) reload() // Reset demo clears the chats
    })
    return () => (clearTimeout(t), offDemo(), offUi())
  }, [])

  // as big as the window allows, at the phone's own proportions (390×844 plus the bezel)
  useEffect(() => {
    const fit = () => setScale(Math.max(0.5, Math.min((window.innerHeight - DEMO_BAR_HEIGHT - 32) / 868, (window.innerWidth - 32) / 414)))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[radial-gradient(120%_120%_at_0%_0%,var(--brand-primary-subtle)_0%,#fff_55%)]">
      <DemoBar />
      <div className="flex flex-1 items-start justify-center pt-4">
        <div style={{ width: 414 * scale, height: 868 * scale }}>
          <div
            className="h-[868px] w-[414px] origin-top-left overflow-hidden rounded-[52px] border-[12px] border-navy bg-white shadow-[0_30px_80px_rgba(28,46,88,0.35)]"
            style={{ transform: `scale(${scale})` }}
          >
            <iframe ref={frame} name={PHONE_FRAME_NAME} title="Revive mobile prototype" src={src} className="size-full border-0" />
          </div>
        </div>
      </div>
      <Toaster position="top-center" richColors closeButton />
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
        {/* every page but the chat and the map carries the Revive bar: frosted like the tab bar, the page scrolls under it */}
        {!fullBleed && (
          <header className="absolute inset-x-0 top-0 z-20 flex justify-center border-b border-[rgba(28,46,88,0.06)] bg-white/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
            <Link to="/m" aria-label="Revive AI home" className="flex h-[52px] items-center">
              <span
                aria-hidden="true"
                className="block h-[27px] w-[99px] bg-navy"
                style={{ WebkitMask: `url(${JSON.stringify(wordmark)}) center / contain no-repeat`, mask: `url(${JSON.stringify(wordmark)}) center / contain no-repeat` }}
              />
              <span className="sr-only">Revive</span>
            </Link>
          </header>
        )}
        <main ref={main} id="main" className={cn('rv-m relative min-h-0 flex-1 overflow-y-auto', fullBleed ? 'pt-[env(safe-area-inset-top)]' : 'pt-[calc(52px+env(safe-area-inset-top))] pb-[calc(var(--tab-h)+16px)]')}>
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
