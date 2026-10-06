import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GlobalSearch } from './GlobalSearch'
import { ReviveMark } from './Logo'

export function TopBar() {
  return (
    <header className="sticky z-30 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur sm:px-8" style={{ top: 'var(--demo-h, 0px)' }}>
      <Link to="/" className="grid size-9 shrink-0 place-items-center rounded-lg bg-sb lg:hidden" aria-label="Revive home">
        <ReviveMark className="size-5" />
      </Link>
      <GlobalSearch className="min-w-0" />
      <Link to="/inbox" className="relative ml-auto shrink-0 rounded-lg p-2 text-ink-2 hover:bg-line-soft" aria-label="Inbox, 8 unread">
        <Bell className="size-5" />
        <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-bad" />
      </Link>
    </header>
  )
}
