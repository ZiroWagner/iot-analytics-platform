import { describe, expect, it } from 'vitest'
import { createSensorFormSchema } from '@/features/sensors/domain/schemas'

describe('createSensorFormSchema', () => {
  it('validates a correct form input', () => {
    const input = {
      name: 'Temperature Sensor',
      metadata: 'tag1, tag2'
    }
    const result = createSensorFormSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('fails if name is too short', () => {
    const input = {
      name: 'T'
    }
    const result = createSensorFormSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('allows empty metadata', () => {
    const input = {
      name: 'Valid Name'
    }
    const result = createSensorFormSchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})
