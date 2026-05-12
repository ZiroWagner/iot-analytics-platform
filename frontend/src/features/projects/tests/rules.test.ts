import { describe, expect, it } from 'vitest'
import {
  countActiveDevices,
  DATA_FLOW_THRESHOLD_MS,
  DEVICE_ACTIVE_TTL_MS,
  isOverviewDataFlowing,
} from '../domain/rules'

describe('countActiveDevices', () => {
  const now = new Date('2026-01-01T00:00:10Z').getTime()

  it('returns 0 when devices list is missing or not an array', () => {
    expect(countActiveDevices({ devices: undefined })).toBe(0)
    expect(countActiveDevices({ devices: [] })).toBe(0)
  })

  it('counts only devices with lastSeenAt within the TTL', () => {
    const project = {
      devices: [
        { id: 'a', lastSeenAt: new Date(now - 1000).toISOString() }, // active
        { id: 'b', lastSeenAt: new Date(now - (DEVICE_ACTIVE_TTL_MS + 1000)).toISOString() }, // stale
        { id: 'c' }, // no lastSeenAt
        { id: 'd', lastSeenAt: 'not-a-date' }, // invalid
      ],
    }
    expect(countActiveDevices(project, now)).toBe(1)
  })
})

describe('isOverviewDataFlowing', () => {
  const now = new Date('2026-01-01T00:00:10Z').getTime()

  it('returns false when stats or recentEvents is missing', () => {
    expect(isOverviewDataFlowing(null, now)).toBe(false)
    expect(isOverviewDataFlowing({ recentEvents: [] }, now)).toBe(false)
  })

  it('returns true when the last event is newer than the threshold', () => {
    const fresh = {
      recentEvents: [
        {
          id: '1',
          payload: {},
          timestamp: new Date(now - 1000).toISOString(),
        },
      ],
    }
    expect(isOverviewDataFlowing(fresh, now)).toBe(true)
  })

  it('returns false for stale timestamps', () => {
    const stale = {
      recentEvents: [
        {
          id: '1',
          payload: {},
          timestamp: new Date(now - (DATA_FLOW_THRESHOLD_MS + 1000)).toISOString(),
        },
      ],
    }
    expect(isOverviewDataFlowing(stale, now)).toBe(false)
  })
})
