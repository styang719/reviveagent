export function ReviveMark({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2.5 3 11v16.5a2 2 0 0 0 2 2h9V20h4v9.5h9a2 2 0 0 0 2-2V11z" fill="#fff" />
      <path d="M12 15h8v5h-8z" fill="#1B1F4F" />
    </svg>
  )
}

export function ReviveLogo({ collapsed }: { collapsed?: boolean }) {
  return (
    <span className="flex items-center gap-2 text-white">
      <ReviveMark />
      {!collapsed && <span className="text-[26px] leading-none font-bold tracking-tight">Revive</span>}
      <span className="sr-only">Revive</span>
    </span>
  )
}
