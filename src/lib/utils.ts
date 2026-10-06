import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function focusGlobalSearch() {
  document.querySelector<HTMLInputElement>('[data-global-search]')?.focus()
}

export function focusHeroSearch() {
  const el = document.querySelector<HTMLInputElement>('[data-hero-search]')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el?.focus({ preventScroll: true })
}
