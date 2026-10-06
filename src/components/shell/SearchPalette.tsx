import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useEffect } from 'react'
import { useUi } from '@/store/ui'
import { GlobalSearch } from './GlobalSearch'

// "Ask Revive AI about any address or person", opened from the sidebar Search, ⌘K or "/".
export function SearchPalette() {
  const open = useUi((s) => s.paletteOpen)
  const setOpen = useUi((s) => s.setPalette)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy-3/30" />
        <DialogPrimitive.Content
          className="fixed top-[12vh] left-1/2 z-50 h-[480px] w-[calc(100%-32px)] max-w-xl -translate-x-1/2"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          {open && <GlobalSearch autoFocus onNavigate={() => setOpen(false)} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
