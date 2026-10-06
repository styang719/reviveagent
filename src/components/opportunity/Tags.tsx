import { Lock } from 'lucide-react'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { Source, Stage, Urgency } from '@/data/types'
import { SOURCE_LABEL, STAGE_LABEL, type Tag } from '@/lib/opportunities'
import { URGENCY_LABEL } from '@/lib/urgency'

const URGENCY_VARIANT: Record<Urgency, BadgeProps['variant']> = {
  now: 'navy',
  soon: 'brand',
  keep: 'default',
  verify: 'warn',
  hold: 'bad',
}

const STAGE_VARIANT: Record<Stage, BadgeProps['variant']> = {
  spotted: 'outline',
  shared: 'brand',
  interested: 'ok',
  project: 'navy',
}

export function UrgencyTag({ urgency }: { urgency: Urgency }) {
  return <Badge variant={URGENCY_VARIANT[urgency]}>{URGENCY_LABEL[urgency]}</Badge>
}

export function SourceTag({ source }: { source: Source }) {
  return <Badge variant={source === 'revive' ? 'warn' : 'outline'}>{SOURCE_LABEL[source]}</Badge>
}

export function StageTag({ stage }: { stage: Stage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{STAGE_LABEL[stage]}</Badge>
}

export function OppTag({ tag }: { tag: Tag }) {
  return <Badge variant={tag === 'Data check' ? 'warn' : 'default'}>{tag}</Badge>
}

export function LockedTag({ children }: { children: React.ReactNode }) {
  return (
    <Badge variant="outline" className="border-dashed text-muted">
      <Lock /> {children}
    </Badge>
  )
}
