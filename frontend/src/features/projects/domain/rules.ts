import type { OverviewStats, Project } from './types'

/** A device is considered "active" if it reported within this window. */
export const DEVICE_ACTIVE_TTL_MS = 10_000

/** Data is considered "flowing" on overview if the last event is this recent. */
export const DATA_FLOW_THRESHOLD_MS = 10_000

/**
 * Counts devices of a project whose `lastSeenAt` is within the active TTL.
 * Pure function; safe to use in tests and SSR.
 */
export function countActiveDevices(
  project: Pick<Project, 'devices'>,
  nowMs: number = Date.now(),
  ttlMs: number = DEVICE_ACTIVE_TTL_MS,
): number {
  if (!Array.isArray(project.devices)) return 0
  return project.devices.filter((d) => {
    if (!d.lastSeenAt) return false
    const seen = new Date(d.lastSeenAt).getTime()
    if (!Number.isFinite(seen)) return false
    return nowMs - seen < ttlMs
  }).length
}

/** Returns `true` when the last recent event is newer than the flow threshold. */
export function isOverviewDataFlowing(
  stats: Pick<OverviewStats, 'recentEvents'> | null | undefined,
  nowMs: number = Date.now(),
  thresholdMs: number = DATA_FLOW_THRESHOLD_MS,
): boolean {
  const last = stats?.recentEvents?.[0]?.timestamp
  if (!last) return false
  const t = new Date(last).getTime()
  if (!Number.isFinite(t)) return false
  return nowMs - t < thresholdMs
}
