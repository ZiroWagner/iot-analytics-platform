import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind class strings while de-duplicating conflicting utilities.
 * Pure helper; safe to use anywhere.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
