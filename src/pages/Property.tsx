import { ArrowLeft, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { PropertyView, usePropertyModel, type PropertyTab } from '@/components/property/PropertyView'
import { HomeConversations } from '@/components/property/HomeConversations'
import { PAGE } from '@/lib/utils'
import { useDemo } from '@/store/demo'
import { useUi } from '@/store/ui'
import { Placeholder } from './Placeholder'

const TABS: PropertyTab[] = ['report', 'project', 'marketing']

export default function Property() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const handoff = useDemo((s) => s.handoff)
  const hasChat = useUi((s) => s.chat.length > 0)
  const m = usePropertyModel(id, params.get('address') ?? undefined)
  const tabParam = params.get('tab') as PropertyTab | null
  const tab: PropertyTab = tabParam && TABS.includes(tabParam) ? tabParam : 'report'
  const fromAi = !!(location.state as { fromAi?: boolean } | null)?.fromAi

  // tell Revive AI which home this is, so the docked chat can answer about it
  const setHere = useUi((s) => s.setHere)
  const hereKey = m ? `${m.id}|${m.address}|${m.city}` : ''
  useEffect(() => {
    if (!hereKey) return
    const [hid, address, city] = hereKey.split('|')
    setHere({ id: hid, address, city })
    return () => setHere(null)
  }, [hereKey, setHere])

  if (!m) return <Placeholder title="Property not found" intro="It may not be visible at this tier. Try switching the demo tier." phase={2} />

  return (
    <div className={PAGE}>
      {fromAi && hasChat && handoff !== 'dock' ? (
        // A (and B's "open as a page"): the result is a page; the conversation is one click back
        <Link
          to="/ai"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-agent-subtle)] px-3 py-1.5 text-[13px] font-medium text-[var(--brand-agent)] hover:brightness-95"
        >
          <ArrowLeft className="size-3.5" /> <Sparkles className="size-3.5" /> Back to your Revive AI conversation
        </Link>
      ) : (
        <Link to="/properties" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-brand">
          <ArrowLeft className="size-3.5" /> Properties
        </Link>
      )}
      <div className="mt-4">
        <PropertyView
          m={m}
          tab={tab}
          onTab={(t) => {
            const next = new URLSearchParams(params)
            next.set('tab', t)
            setParams(next, { replace: true, state: location.state })
          }}
        />
      </div>
      <HomeConversations id={m.id} address={m.address} />
    </div>
  )
}
