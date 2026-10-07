import { RotateCcw } from 'lucide-react'
import { useRouteError } from 'react-router-dom'
import { Button } from '@/components/ui/button'

/** If a screen crashes, say so plainly and offer a clean restart of the demo. */
export function RouteError() {
  const error = useRouteError()
  const restart = () => {
    try {
      localStorage.removeItem('revive-demo')
      sessionStorage.removeItem('revive-ui')
    } catch {
      // storage can be blocked; reloading still helps
    }
    window.location.hash = ''
    window.location.reload()
  }
  return (
    <div className="grid min-h-screen place-items-center bg-white p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-ink">Something went wrong in the prototype</h1>
        <p className="mt-2 text-sm text-ink-2">Resetting the demo clears saved demo settings and the Revive AI chat, then starts again.</p>
        <Button className="mt-5" onClick={restart}>
          <RotateCcw /> Reset demo
        </Button>
        <p className="mt-4 text-[12px] break-words text-faint">{error instanceof Error ? error.message : String(error)}</p>
      </div>
    </div>
  )
}
