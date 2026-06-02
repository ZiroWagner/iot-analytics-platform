import { describe, expect, it } from 'vitest'
import type {
  DeviceState,
  TelemetrySensorReading,
  TelemetryEvent,
  InitialDeviceSnapshot,
  DeviceMap,
} from '@/features/telemetry/domain/types'

describe('telemetry domain types', () => {
  it('DeviceState can be created with online status', () => {
    const device: DeviceState = {
      deviceId: 'device-1',
      status: 'online',
      lastSeenAt: '2026-01-01T00:00:00Z',
      sensors: { temp: { temperature: 22.5 } },
    }
    expect(device.status).toBe('online')
  })

  it('DeviceState can be created with offline status', () => {
    const device: DeviceState = {
      deviceId: 'device-2',
      status: 'offline',
      lastSeenAt: '2026-01-01T00:00:00Z',
    }
    expect(device.status).toBe('offline')
  })

  it('TelemetrySensorReading has required fields', () => {
    const reading: TelemetrySensorReading = {
      sensorId: 'temp-sensor',
      payload: { temperature: 25.0, humidity: 60 },
    }
    expect(reading.sensorId).toBe('temp-sensor')
  })

  it('TelemetryEvent can represent device data', () => {
    const event: TelemetryEvent = {
      type: 'DEVICE_DATA',
      deviceId: 'device-1',
      projectId: 'project-1',
      timestamp: '2026-01-01T00:00:00Z',
      sensors: [{ sensorId: 'temp', payload: { temperature: 22 } }],
    }
    expect(event.type).toBe('DEVICE_DATA')
  })

  it('InitialDeviceSnapshot has optional fields', () => {
    const snapshot: InitialDeviceSnapshot = {}
    expect(snapshot.status).toBeUndefined()

    const snapshotWithStatus: InitialDeviceSnapshot = {
      status: 'online',
      lastSeenAt: '2026-01-01T00:00:00Z',
    }
    expect(snapshotWithStatus.status).toBe('online')
  })

  it('DeviceMap can be indexed by deviceId', () => {
    const devices: DeviceMap = {
      'device-1': { deviceId: 'device-1', status: 'online', lastSeenAt: '2026-01-01T00:00:00Z' },
      'device-2': { deviceId: 'device-2', status: 'offline', lastSeenAt: '2026-01-01T00:00:00Z' },
    }
    expect(Object.keys(devices).length).toBe(2)
  })
})