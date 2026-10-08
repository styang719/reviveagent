import L from 'leaflet'
import { gain } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'

// Pins follow the Contacts page: this week's calls get the house itself (a photo is recognisable
// at a glance), this month is a navy pill, the rest stay small. Revive referrals are amber,
// projects are outlined.
export function pinKind(o: Opportunity) {
  if (o.stage === 'project') return 'project'
  if (o.property.source === 'revive' && o.referral?.status === 'new') return 'revive'
  return o.urgency
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
}

/** "Robert N." — on the Opportunities map the pin says who, like the Contacts page. */
const shortName = (o: Opportunity) => {
  if (!o.person) return o.property.address.split(' ').slice(0, 2).join(' ')
  const [f, l] = o.person.name.split(' ')
  return `${f}${l ? ` ${l[0]}.` : ''}`
}

/** `dot`: an unlabeled marker in the pin's colour, for small maps. `byName`: label with the person, not the upside. */
export function pinIcon(o: Opportunity, active = false, compact = false, dot = false, byName = false) {
  const kind = pinKind(o)
  const label = byName ? shortName(o) : o.stage === 'project' ? 'Project' : o.gain > 0 ? gain(o.gain) : ''
  const on = active ? ' on' : ''
  let html: string
  if (dot) {
    html = `<span class="rv-dot k-${kind}${on}" title="${esc(o.property.address)}"></span>`
  } else if (kind === 'now' && o.photo && !compact) {
    html =
      `<span class="rv-fpin${on}"><span class="rv-fph" style="background-image:url('${o.photo}')"></span>` +
      `<b>${esc(label)}</b></span><span class="rv-fdot"></span>`
  } else if (kind === 'keep' || kind === 'hold' || kind === 'verify') {
    html = `<span class="rv-dot k-${kind}${on}" title="${esc(o.property.address)}"></span>`
  } else {
    html = `<span class="rv-pill k-${kind}${on}">${esc(label)}</span>`
  }
  return L.divIcon({ className: 'rv-pinwrap', html, iconSize: undefined, iconAnchor: [0, 0] })
}

export function pinZ(o: Opportunity) {
  const k = pinKind(o)
  return { revive: 600, now: 500, project: 400, soon: 300, keep: 200, verify: 100, hold: 0 }[k] ?? 0
}
