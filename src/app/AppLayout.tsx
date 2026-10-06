import { useEffect, useState } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { Toaster } from 'sonner'
import { DEMO_BAR_HEIGHT, DemoBar } from '@/components/shell/DemoBar'
import { CrmDialog } from '@/components/home/ConnectBook'
import { SearchPalette } from '@/components/shell/SearchPalette'
import { Sidebar } from '@/components/shell/Sidebar'
import { TopBar } from '@/components/shell/TopBar'
import type { Tier } from '@/data/types'
import { useDemo } from '@/store/demo'

const TIERS: Tier[] = ['new', 'active', 'partner']

function useDemoVisible() {
  const [params] = useSearchParams()
  const flag = params.get('demo')
  useEffect(() => {
    try {
      if (flag === '0' || flag === '1') sessionStorage.setItem('revive-demo-bar', flag)
    } catch {
      // storage can be blocked; the flag then only lasts for this URL
    }
  }, [flag])
  if (flag === '0') return false
  if (flag === '1') return true
  try {
    return sessionStorage.getItem('revive-demo-bar') !== '0'
  } catch {
    return true
  }
}

export function AppLayout() {
  const [params] = useSearchParams()
  const { pathname } = useLocation()
  const setTier = useDemo((s) => s.setTier)
  const showDemo = useDemoVisible()
  const [collapsed, setCollapsed] = useState(false)

  // Deep links can pin a tier: /?tier=partner
  const tierParam = params.get('tier') as Tier | null
  useEffect(() => {
    if (tierParam && TIERS.includes(tierParam)) setTier(tierParam)
  }, [tierParam, setTier])

  useEffect(() => window.scrollTo(0, 0), [pathname])

  return (
    <div className="min-h-screen bg-white" style={{ ['--demo-h' as string]: showDemo ? `${DEMO_BAR_HEIGHT}px` : '0px' }}>
      {showDemo && <DemoBar />}
      <div className="flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <div className="min-w-0 flex-1">
          <TopBar />
          <main id="main">
            <Outlet />
          </main>
        </div>
      </div>
      <SearchPalette />
      <CrmDialog />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  )
}
