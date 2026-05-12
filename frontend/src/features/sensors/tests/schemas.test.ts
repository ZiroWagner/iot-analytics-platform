import { describe, expect, it } from 'vitest'
import { createSensorFormSchema } from '../domain/schemas'

describe('createSensorFormSchema', () => {
  it('accepts a sensor with just a name', () => {
    expect(createSensorFormSchema.parse({ name: 'sensor_temp_01' })).toEqual({
      name: 'sensor_temp_01',
    })
  })

  it('rejects names shorter than 2 chars', () => {
    expect(() => createSensorFormSchema.parse({ name: 'x' })).toThrow(
      /M\u00ednimo 2/,
    )
  })

  it('allows optional metadata string (parsed later by parseSensorMetadata)', () => {
    const parsed = createSensorFormSchema.parse({
      name: 'sensor',
      metadata: 'outdoor, dht22',
    })
    expect(parsed.metadata).toBe('outdoor, dht22')
  })
})
