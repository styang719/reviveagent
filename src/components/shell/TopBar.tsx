import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ReviveMark } from './Logo'

// Phones only: the sidebar is hidden there, so keep the logo and a way into Revive AI.
export function TopBar() {
  return (
    <header className="sticky z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden" style={{ top: 'var(--demo-h, 0px)' }}>
      <Link to="/" className="grid size-9 shrink-0 place-items-center rounded-lg bg-sb" aria-label="Revive home">
        <ReviveMark className="h-5 w-auto" />
      </Link>
      <Link to="/ai" className="ml-auto grid size-10 place-items-center rounded-lg text-ink-2 hover:bg-line-soft" aria-label="Revive AI">
        <Sparkles className="size-5" />
      </Link>
    </header>
  )
}
