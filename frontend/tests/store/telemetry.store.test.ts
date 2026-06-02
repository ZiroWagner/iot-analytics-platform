import { useTelemetryStore } from '@/features/telemetry/presentation/store'
import { describe, expect, it, beforeEach } from 'vitest'
import type { DeviceMap, InitialDeviceSnapshotMap, TelemetryEvent } from '@/features/telemetry/domain/types'

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
    useTelemetryStore.getState().setInitialState('p1', snapshot as unknown as InitialDeviceSnapshotMap)
    
    expect(useTelemetryStore.getState().devices[deviceId]).toBeDefined()
    expect(useTelemetryStore.getState().devices[deviceId].status).toBe('online')
  })

  it('should apply a batch of events', () => {
    const events = [
      { type: 'device_data', deviceId: 'd1', timestamp: 't1', sensors: [{ sensorId: 's1', payload: 10 }] }
    ]
    useTelemetryStore.getState().applyBatch(events as unknown as TelemetryEvent[])
    
    expect(useTelemetryStore.getState().devices['d1'].sensors?.['s1']).toBe(10)
  })

  it('should mark a device offline', () => {
    useTelemetryStore.setState({ devices: { 'd1': { status: 'online' } } as unknown as DeviceMap })
    useTelemetryStore.getState().markOffline('d1')
    expect(useTelemetryStore.getState().devices['d1'].status).toBe('offline')
  })

  it('should clear devices', () => {
    useTelemetryStore.setState({ devices: { 'd1': {} } as unknown as DeviceMap })
    useTelemetryStore.getState().clearDevices()
    expect(useTelemetryStore.getState().devices).toEqual({})
  })

  it('should set system metrics', () => {
    const metrics = { streamSize: 100, consumerLag: 0, eventsPerSecond: 10, onlineDevices: 5 }
    useTelemetryStore.getState().setSystemMetrics(metrics)
    expect(useTelemetryStore.getState().systemMetrics).toEqual(metrics)
  })
})
