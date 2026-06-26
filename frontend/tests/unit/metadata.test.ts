import { describe, expect, it } from 'vitest'
import { parseSensorMetadata, formatSensorMetadata } from '@/features/sensors/domain/metadata'

describe('parseSensorMetadata', () => {
  it('returns {} for undefined or empty input', () => {
    expect(parseSensorMetadata(undefined)).toEqual({})
    expect(parseSensorMetadata('')).toEqual({})
    expect(parseSensorMetadata('   ')).toEqual({})
    expect(parseSensorMetadata(',,,')).toEqual({})
  })

  it('splits by comma, trims and drops empty tags', () => {
    expect(parseSensorMetadata('outdoor, dht22,  ,humidity')).toEqual({
      tags: ['outdoor', 'dht22', 'humidity'],
    })
  })

  it('preserves a single tag', () => {
    expect(parseSensorMetadata('solo')).toEqual({ tags: ['solo'] })
  })
})

describe('formatSensorMetadata', () => {
  it('returns "" for undefined or no tags', () => {
    expect(formatSensorMetadata(undefined)).toBe('')
    expect(formatSensorMetadata({})).toBe('')
    expect(formatSensorMetadata({ tags: 'not-array' })).toBe('')
  })

  it('joins tags with comma and space', () => {
    expect(
      formatSensorMetadata({ tags: ['outdoor', 'dht22', 'humidity'] }),
    ).toBe('outdoor, dht22, humidity')
  })

  it('returns "" for empty tags array', () => {
    expect(formatSensorMetadata({ tags: [] })).toBe('')
  })
})