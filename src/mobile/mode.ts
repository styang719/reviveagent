// The app has two views in one prototype: desktop (the usual routes) and mobile (the same app under /m with
// its own shell). Pick one from the View dropdown; it sticks for this tab. While mobile is on, any link to a
// desktop page lands on its /m twin instead, so the whole app stays mobile.

const KEY = 'revive-view'
export const PHONE_FRAME_NAME = 'revive-phone'

type Win = Window & { reviveMobileApp?: boolean }

export function isMobileApp() {
  if (typeof window === 'undefined') return false
  const w = window as Win
  if (typeof w.reviveMobileApp === 'boolean') return w.reviveMobileApp
  try {
    return sessionStorage.getItem(KEY) === 'mobile'
  } catch {
    return false
  }
}

export function setMobileApp(on: boolean) {
  ;(window as Win).reviveMobileApp = on
  try {
    sessionStorage.setItem(KEY, on ? 'mobile' : 'desktop')
  } catch {
    // storage blocked: the choice lasts until the page reloads
  }
}

/** Inside the phone frame shown on wide screens (the frame is an iframe so the pages lay out as on a phone). */
export const inPhoneFrame = () => typeof window !== 'undefined' && window.name === PHONE_FRAME_NAME
