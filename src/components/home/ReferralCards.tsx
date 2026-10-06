import { Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ReferEarn() {
  return (
    <Card className="p-4">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
        <Gift className="size-4 text-brand" /> Refer & Earn
      </h2>
      <p className="mt-1 text-sm text-ink-2">Know an agent who should work with Revive? Earn [AMOUNT] when they close their first Revive deal.</p>
      <Button variant="outline" size="sm" className="mt-3 w-full">
        Copy your referral link
      </Button>
    </Card>
  )
}
