import { describe, expect, it } from 'vitest'
import type { Sensor, DataPoint } from '@/features/sensors/domain/types'

describe('sensors domain types', () => {
  it('Sensor can be created with required fields', () => {
    const sensor: Sensor = {
      id: 'sensor-1',
      name: 'Temperature',
      metadata: {},
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(sensor.id).toBe('sensor-1')
  })

  it('Sensor can have metadata', () => {
    const sensor: Sensor = {
      id: 'sensor-1',
      name: 'Temperature',
      metadata: { unit: 'celsius', min: -40, max: 80 },
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(sensor.metadata.unit).toBe('celsius')
  })

  it('DataPoint can be created', () => {
    const point: DataPoint = {
      id: 'point-1',
      timestamp: '2026-01-15T10:00:00Z',
      payload: { temperature: 22.5 },
    }
    expect(point.payload.temperature).toBe(22.5)
  })
})