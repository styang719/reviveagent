// The mobile prototype runs the same app under /m with its own layout. It's "on" in the published mobile
// build (the page sets window.reviveMobileApp) or once you've opened /m in this tab during development.
// While on, any link to a desktop page lands on its /m twin instead, so the whole app stays mobile.

const KEY = 'revive-mobile'
export const PHONE_FRAME_NAME = 'revive-phone'

export function isMobileApp() {
  if (typeof window === 'undefined') return false
  if ((window as unknown as { reviveMobileApp?: boolean }).reviveMobileApp) return true
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setMobileApp(on: boolean) {
  // only while developing: the published mobile page sets its own flag, and a stored one could leak into
  // the desktop prototype if both were ever opened in the same tab
  if (!import.meta.env.DEV) return
  try {
    if (on) sessionStorage.setItem(KEY, '1')
    else sessionStorage.removeItem(KEY)
  } catch {
    // storage blocked: the flag only lasts while you stay under /m
  }
}

/** Inside the phone frame shown on wide screens (the frame is an iframe so the pages lay out as on a phone). */
export const inPhoneFrame = () => typeof window !== 'undefined' && window.name === PHONE_FRAME_NAME
