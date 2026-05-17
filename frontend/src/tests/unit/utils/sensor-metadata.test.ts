import { describe, expect, it } from 'vitest'
import { parseSensorMetadata } from '@/features/sensors/domain/metadata'

describe('parseSensorMetadata', () => {
  it('returns empty object for undefined input', () => {
    const result = parseSensorMetadata(undefined)
    expect(result).toEqual({})
  })

  it('returns empty object for empty string', () => {
    const result = parseSensorMetadata('')
    expect(result).toEqual({})
  })

  it('returns empty object for whitespace only', () => {
    const result = parseSensorMetadata('   ')
    expect(result).toEqual({})
  })

  it('parses single tag', () => {
    const result = parseSensorMetadata('temperature')
    expect(result).toEqual({ tags: ['temperature'] })
  })

  it('parses multiple comma-separated tags', () => {
    const result = parseSensorMetadata('temperature, humidity, pressure')
    expect(result).toEqual({ tags: ['temperature', 'humidity', 'pressure'] })
  })

  it('trims whitespace from tags', () => {
    const result = parseSensorMetadata('  tag1  ,  tag2  ')
    expect(result).toEqual({ tags: ['tag1', 'tag2'] })
  })

  it('filters out empty entries from multiple commas', () => {
    const result = parseSensorMetadata('tag1,, ,tag2')
    expect(result).toEqual({ tags: ['tag1', 'tag2'] })
  })

  it('handles single tag with trailing comma', () => {
    const result = parseSensorMetadata('temperature,')
    expect(result).toEqual({ tags: ['temperature'] })
  })
})