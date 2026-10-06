import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

// Phase 1 stand-in for screens built in later phases. Always offers a way forward.
export function Placeholder({ title, intro, phase, children }: { title: string; intro: string; phase: number; children?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-8 sm:py-8">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-[15px] text-ink-2">{intro}</p>
      <div className="mt-6 rounded-xl border border-dashed border-line bg-head p-6">
        <p className="text-sm text-muted">This screen is built in phase {phase} of the prototype.</p>
        {children}
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link to="/">
            <ArrowLeft /> Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
