import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



/** Page content container: wide, with the same padding on every side. */
export const PAGE = 'mx-auto w-full max-w-[1600px] p-4 sm:p-10'
