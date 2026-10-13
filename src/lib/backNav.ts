import { useEffect, useSyncExternalStore } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Remembers, for each history entry, the in-app page the user came from, so a back link can return there
// (Marketing center → a home → "← Marketing center") instead of always pointing at the page's parent.
// `steps` is how many history entries back that page is: tab and filter changes on the same page
// don't count as a new page.

type Prev = { path: string; steps: number }
const prevByKey = new Map<string, Prev | null>()
let last: { key: string; path: string; pathname: string } | null = null
const subs = new Set<() => void>()
let version = 0

export function useTrackBackNav() {
  const loc = useLocation()
  const type = useNavigationType()
  useEffect(() => {
    const path = loc.pathname + loc.search
    if (!prevByKey.has(loc.key)) {
      const before = last && prevByKey.get(last.key)
      let prev: Prev | null
      if (!last) prev = null
      else if (type === 'REPLACE') prev = before ?? null // same history slot, same way back
      else if (last.pathname === loc.pathname) prev = before ? { ...before, steps: before.steps + 1 } : null // same page, new tab
      else prev = { path: last.path, steps: 1 }
      prevByKey.set(loc.key, prev)
    }
    last = { key: loc.key, path, pathname: loc.pathname }
    version++
    subs.forEach((f) => f())
  }, [loc.key, loc.pathname, loc.search, type])
}

const LABELS: [RegExp, string][] = [
  [/^\/$/, 'Dashboard'],
  [/^\/ai/, 'Revive AI'],
  [/^\/properties/, 'Homes'],
  [/^\/opportunities/, 'Opportunities'],
  [/^\/leads\/referrals\/./, 'Referral'],
  [/^\/leads\/referrals/, 'Your seller referrals'],
  [/^\/leads/, 'Lead tracking'],
  [/^\/marketing/, 'Marketing center'],
  [/^\/inbox/, 'Inbox'],
  [/^\/case-studies/, 'Revive near you'],
  [/^\/map/, 'Map'],
  [/^\/more/, 'More'],
]

export function labelFor(path: string) {
  const p = path.split('?')[0].replace(/^\/m(?=\/|$)/, '') || '/'
  return LABELS.find(([re]) => re.test(p))?.[1] ?? 'Back'
}

/** Where "back" goes from the current entry: the page the user came from, or null on a fresh load. */
export function useBackTarget() {
  const loc = useLocation()
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => version,
  )
  const prev = prevByKey.get(loc.key)
  return prev ? { ...prev, label: labelFor(prev.path) } : null
}
