import { describe, expect, it, beforeEach } from 'vitest'
import { useTelemetryStore } from '@/features/telemetry/presentation/store'
import { EVENT_DEVICE_DATA } from '@/features/telemetry/domain/reducers'

describe('useTelemetryStore', () => {
  beforeEach(() => {
    useTelemetryStore.setState({
      connected: false,
      devices: {},
      systemMetrics: null,
    })
  })

  describe('setConnected', () => {
    it('updates connected state to true', () => {
      useTelemetryStore.getState().setConnected(true)
      expect(useTelemetryStore.getState().connected).toBe(true)
    })

    it('updates connected state to false', () => {
      useTelemetryStore.setState({ connected: true })
      useTelemetryStore.getState().setConnected(false)
      expect(useTelemetryStore.getState().connected).toBe(false)
    })
  })

  describe('setSystemMetrics', () => {
    it('updates system metrics', () => {
      const metrics = {
        streamSize: 100,
        consumerLag: 5,
        eventsPerSecond: 10,
        onlineDevices: 3,
      }
      useTelemetryStore.getState().setSystemMetrics(metrics)
      expect(useTelemetryStore.getState().systemMetrics).toEqual(metrics)
    })
  })

  describe('setInitialState', () => {
    it('initializes devices from snapshot', () => {
      useTelemetryStore.getState().setInitialState('project-1', {
        'device-1': { status: 'online', lastSeenAt: '2026-01-01T00:00:00Z' },
        'device-2': { status: 'offline' },
      })

      const state = useTelemetryStore.getState()
      expect(state.devices['device-1'].status).toBe('online')
      expect(state.devices['device-2'].status).toBe('offline')
    })
  })

  describe('applyBatch', () => {
    it('applies telemetry events', () => {
      useTelemetryStore.getState().setInitialState('project-1', {
        'device-1': { status: 'offline', lastSeenAt: '' },
      })

      useTelemetryStore.getState().applyBatch([
        {
          type: EVENT_DEVICE_DATA,
          deviceId: 'device-1',
          projectId: 'project-1',
          timestamp: '2026-01-01T00:01:00Z',
          sensors: [{ sensorId: 's1', payload: { temp: 22 } }],
        },
      ])

      const state = useTelemetryStore.getState()
      expect(state.devices['device-1'].status).toBe('online')
      expect(state.devices['device-1'].sensors?.['s1']).toEqual({ temp: 22 })
    })
  })

  describe('markOffline', () => {
    it('marks device as offline', () => {
      useTelemetryStore.getState().setInitialState('project-1', {
        'device-1': { status: 'online', lastSeenAt: '2026-01-01T00:00:00Z' },
      })

      useTelemetryStore.getState().markOffline('device-1')
      expect(useTelemetryStore.getState().devices['device-1'].status).toBe('offline')
    })
  })

  describe('clearDevices', () => {
    it('clears all devices', () => {
      useTelemetryStore.getState().setInitialState('project-1', {
        'device-1': { status: 'online', lastSeenAt: '2026-01-01T00:00:00Z' },
        'device-2': { status: 'online', lastSeenAt: '2026-01-01T00:00:00Z' },
      })

      useTelemetryStore.getState().clearDevices()
      expect(useTelemetryStore.getState().devices).toEqual({})
    })
  })
})