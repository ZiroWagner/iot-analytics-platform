import { describe, expect, it } from 'vitest'
import {
  applyEventToDevices,
  applyEventsToDevices,
  buildDeviceMapFromInitialState,
  EVENT_DEVICE_DATA,
  EVENT_DEVICE_OFFLINE,
  markDeviceOffline,
  type DeviceMap,
  type TelemetryEvent,
} from '@/features/telemetry/domain'

const PROJECT = 'p1'

function dataEvent(
  deviceId: string,
  timestamp: string,
  sensors: Array<{ sensorId: string; payload: Record<string, unknown> }> = [],
): TelemetryEvent {
  return {
    type: EVENT_DEVICE_DATA,
    deviceId,
    projectId: PROJECT,
    timestamp,
    sensors,
  }
}

describe('buildDeviceMapFromInitialState', () => {
  it('normalises snapshot entries into DeviceState records', () => {
    const map = buildDeviceMapFromInitialState({
      d1: { status: 'online', lastSeenAt: '2026-01-01T00:00:00Z' },
      d2: {},
    })
    expect(map).toEqual({
      d1: { deviceId: 'd1', status: 'online', lastSeenAt: '2026-01-01T00:00:00Z', sensors: {} },
      d2: { deviceId: 'd2', status: 'offline', lastSeenAt: '', sensors: {} },
    })
  })
})

describe('applyEventToDevices', () => {
  it('inserts a new device on first device_data event', () => {
    const next = applyEventToDevices(
      {},
      dataEvent('d1', '2026-01-01T00:00:00Z', [
        { sensorId: 's1', payload: { v: 1 } },
      ]),
    )
    expect(next.d1).toEqual({
      deviceId: 'd1',
      status: 'online',
      lastSeenAt: '2026-01-01T00:00:00Z',
      sensors: { s1: { v: 1 } },
    })
  })

  it('merges sensor readings without losing existing ones', () => {
    const initial: DeviceMap = {
      d1: {
        deviceId: 'd1',
        status: 'online',
        lastSeenAt: '2026-01-01T00:00:00Z',
        sensors: { s1: { v: 1 }, s2: { v: 2 } },
      },
    }
    const next = applyEventToDevices(
      initial,
      dataEvent('d1', '2026-01-01T00:00:01Z', [
        { sensorId: 's2', payload: { v: 99 } },
      ]),
    )
    expect(next.d1.sensors).toEqual({ s1: { v: 1 }, s2: { v: 99 } })
    expect(next.d1.lastSeenAt).toBe('2026-01-01T00:00:01Z')
    expect(next.d1.status).toBe('online')
  })

  it('flips status to online on incoming data', () => {
    const initial: DeviceMap = {
      d1: { deviceId: 'd1', status: 'offline', lastSeenAt: '', sensors: {} },
    }
    const next = applyEventToDevices(initial, dataEvent('d1', 't'))
    expect(next.d1.status).toBe('online')
  })

  it('flips status to offline when a device_offline event arrives', () => {
    const initial: DeviceMap = {
      d1: { deviceId: 'd1', status: 'online', lastSeenAt: 't0', sensors: { s: { v: 1 } } },
    }
    const next = applyEventToDevices(initial, {
      type: EVENT_DEVICE_OFFLINE,
      deviceId: 'd1',
      projectId: PROJECT,
      timestamp: 't1',
    })
    expect(next.d1.status).toBe('offline')
    // Sensor history is preserved when going offline.
    expect(next.d1.sensors).toEqual({ s: { v: 1 } })
  })

  it('ignores device_offline for unknown devices', () => {
    const initial: DeviceMap = {}
    const next = applyEventToDevices(initial, {
      type: EVENT_DEVICE_OFFLINE,
      deviceId: 'unknown',
      projectId: PROJECT,
      timestamp: 't',
    })
    expect(next).toBe(initial)
  })

  it('does not mutate the input map', () => {
    const initial: DeviceMap = {
      d1: { deviceId: 'd1', status: 'offline', lastSeenAt: '', sensors: {} },
    }
    const snapshot = JSON.stringify(initial)
    applyEventToDevices(initial, dataEvent('d1', 't'))
    expect(JSON.stringify(initial)).toBe(snapshot)
  })
})

describe('applyEventsToDevices', () => {
  it('folds a batch of mixed events in order', () => {
    const events: TelemetryEvent[] = [
      dataEvent('d1', 't0', [{ sensorId: 's', payload: { v: 1 } }]),
      dataEvent('d2', 't1'),
      { type: EVENT_DEVICE_OFFLINE, deviceId: 'd1', projectId: PROJECT, timestamp: 't2' },
    ]
    const next = applyEventsToDevices({}, events)
    expect(next.d1.status).toBe('offline')
    expect(next.d2.status).toBe('online')
  })
})

describe('markDeviceOffline', () => {
  it('returns the same reference when device is unknown', () => {
    const initial: DeviceMap = {}
    expect(markDeviceOffline(initial, 'd1')).toBe(initial)
  })

  it('flips status to offline for known devices', () => {
    const initial: DeviceMap = {
      d1: { deviceId: 'd1', status: 'online', lastSeenAt: 't', sensors: {} },
    }
    expect(markDeviceOffline(initial, 'd1').d1.status).toBe('offline')
  })
})

describe('applyEventToDevices unknown event type', () => {
  it('returns state unchanged for unknown event types', () => {
    const initial: DeviceMap = {
      d1: { deviceId: 'd1', status: 'online', lastSeenAt: 't0', sensors: {} },
    }
    const next = applyEventToDevices(initial, {
      type: 'UNKNOWN_EVENT_TYPE',
      deviceId: 'd1',
      projectId: PROJECT,
      timestamp: 't1',
    })
    expect(next).toBe(initial)
  })
})