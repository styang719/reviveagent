import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// "Add a home" opens the full-screen intake (pages/AddHome.tsx). The sidebar stays.

export type AddIntent = 'sell' | 'renovate' | 'build'

export function AddHomeButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/properties/new')}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-4 text-[14px] font-medium text-white shadow-sm hover:opacity-90"
    >
      <Plus className="size-4" /> Add a home
    </button>
  )
}
