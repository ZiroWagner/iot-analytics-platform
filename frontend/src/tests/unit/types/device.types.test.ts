import { describe, expect, it } from 'vitest'
import type { Device } from '@/features/devices/domain/types'

describe('devices domain types', () => {
  it('Device can be created with required fields', () => {
    const device: Device = {
      id: 'device-1',
      name: 'Gateway 1',
      type: 'ESP32',
      sensors: [],
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(device.id).toBe('device-1')
  })

  it('Device can have optional mac_address', () => {
    const device: Device = {
      id: 'device-1',
      name: 'Gateway 1',
      type: 'ESP32',
      sensors: [],
      createdAt: '2026-01-01T00:00:00Z',
      mac_address: '00:1B:44:11:3A:B7',
    }
    expect(device.mac_address).toBe('00:1B:44:11:3A:B7')
  })

  it('Device can have lastSeenAt for online status', () => {
    const device: Device = {
      id: 'device-1',
      name: 'Gateway 1',
      type: 'ESP32',
      sensors: [],
      createdAt: '2026-01-01T00:00:00Z',
      lastSeenAt: '2026-01-15T10:30:00Z',
    }
    expect(device.lastSeenAt).toBe('2026-01-15T10:30:00Z')
  })

  it('Device can contain sensors', () => {
    const device: Device = {
      id: 'device-1',
      name: 'Gateway 1',
      type: 'ESP32',
      sensors: [
        { id: 'sensor-1', name: 'Temp', deviceId: 'device-1', metadata: {} },
        { id: 'sensor-2', name: 'Humidity', deviceId: 'device-1', metadata: {} },
      ],
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(device.sensors.length).toBe(2)
  })
})