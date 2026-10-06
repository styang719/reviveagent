import { ChevronRight, Hammer, Home, Inbox, Megaphone, PanelLeft, Search, Sparkles, Target } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import avatar from '@/assets/avatar-michelle.jpg'
import { AGENT } from '@/data/tiers'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'
import { ReviveLogo } from './Logo'
import { QrCode } from './QrCode'

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/opportunities', label: 'Opportunities', icon: Target },
  { to: '/projects', label: 'Projects', icon: Hammer },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/inbox', label: 'Inbox', icon: Inbox, badge: 8 },
]

// Revive AI isn't a page like the others: it's an assistant you can ask about any address or
// person. So it gets its own treatment: a gradient edge, a glowing sparkle and an "Ask" hint.
function ReviveAiItem({ collapsed, onOpen }: { collapsed: boolean; onOpen: () => void }) {
  const open = useUi((s) => s.paletteOpen && s.paletteMode === 'ai')
  return (
    <button
      onClick={onOpen}
      title={collapsed ? 'Revive AI' : undefined}
      aria-label="Revive AI: ask about any address or person"
      className={cn(
        'rv-ai-item group relative mb-2 flex h-11 items-center gap-3 rounded-lg px-3 text-left text-base font-medium text-white',
        open && 'is-open',
        collapsed && 'justify-center px-0',
      )}
    >
      <span className="rv-ai-icon grid size-6 shrink-0 place-items-center rounded-md">
        <Sparkles className="size-4" />
      </span>
      {!collapsed && (
        <>
          <span className="flex-1">Revive AI</span>
          <kbd className="rounded border border-white/25 px-1.5 text-[11px] font-medium text-white/70">⌘K</kbd>
        </>
      )}
    </button>
  )
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const setPalette = useUi((s) => s.setPalette)
  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-[calc(100vh-var(--demo-h,0px))] shrink-0 flex-col rounded-r-2xl bg-sb text-sb-ink transition-[width] duration-200 lg:flex',
        collapsed ? 'w-[84px]' : 'w-[280px]',
      )}
      style={{ top: 'var(--demo-h, 0px)', height: 'calc(100vh - var(--demo-h, 0px))' }}
    >
      <div className={cn('flex items-center px-5 pt-6 pb-5', collapsed ? 'flex-col gap-4' : 'justify-between')}>
        <NavLink to="/" aria-label="Revive home">
          <ReviveLogo collapsed={collapsed} />
        </NavLink>
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-white/80 hover:bg-white/10"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft className="size-5" />
        </button>
      </div>

      <div className="px-3">
        <button
          onClick={() => setPalette(true)}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-lg border border-sb-line/60 bg-sb-input px-3 text-left text-base text-sb-dim hover:border-white/80',
            collapsed && 'justify-center px-0',
          )}
          aria-label="Search"
        >
          <Search className="size-5 shrink-0" />
          {!collapsed && <span>Search</span>}
        </button>
      </div>

      <nav className="mt-6 flex flex-col gap-1 px-3" aria-label="Main">
        <ReviveAiItem collapsed={collapsed} onOpen={() => setPalette(true, 'ai')} />
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'relative flex h-10 items-center gap-3 rounded-lg px-3 text-base transition-colors',
                isActive ? 'bg-sb-active font-medium text-white' : 'text-sb-ink hover:bg-white/8 hover:text-white',
                collapsed && 'justify-center px-0',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span className="flex-1">{label}</span>}
            {badge && (
              <span
                className={cn(
                  'grid h-5 min-w-5 place-items-center rounded-full bg-[#dc2626] px-1.5 text-xs font-medium text-white',
                  collapsed && 'absolute top-0.5 right-3 h-4 min-w-4 text-[10px]',
                )}
              >
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-4">
        {!collapsed && (
          <div className="mb-4 flex gap-4 border-b border-white/20 pb-5">
            <QrCode size={100} />
            <div className="text-[13px] leading-5">
              <p className="text-[15px] font-medium text-white/90">Download the Revive App</p>
              <p className="mt-1 text-sb-ink">A better experience is waiting for you.</p>
              <a href="#" className="text-white/90 underline underline-offset-2">Explore more</a>
            </div>
          </div>
        )}
        <button className={cn('flex w-full items-center gap-3 rounded-lg p-1 text-left hover:bg-white/5', collapsed && 'justify-center')}>
          <img src={avatar} alt="" className="size-9 shrink-0 rounded-full object-cover" />
          {!collapsed && (
            <>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-white">{AGENT.name}</span>
                <span className="block text-xs text-white/80">{AGENT.role}</span>
              </span>
              <ChevronRight className="size-4 text-white" />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
