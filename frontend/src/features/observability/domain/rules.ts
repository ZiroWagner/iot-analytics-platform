import type { LagSeverity } from './types'

/** Thresholds (messages pending) that delimit the lag severity bands. */
export const LAG_WARNING_THRESHOLD = 10
export const LAG_CRITICAL_THRESHOLD = 100

/**
 * Classifies a Redis-Streams consumer lag value into a severity band.
 * Pure function; no React/DOM.
 */
export function getLagSeverity(lag: number): LagSeverity {
  if (!Number.isFinite(lag) || lag < 0) return 'ok'
  if (lag > LAG_CRITICAL_THRESHOLD) return 'critical'
  if (lag > LAG_WARNING_THRESHOLD) return 'warning'
  return 'ok'
}

/** Tailwind text color class for the current lag severity. */
export function getLagColorClass(lag: number): string {
  switch (getLagSeverity(lag)) {
    case 'critical':
      return 'text-red-500'
    case 'warning':
      return 'text-orange-500'
    default:
      return 'text-green-500'
  }
}
