import { describe, expect, it } from 'vitest'
import { createDeviceSchema } from '@/features/devices/domain/schemas'

describe('createDeviceSchema', () => {
  it('accepts a valid device with name and type', () => {
    expect(createDeviceSchema.parse({ name: 'Gateway 1', type: 'ESP32' })).toEqual({
      name: 'Gateway 1',
      type: 'ESP32',
    })
  })

  it('accepts device with optional mac_address', () => {
    const result = createDeviceSchema.parse({
      name: 'Gateway 1',
      type: 'ESP32',
      mac_address: '00:1B:44:11:3A:B7',
    })
    expect(result.mac_address).toBe('00:1B:44:11:3A:B7')
  })

  it('rejects names shorter than 2 chars', () => {
    expect(() => createDeviceSchema.parse({ name: 'x', type: 'ESP32' })).toThrow(
      /M\u00ednimo 2/,
    )
  })

  it('rejects type shorter than 2 chars', () => {
    expect(() => createDeviceSchema.parse({ name: 'Gateway', type: 'x' })).toThrow(
      /Tipo/,
    )
  })

  it('allows empty mac_address (optional)', () => {
    const result = createDeviceSchema.parse({
      name: 'Gateway 1',
      type: 'ESP32',
      mac_address: '',
    })
    expect(result.mac_address).toBe('')
  })
})