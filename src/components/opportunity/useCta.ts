import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { firstName } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'
import { useDemo } from '@/store/demo'

// What the contextual CTA on an opportunity does. Dialog-based flows (share, start project) land in phase 2;
// until then they route to the Property page tab where the action lives.
export function useCta() {
  const navigate = useNavigate()
  const claim = useDemo((s) => s.claimReferral)

  return (o: Opportunity) => {
    const pid = o.property.id
    switch (o.cta.kind) {
      case 'claim':
        claim(pid)
        toast.success('Lead claimed', {
          description: `Revive let ${o.person ? firstName(o.person.name) : 'the homeowner'} know you’ll reach out today.`,
        })
        return
      case 'share':
        return navigate(`/property/${pid}?tab=report`)
      case 'propose':
      case 'project':
        return navigate(`/property/${pid}?tab=project`)
      case 'followup':
      case 'activity':
        return navigate(o.person ? `/person/${o.person.id}` : `/property/${pid}`)
    }
  }
}
