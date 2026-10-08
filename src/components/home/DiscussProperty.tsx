import { MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useUi } from '@/store/ui'

// Header action: talk a property through with Revive AI before committing to anything. (The advisor
// request dialog below is kept for when a call is the better next step.)
const PRODUCTS = ['Not sure yet', 'Renovate to Sell', 'Renovate to Stay', 'Sell 360', 'Flip 360']
const WHEN = ['Today', 'Tomorrow morning', 'Later this week']

export function DiscussProperty() {
  const open = useUi((s) => s.discussOpen)
  const setOpen = useUi((s) => s.setDiscuss)
  const requestAi = useUi((s) => s.requestAi)
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (address.trim().length < 5) return setError('Add the property address so the advisor can pull it up before the call.')
    const when = new FormData(e.currentTarget).get('when')
    setOpen(false)
    setAddress('')
    setError(null)
    toast.success('Request sent', { description: `A Revive project advisor will call you ${String(when).toLowerCase()} about ${address.trim()}.` })
  }

  const field = 'mt-1 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'

  return (
    <>
      <button
        // talk it through with Revive AI: a fresh conversation in the docked chat that asks which home
        onClick={() => requestAi('/ai?flow=discuss')}
        className="flex h-11 shrink-0 items-center gap-2 rounded-md bg-[var(--brand-primary)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2f4a89]"
      >
        <MessageSquareText className="size-4" />
        Discuss a property
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Discuss a property with Revive</DialogTitle>
          <DialogDescription>A project advisor will call you to talk it through: what the home could be worth and which Revive product fits.</DialogDescription>
          <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
            <div>
              <label htmlFor="dp-address" className="text-[13px] font-medium text-ink-2">
                Property address
              </label>
              <input
                id="dp-address"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  setError(null)
                }}
                placeholder="1847 Las Lunas St, Pasadena"
                autoComplete="off"
                aria-invalid={!!error}
                aria-describedby={error ? 'dp-error' : undefined}
                className={`${field} h-10 ${error ? 'border-bad' : ''}`}
              />
              {error && (
                <p id="dp-error" className="mt-1 text-[12px] text-bad">
                  {error}
                </p>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="dp-product" className="text-[13px] font-medium text-ink-2">
                  What you have in mind
                </label>
                <select id="dp-product" name="product" className={`${field} h-10`}>
                  {PRODUCTS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dp-when" className="text-[13px] font-medium text-ink-2">
                  Best time to call
                </label>
                <select id="dp-when" name="when" className={`${field} h-10`}>
                  {WHEN.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="dp-notes" className="text-[13px] font-medium text-ink-2">
                Anything we should know <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea id="dp-notes" name="notes" rows={3} placeholder="Seller wants to list in spring; kitchen is original." className={`${field} py-2`} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Request a call</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
