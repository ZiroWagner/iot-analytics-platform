import { describe, expect, it } from 'vitest'
import {
  countActiveDevicesFromList,
  DEVICE_ACTIVE_FALLBACK_TTL_MS,
  isDeviceActive,
} from '@/features/devices/domain/rules'

describe('isDeviceActive', () => {
  const now = new Date('2026-01-01T00:00:10Z').getTime()

  it('uses WS state first: online wins regardless of lastSeenAt', () => {
    expect(
      isDeviceActive('d1', undefined, { d1: { status: 'online' } }, now),
    ).toBe(true)
    expect(
      isDeviceActive(
        'd1',
        new Date(now - 999_999).toISOString(),
        { d1: { status: 'online' } },
        now,
      ),
    ).toBe(true)
  })

  it('uses WS state first: offline wins regardless of fresh lastSeenAt', () => {
    expect(
      isDeviceActive(
        'd1',
        new Date(now - 100).toISOString(),
        { d1: { status: 'offline' } },
        now,
      ),
    ).toBe(false)
  })

  it('falls back to lastSeenAt when WS state is missing', () => {
    expect(
      isDeviceActive('d1', new Date(now - 1_000).toISOString(), {}, now),
    ).toBe(true)
    expect(
      isDeviceActive(
        'd1',
        new Date(now - (DEVICE_ACTIVE_FALLBACK_TTL_MS + 1000)).toISOString(),
        {},
        now,
      ),
    ).toBe(false)
  })

  it('returns false when no WS state and no lastSeenAt', () => {
    expect(isDeviceActive('d1', undefined, {}, now)).toBe(false)
  })

  it('returns false for invalid lastSeenAt strings', () => {
    expect(isDeviceActive('d1', 'not-a-date', {}, now)).toBe(false)
  })
})

describe('countActiveDevicesFromList', () => {
  const now = new Date('2026-01-01T00:00:10Z').getTime()

  it('returns 0 for empty or non-array input', () => {
    expect(countActiveDevicesFromList([], {}, now)).toBe(0)
  })

  it('counts active devices respecting WS state precedence', () => {
    const devices = [
      { id: 'a', lastSeenAt: new Date(now - 1_000).toISOString() }, // WS overrides below
      { id: 'b', lastSeenAt: new Date(now - 1_000).toISOString() }, // fresh fallback
      { id: 'c' }, // unknown
    ]
    const realtime = {
      a: { status: 'offline' as const },
    }
    expect(countActiveDevicesFromList(devices, realtime, now)).toBe(1)
  })
})