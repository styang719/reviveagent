import mark from '@/assets/revive-mark.svg'
import wordmark from '@/assets/revive-wordmark.svg'

// Official Revive logo (vector, white for the navy sidebar), taken from the built Contacts page.
export function ReviveMark({ className = 'h-7 w-auto' }: { className?: string }) {
  return <img src={mark} alt="" aria-hidden="true" className={className} />
}

export function ReviveLogo({ collapsed }: { collapsed?: boolean }) {
  return collapsed ? <img src={mark} alt="Revive" className="h-8 w-auto" /> : <img src={wordmark} alt="Revive" className="h-8 w-auto" />
}
