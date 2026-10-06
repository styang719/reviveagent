import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useUi } from '@/store/ui'
import { GlobalSearch } from './GlobalSearch'

// "Ask Revive AI about any address or person", opened from the sidebar Search, ⌘K or "/".
export function SearchPalette() {
  const open = useUi((s) => s.paletteOpen)
  const setOpen = useUi((s) => s.setPalette)
  const mode = useUi((s) => s.paletteMode)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && /INPUT|TEXTAREA/.test(e.target.tagName)
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setOpen(true, 'ai')
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
          <DialogPrimitive.Title className={mode === 'ai' ? 'mb-3 flex items-center gap-2 px-1 pt-1 text-sm font-semibold text-ink' : 'sr-only'}>
            {mode === 'ai' ? (
              <>
                <span className="rv-ai-icon grid size-6 place-items-center rounded-md">
                  <Sparkles className="size-4" />
                </span>
                Revive AI <span className="font-normal text-muted">· ask about any address or person</span>
              </>
            ) : (
              'Search'
            )}
          </DialogPrimitive.Title>
          {open && <GlobalSearch autoFocus inline onNavigate={() => setOpen(false)} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
