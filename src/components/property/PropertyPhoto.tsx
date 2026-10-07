import { Home } from 'lucide-react'
import { photoUrl } from '@/lib/assets'
import { cn } from '@/lib/utils'

// Illustrative photo (from the Contacts page photo set); a soft placeholder when there is none.
export function PropertyPhoto({ photo, className, label }: { photo?: string; className?: string; label: string }) {
  const src = photoUrl(photo)
  if (src) return <img src={src} alt={`Photo of ${label}`} className={cn('shrink-0 rounded-lg object-cover', className)} loading="lazy" />
  return (
    <div role="img" aria-label={`No photo yet for ${label}`} className={cn('grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-soft to-[#c2ceea]', className)}>
      <Home className="size-1/3 max-h-10 max-w-10 text-white" strokeWidth={1.5} />
    </div>
  )
}
