import type { LagSeverity } from './types'

/** Thresholds (messages pending) that delimit the lag severity bands. */
export const LAG_WARNING_THRESHOLD = 10
export const LAG_CRITICAL_THRESHOLD = 100

export const PENDING_WARNING_THRESHOLD = 100
export const PENDING_CRITICAL_THRESHOLD = 1000

export const REDIS_MEMORY_WARNING_BYTES = 500 * 1024 * 1024 // 500 MB
export const REDIS_MEMORY_CRITICAL_BYTES = 1024 * 1024 * 1024 // 1 GB

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

export function getPendingSeverity(pending: number): LagSeverity {
  if (!Number.isFinite(pending) || pending < 0) return 'ok'
  if (pending > PENDING_CRITICAL_THRESHOLD) return 'critical'
  if (pending > PENDING_WARNING_THRESHOLD) return 'warning'
  return 'ok'
}

export function getRedisMemorySeverity(bytes: number): LagSeverity {
  if (bytes > REDIS_MEMORY_CRITICAL_BYTES) return 'critical'
  if (bytes > REDIS_MEMORY_WARNING_BYTES) return 'warning'
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

export function getPendingColorClass(pending: number): string {
  switch (getPendingSeverity(pending)) {
    case 'critical':
      return 'text-red-500'
    case 'warning':
      return 'text-orange-500'
    default:
      return 'text-green-500'
  }
}

export function getRedisMemoryColorClass(bytes: number): string {
  switch (getRedisMemorySeverity(bytes)) {
    case 'critical':
      return 'text-red-500'
    case 'warning':
      return 'text-orange-500'
    default:
      return 'text-emerald-500'
  }
}

export function formatRedisMemory(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}
