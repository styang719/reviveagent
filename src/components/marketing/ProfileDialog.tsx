import { useState } from 'react'
import { toast } from 'sonner'
import michelle from '@/assets/avatar-michelle.jpg'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { AGENT } from '@/data/tiers'
import { DEMO_LICENSE, useDemo, type MarketingProfile } from '@/store/demo'

// Marketing profile: the photo, name, license and contact details printed on every template. Set once.

const FIELDS: { key: keyof MarketingProfile; label: string; type?: string }[] = [
  { key: 'name', label: 'Name on templates' },
  { key: 'license', label: 'DRE license #' },
  { key: 'brokerage', label: 'Brokerage' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'email', label: 'Email', type: 'email' },
]

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const saved = useDemo((s) => s.marketingProfile)
  const save = useDemo((s) => s.saveMarketingProfile)
  const [form, setForm] = useState<MarketingProfile>(
    saved ?? { name: AGENT.name, license: DEMO_LICENSE, brokerage: 'Compass Pasadena', phone: '(626) 555-0148', email: 'michelle@michellephillips.com' },
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Your marketing profile</DialogTitle>
        <DialogDescription>This goes on every template, so materials come out branded for you.</DialogDescription>
        <form
          className="mt-5 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            save(form)
            onOpenChange(false)
            toast.success('Marketing profile saved', { description: 'Every template now carries your photo, name and license.' })
          }}
        >
          <div className="flex items-center gap-4">
            <img src={michelle} alt="" className="size-16 rounded-full object-cover" />
            <div>
              <p className="text-[14px] font-medium text-ink">Profile photo</p>
              <button type="button" className="text-[13px] font-medium text-brand hover:underline" onClick={() => toast('Photo upload isn’t in the prototype yet')}>
                Change photo
              </button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className={f.key === 'name' || f.key === 'email' ? 'sm:col-span-2' : undefined}>
                <span className="text-[13px] font-medium text-ink-2">{f.label}</span>
                <input
                  type={f.type ?? 'text'}
                  required
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3 text-[14px] text-ink outline-none focus:border-[var(--brand-primary-border)] focus:ring-2 focus:ring-[var(--brand-primary-subtle)]"
                />
              </label>
            ))}
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save profile</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
