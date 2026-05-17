import { describe, expect, it } from 'vitest'
import { parseSensorMetadata } from '@/features/sensors/domain/metadata'

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