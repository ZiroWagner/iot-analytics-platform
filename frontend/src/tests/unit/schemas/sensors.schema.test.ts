import { describe, expect, it } from 'vitest'
import { parseSensorMetadata } from '@/features/sensors/domain/metadata'

describe('parseSensorMetadata', () => {
  it('returns empty object for undefined input', () => {
    expect(parseSensorMetadata(undefined)).toEqual({})
  })

  it('returns empty object for empty string', () => {
    expect(parseSensorMetadata('')).toEqual({})
  })

  it('returns empty object for whitespace only', () => {
    expect(parseSensorMetadata('   ')).toEqual({})
  })

  it('returns empty object for comma-only string', () => {
    expect(parseSensorMetadata(',,,')).toEqual({})
  })

  it('splits by comma and trims tags', () => {
    const result = parseSensorMetadata('outdoor, dht22,  ,humidity')
    expect(result).toEqual({
      tags: ['outdoor', 'dht22', 'humidity'],
    })
  })

  it('preserves a single tag', () => {
    const result = parseSensorMetadata('solo')
    expect(result).toEqual({ tags: ['solo'] })
  })

  it('handles multiple spaces within a tag', () => {
    const result = parseSensorMetadata('tag1  ,  tag2  ,  tag3')
    expect(result).toEqual({
      tags: ['tag1', 'tag2', 'tag3'],
    })
  })
})