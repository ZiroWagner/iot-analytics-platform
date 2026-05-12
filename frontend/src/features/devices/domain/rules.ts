import type { DeviceState } from '@/features/telemetry'

/** Fallback TTL when real-time state is not yet available from the WebSocket. */
export const DEVICE_ACTIVE_FALLBACK_TTL_MS = 15_000

/**
 * Determines if a device should be shown as active.
 *
 * Precedence:
 * 1. Live WebSocket state (if present): `online` wins regardless of lastSeenAt.
 * 2. Otherwise, fall back to `lastSeenAt` within the TTL window.
 *
 * Pure function; callers inject `nowMs` in tests.
 */
export function isDeviceActive(
  deviceId: string,
  lastSeenAt: string | undefined,
  realtimeDevices: Record<string, Pick<DeviceState, 'status'>>,
  nowMs: number = Date.now(),
  ttlMs: number = DEVICE_ACTIVE_FALLBACK_TTL_MS,
): boolean {
  const wsState = realtimeDevices[deviceId]
  if (wsState) return wsState.status === 'online'
  if (!lastSeenAt) return false
  const seen = new Date(lastSeenAt).getTime()
  if (!Number.isFinite(seen)) return false
  return nowMs - seen < ttlMs
}

/** Counts active devices using {@link isDeviceActive} for each entry. */
export function countActiveDevicesFromList(
  devices: Array<{ id: string; lastSeenAt?: string }>,
  realtimeDevices: Record<string, Pick<DeviceState, 'status'>>,
  nowMs: number = Date.now(),
): number {
  if (!Array.isArray(devices)) return 0
  return devices.reduce(
    (acc, d) => acc + (isDeviceActive(d.id, d.lastSeenAt, realtimeDevices, nowMs) ? 1 : 0),
    0,
  )
}
