import logo from '@/assets/revive-logo-white.png'
import mark from '@/assets/revive-mark-white.png'

// Official Revive logo (white, for the navy sidebar). The mark is cropped from the same file.
export function ReviveMark({ className = 'size-7' }: { className?: string }) {
  return <img src={mark} alt="" aria-hidden="true" className={className} />
}

export function ReviveLogo({ collapsed }: { collapsed?: boolean }) {
  return collapsed ? <img src={mark} alt="Revive" className="size-8" /> : <img src={logo} alt="Revive" className="h-8 w-auto" />
}
