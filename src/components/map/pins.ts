import L from 'leaflet'
import { gain } from '@/lib/format'
import type { Opportunity } from '@/lib/opportunities'

export function pinClass(o: Opportunity) {
  if (o.stage === 'project') return 'project'
  if (o.property.source === 'revive') return 'revive'
  if (o.urgency === 'now') return 'now'
  if (o.urgency === 'soon') return 'soon'
  return 'keep'
}

export function pinLabel(o: Opportunity) {
  if (o.stage === 'project') return 'Project'
  return o.gain > 0 ? gain(o.gain) : '•'
}

export function pinIcon(o: Opportunity, active = false) {
  return L.divIcon({
    className: `rv-pin ${pinClass(o)}${active ? ' active' : ''}`,
    html: `<span>${pinLabel(o)}</span>`,
    iconSize: [0, 0],
  })
}

export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
