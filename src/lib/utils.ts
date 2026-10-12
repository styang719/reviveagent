import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



/** Page content container: wide, with the same padding on every side. */
export const PAGE = 'w-full p-4 sm:p-12' // every page uses the full width with the same 48px padding
