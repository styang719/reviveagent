import L from 'leaflet'
import markSvg from '@/assets/revive-mark.svg?raw'
import type { Listing } from './data'

// Pins: plain MLS listings are quiet white price tags (a dot when zoomed out); Revive's Flip360 opportunities
// are solid green with the Revive mark; potential ones are outlined green. A selected pin grows and darkens.

const MARK = markSvg.replace('<svg ', '<svg aria-hidden="true" class="f3-mark" ').replace('fill="#fff"', 'fill="currentColor"')
const CHECK =
  '<svg aria-hidden="true" class="f3-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>'

/** $745K, $1.05M */
export const short = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2).replace(/0$/, '').replace(/\.0$/, '')}M` : `$${Math.round(n / 1000)}K`)

/** How much a pin says at this zoom: far = every pin a dot, mid = plain listings are dots, near = all labeled. */
export type Detail = 'far' | 'mid' | 'near'
export const detailAt = (z: number): Detail => (z < 12.75 ? 'far' : z < 13.5 ? 'mid' : 'near')

/** Selection isn't baked in: the page toggles `.on` on the pin so the change animates. */
export function pinIcon(l: Listing, opts: { detail: Detail; done: boolean }) {
  let html: string
  if (l.tier === 'standard') {
    html = opts.detail !== 'near' ? '<span class="f3-dot" data-pin></span>' : `<span class="f3-pin f3-mls" data-pin>${short(l.price)}</span>`
  } else if (opts.detail === 'far') {
    html = `<span class="f3-dot ${l.tier === 'qualified' ? 'f3-dot-go' : 'f3-dot-maybe'}" data-pin></span>`
  } else {
    const cls = l.tier === 'qualified' ? 'f3-go' : 'f3-maybe'
    html = `<span class="f3-pin ${cls}" data-pin>${opts.done ? CHECK : MARK}${short(l.price)}</span>`
  }
  return L.divIcon({ className: 'rv-pinwrap', html, iconAnchor: [0, 0] })
}

export const pinZ = (l: Listing, on: boolean) => (on ? 5000 : l.tier === 'qualified' ? 2000 : l.tier === 'potential' ? 1500 : 0)

export const hereIcon = L.divIcon({ className: 'rv-pinwrap', html: '<span class="rv-me" title="You are here"></span>', iconAnchor: [0, 0] })
