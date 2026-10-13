import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useBackTarget } from '@/lib/backNav'
import { cn } from '@/lib/utils'

/** "← Previous page": returns to wherever the user came from; on a fresh load, falls back to the page's parent. */
export function BackLink({ to, label, className }: { to: string; label: string; className?: string }) {
  const back = useBackTarget()
  const navigate = useNavigate()
  const cls = cn('inline-flex items-center gap-1 text-[13px] text-muted hover:text-brand', className)
  if (back)
    return (
      <button type="button" onClick={() => navigate(-back.steps)} className={cls}>
        <ArrowLeft className="size-3.5" /> {back.label}
      </button>
    )
  return (
    <Link to={to} className={cls}>
      <ArrowLeft className="size-3.5" /> {label}
    </Link>
  )
}
