import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useEffect } from 'react'
import { useUi } from '@/store/ui'
import { GlobalSearch } from './GlobalSearch'

// Search any address or person, opened from the sidebar Search or "/". Revive AI has its own page.
export function SearchPalette() {
  const open = useUi((s) => s.paletteOpen)
  const setOpen = useUi((s) => s.setPalette)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)
      if (e.key === '/' && !typing) {
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-navy-3/60" />
        <DialogPrimitive.Content
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-32px)] max-w-xl -translate-x-1/2 rounded-2xl bg-white p-3 shadow-2xl"
          aria-describedby={undefined}
        >
<DialogPrimitive.Title className="sr-only">Search</DialogPrimitive.Title>
          {open && <GlobalSearch autoFocus inline onNavigate={() => setOpen(false)} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
