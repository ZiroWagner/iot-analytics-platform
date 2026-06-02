import { useTelemetryStore, type RealtimeSensorPoint } from '@/features/telemetry/presentation/store'
import { describe, expect, it, beforeEach } from 'vitest'
import type { TelemetryEvent } from '@/features/telemetry/domain/types'

describe('TelemetryStore', () => {
  beforeEach(() => {
    useTelemetryStore.getState().clearDevices()
    useTelemetryStore.getState().setConnected(false)
    useTelemetryStore.getState().setSystemMetrics(null)
  })

  it('should initialize with default values', () => {
    const state = useTelemetryStore.getState()
    expect(state.devices).toEqual({})
    expect(state.connected).toBe(false)
    expect(state.systemMetrics).toBeNull()
    expect(state.realtimePoints).toEqual([])
  })

  it('should set connected state', () => {
    useTelemetryStore.getState().setConnected(true)
    expect(useTelemetryStore.getState().connected).toBe(true)

    useTelemetryStore.getState().setConnected(false)
    expect(useTelemetryStore.getState().connected).toBe(false)
  })

  it('should set initial state', () => {
    const deviceId = 'd1'
    const snapshot = {
      [deviceId]: { status: 'online', lastSeenAt: 'today' }
    }
    useTelemetryStore.getState().setInitialState('p1', snapshot)

    expect(useTelemetryStore.getState().devices[deviceId]).toBeDefined()
    expect(useTelemetryStore.getState().devices[deviceId].status).toBe('online')
  })

  it('should apply a batch of events and update device state', () => {
    const events: TelemetryEvent[] = [
      { type: 'device_data', deviceId: 'd1', projectId: 'p1', timestamp: 't1', sensors: [{ sensorId: 's1', payload: { value: 10 } }] }
    ]
    useTelemetryStore.getState().applyBatch(events)

    expect(useTelemetryStore.getState().devices['d1'].sensors?.['s1']).toEqual({ value: 10 })
  })

  it('should mark a device offline', () => {
    useTelemetryStore.setState({ devices: { 'd1': { deviceId: 'd1', status: 'online', lastSeenAt: '' } } })
    useTelemetryStore.getState().markOffline('d1')
    expect(useTelemetryStore.getState().devices['d1'].status).toBe('offline')
  })

  it('should clear devices', () => {
    useTelemetryStore.setState({ devices: { 'd1': { deviceId: 'd1', status: 'offline', lastSeenAt: '' } } })
    useTelemetryStore.getState().clearDevices()
    expect(useTelemetryStore.getState().devices).toEqual({})
  })

  it('should set system metrics', () => {
    const metrics = { streamSize: 100, consumerLag: 0, eventsPerSecond: 10, onlineDevices: 5 }
    useTelemetryStore.getState().setSystemMetrics(metrics)
    expect(useTelemetryStore.getState().systemMetrics).toEqual(metrics)
  })

  describe('realtimePoints', () => {
    it('should extract realtimePoints from applyBatch with multiple sensors and metrics', () => {
      const events = [
        {
          type: 'device_data',
          deviceId: 'd1',
          projectId: 'p1',
          timestamp: '2026-01-01T00:00:00Z',
          sensors: [
            { sensorId: 's1', payload: { temperature: 22.5, humidity: 60 } },
            { sensorId: 's2', payload: { voltage: 3.3 } },
          ],
        },
      ]
      useTelemetryStore.getState().applyBatch(events)

      const points = useTelemetryStore.getState().realtimePoints
      expect(points).toHaveLength(3)
      expect(points[0]).toMatchObject({ sensorId: 's1', metric: 'temperature', value: 22.5, deviceId: 'd1' })
      expect(points[1]).toMatchObject({ sensorId: 's1', metric: 'humidity', value: 60, deviceId: 'd1' })
      expect(points[2]).toMatchObject({ sensorId: 's2', metric: 'voltage', value: 3.3, deviceId: 'd1' })
    })

    it('should filter out non-numeric payload values', () => {
      const events = [
        {
          type: 'device_data',
          deviceId: 'd1',
          projectId: 'p1',
          timestamp: '2026-01-01T00:00:00Z',
          sensors: [
            {
              sensorId: 's1',
              payload: {
                temperature: 22.5,
                label: 'hot',
                enabled: true,
                threshold: null,
              },
            },
          ],
        },
      ]
      useTelemetryStore.getState().applyBatch(events)

      const points = useTelemetryStore.getState().realtimePoints
      expect(points).toHaveLength(1)
      expect(points[0]).toMatchObject({ sensorId: 's1', metric: 'temperature', value: 22.5 })
    })

    it('should skip non-device_data events', () => {
      const events: TelemetryEvent[] = [
        { type: 'device_offline', deviceId: 'd1', projectId: 'p1', timestamp: 't1', sensors: [] },
        { type: 'device_data', deviceId: 'd2', projectId: 'p1', timestamp: 't2', sensors: [{ sensorId: 's1', payload: { v: 1 } }] },
      ]
      useTelemetryStore.getState().applyBatch(events)

      const points = useTelemetryStore.getState().realtimePoints
      expect(points).toHaveLength(1)
      expect(points[0]).toMatchObject({ deviceId: 'd2', sensorId: 's1', metric: 'v', value: 1 })
    })

    it('should trim realtimePoints when exceeding MAX_REALTIME_POINTS', () => {
      // Fill with 500 points
      const existing: RealtimeSensorPoint[] = []
      for (let i = 0; i < 500; i++) {
        existing.push({
          sensorId: 's1',
          metric: 'v',
          value: i,
          timestamp: `t${i}`,
          deviceId: 'd1',
        })
      }
      useTelemetryStore.setState({ realtimePoints: existing })

      // Add 1 more (total 501)
      const events = [
        {
          type: 'device_data',
          deviceId: 'd2',
          projectId: 'p1',
          timestamp: 't500',
          sensors: [{ sensorId: 's2', payload: { v: 500 } }],
        },
      ]
      useTelemetryStore.getState().applyBatch(events)

      const points = useTelemetryStore.getState().realtimePoints
      expect(points).toHaveLength(500)
      // Should keep the most recent 500 values (dropping value 0)
      expect(points[0].value).toBe(1)
      expect(points.at(-1)!.value).toBe(500)
    })

    it('should addRealtimePoints to an empty array', () => {
      const points: RealtimeSensorPoint[] = [
        { sensorId: 's1', metric: 'temperature', value: 22.5, timestamp: 't1', deviceId: 'd1' },
      ]
      useTelemetryStore.getState().addRealtimePoints(points)

      expect(useTelemetryStore.getState().realtimePoints).toHaveLength(1)
      expect(useTelemetryStore.getState().realtimePoints[0]).toEqual(points[0])
    })

    it('should addRealtimePoints to an existing array', () => {
      useTelemetryStore.setState({
        realtimePoints: [
          { sensorId: 's1', metric: 'temperature', value: 22.5, timestamp: 't1', deviceId: 'd1' },
        ],
      })

      const newPoints: RealtimeSensorPoint[] = [
        { sensorId: 's1', metric: 'humidity', value: 60, timestamp: 't2', deviceId: 'd1' },
      ]
      useTelemetryStore.getState().addRealtimePoints(newPoints)

      expect(useTelemetryStore.getState().realtimePoints).toHaveLength(2)
    })

    it('should trim on addRealtimePoints when exceeding MAX_REALTIME_POINTS', () => {
      const existing: RealtimeSensorPoint[] = []
      for (let i = 0; i < 500; i++) {
        existing.push({
          sensorId: 's1',
          metric: 'v',
          value: i,
          timestamp: `t${i}`,
          deviceId: 'd1',
        })
      }
      useTelemetryStore.setState({ realtimePoints: existing })

      useTelemetryStore.getState().addRealtimePoints([
        { sensorId: 's2', metric: 'v', value: 999, timestamp: 't500', deviceId: 'd2' },
      ])

      const points = useTelemetryStore.getState().realtimePoints
      expect(points).toHaveLength(500)
      // First point should have been trimmed away
      expect(points[0].value).toBe(1)
      expect(points.at(-1)!.value).toBe(999)
    })

    it('should clearRealtimePoints', () => {
      useTelemetryStore.setState({
        realtimePoints: [
          { sensorId: 's1', metric: 'temperature', value: 22.5, timestamp: 't1', deviceId: 'd1' },
        ],
      })
      useTelemetryStore.getState().clearRealtimePoints()

      expect(useTelemetryStore.getState().realtimePoints).toEqual([])
    })

    it('should clearDevices also reset realtimePoints', () => {
      useTelemetryStore.setState({
        devices: { 'd1': { deviceId: 'd1', status: 'online', lastSeenAt: 't1', sensors: {} } },
        realtimePoints: [
          { sensorId: 's1', metric: 'temperature', value: 22.5, timestamp: 't1', deviceId: 'd1' },
        ],
      })
      useTelemetryStore.getState().clearDevices()

      expect(useTelemetryStore.getState().devices).toEqual({})
      expect(useTelemetryStore.getState().realtimePoints).toEqual([])
    })
  })
})
