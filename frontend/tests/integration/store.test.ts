import { describe, expect, it, beforeEach } from 'vitest'
import { EVENT_DEVICE_DATA } from '@/features/telemetry/domain/reducers'
import { useTelemetryStore } from '@/features/telemetry/presentation/store'

describe('useTelemetryStore', () => {
  beforeEach(() => {
    useTelemetryStore.setState({
      devices: {},
      systemMetrics: null,
      connected: false,
    })
  })

  it('tracks connection and system metrics', () => {
    const metrics = {
      streamSize: 10,
      consumerLag: 2,
      eventsPerSecond: 5,
      onlineDevices: 1,
      timestamp: '2026-01-01T00:00:00Z',
      pendingMessages: 0,
      redisMemoryUsedBytes: 1024,
      dbInsertLatencyMs: 5,
    }

    useTelemetryStore.getState().setConnected(true)
    useTelemetryStore.getState().setSystemMetrics(metrics)

    expect(useTelemetryStore.getState().connected).toBe(true)
    expect(useTelemetryStore.getState().systemMetrics).toEqual(metrics)
  })

  it('sets initial state and applies telemetry batches', () => {
    useTelemetryStore.getState().setInitialState('project-1', {
      'device-1': { status: 'offline', lastSeenAt: '2026-01-01T00:00:00.000Z' },
    })

    useTelemetryStore.getState().applyBatch([
      {
        type: EVENT_DEVICE_DATA,
        deviceId: 'device-1',
        projectId: 'project-1',
        timestamp: '2026-01-01T00:01:00.000Z',
        sensors: [{ sensorId: 'sensor-1', payload: { temperature: 22 } }],
      },
    ])

    const device = useTelemetryStore.getState().devices['device-1']
    expect(device.status).toBe('online')
    expect(device.sensors?.['sensor-1']).toEqual({ temperature: 22 })
  })

  it('marks devices offline and clears devices', () => {
    useTelemetryStore.getState().setInitialState('project-1', {
      'device-1': { status: 'online', lastSeenAt: '2026-01-01T00:00:00.000Z' },
    })

    useTelemetryStore.getState().markOffline('device-1')
    expect(useTelemetryStore.getState().devices['device-1'].status).toBe('offline')

    useTelemetryStore.getState().clearDevices()
    expect(useTelemetryStore.getState().devices).toEqual({})
  })
})