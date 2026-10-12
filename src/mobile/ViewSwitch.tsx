import { ChevronDown, Monitor, Smartphone } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { isMobileApp, setMobileApp } from './mode'

/** Desktop or mobile prototype, one dropdown. `tone`: on the navy demo bar, or on a light page. */
export function ViewSwitch({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const navigate = useNavigate()
  const mobile = isMobileApp()
  const Icon = mobile ? Smartphone : Monitor
  return (
    <label className={cn('relative inline-flex shrink-0 items-center', tone === 'dark' ? 'text-white' : 'text-ink')}>
      <span className="sr-only">Prototype view</span>
      <Icon className="pointer-events-none absolute left-2.5 size-3.5" />
      <select
        value={mobile ? 'mobile' : 'desktop'}
        onChange={(e) => {
          const on = e.target.value === 'mobile'
          setMobileApp(on)
          navigate(on ? '/m' : '/')
        }}
        className={cn(
          'h-8 appearance-none rounded-lg pr-8 pl-8 text-[13px] font-medium outline-none',
          tone === 'dark' ? 'bg-white/10 hover:bg-white/15 [&>option]:text-ink' : 'border border-line bg-white hover:bg-head',
        )}
      >
        <option value="desktop">Desktop</option>
        <option value="mobile">Mobile</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 size-3.5 opacity-70" />
    </label>
  )
}
