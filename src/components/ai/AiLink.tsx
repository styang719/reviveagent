import { forwardRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUi } from '@/store/ui'

/**
 * A link to Revive AI with context (/ai?q=… or /ai?flow=report|project&property=…). Instead of leaving
 * the page it opens the docked chat and starts there; the dock's expand button goes to the full page.
 * On the Revive AI page itself it just navigates, so the page starts the conversation.
 */
export const AiLink = forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>(function AiLink(
  { to, onClick, ...rest },
  ref,
) {
  const requestAi = useUi((s) => s.requestAi)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <a
      ref={ref}
      href={`#${to}`}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey) return
        e.preventDefault()
        if (pathname === '/ai') navigate(to)
        else requestAi(to)
      }}
      {...rest}
    />
  )
})
