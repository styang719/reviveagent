import { Home } from 'lucide-react'
import { cn } from '@/lib/utils'

const PALETTES = [
  ['#dbe6ff', '#9db4ea'],
  ['#e3f3ec', '#9fd2bd'],
  ['#fdf0dc', '#e8c48e'],
  ['#efe7fb', '#bda8e6'],
  ['#e6eef4', '#a9c0d2'],
]

// Placeholder photo: a soft, per-property gradient with a house glyph.
export function PropertyPhoto({ id, className, label }: { id: string; className?: string; label: string }) {
  const i = [...id].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTES.length
  const [a, b] = PALETTES[i]
  return (
    <div
      role="img"
      aria-label={`Photo of ${label}`}
      className={cn('grid shrink-0 place-items-center overflow-hidden rounded-lg', className)}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      <Home className="size-1/3 max-h-10 max-w-10 text-white/90" strokeWidth={1.5} />
    </div>
  )
}
