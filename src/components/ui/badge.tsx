import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-line-soft text-ink-2',
        brand: 'bg-brand-soft text-brand',
        ok: 'bg-ok-soft text-[var(--green)]',
        warn: 'bg-warn-soft text-warn',
        bad: 'bg-bad-soft text-bad',
        navy: 'bg-navy text-white',
        hot: 'bg-hot text-white',
        outline: 'border border-line text-ink-2',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
