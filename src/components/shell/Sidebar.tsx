import { ChevronRight, Inbox, LayoutDashboard, MapPinHouse, Megaphone, PanelLeft, Sparkles, TrendingUp, UserCheck } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import avatar from '@/assets/avatar-michelle.jpg'
import { AGENT } from '@/data/tiers'
import { cn } from '@/lib/utils'
import { ReviveLogo } from './Logo'
import { QrCode } from './QrCode'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/properties', label: 'Homes', icon: MapPinHouse, also: '/property/' }, // a property page lives under Homes
  { to: '/opportunities', label: 'Opportunities', icon: TrendingUp },
  { to: '/leads', label: 'Lead tracking', icon: UserCheck },
  { to: '/marketing', label: 'Marketing', icon: Megaphone },
  { to: '/inbox', label: 'Inbox', icon: Inbox, badge: 8 },
]

// Revive AI sits with the other tabs, its icon drawn in the AI gradient. When it's open (like
// Slackbot in Slack) the icon becomes a gradient tile that pops in and slowly shimmers.
function ReviveAiItem({ collapsed }: { collapsed: boolean }) {
  return (
    <NavLink
      to="/ai"
      title={collapsed ? 'Revive AI' : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex h-10 items-center gap-3 rounded-lg px-3 text-base transition-colors',
          isActive ? 'bg-white/10 font-semibold text-white' : 'text-sb-ink hover:bg-white/8 hover:text-white',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* the gradient the resting icon is drawn with */}
          <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
              <linearGradient id="rv-ai-stroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#c2ceea" />
                <stop offset="55%" stopColor="#b080e0" />
                <stop offset="100%" stopColor="#cda7ec" />
              </linearGradient>
            </defs>
          </svg>
          {isActive ? (
            <span className="rv-ai-tile -mx-1 grid size-6 shrink-0 place-items-center rounded-md text-white">
              <Sparkles className="size-3.5" />
            </span>
          ) : (
            <Sparkles className="size-4 shrink-0" stroke="url(#rv-ai-stroke)" />
          )}
          {!collapsed && <span className={cn('flex-1', isActive ? 'rv-ai-text' : 'rv-ai-text-rest')}>Revive AI</span>}
        </>
      )}
    </NavLink>
  )
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { pathname } = useLocation()
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

      <nav className="mt-6 flex flex-col gap-1 px-3" aria-label="Main">
        <ReviveAiItem collapsed={collapsed} />
        {NAV.map(({ to, label, icon: Icon, end, badge, also }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'relative flex h-10 items-center gap-3 rounded-lg px-3 text-base transition-colors',
                isActive || (also && pathname.startsWith(also)) ? 'bg-sb-active font-medium text-white' : 'text-sb-ink hover:bg-white/8 hover:text-white',
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
