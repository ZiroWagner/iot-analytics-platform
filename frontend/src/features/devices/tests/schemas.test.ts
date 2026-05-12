import { describe, expect, it } from 'vitest'
import { createDeviceSchema } from '../domain/schemas'

describe('createDeviceSchema', () => {
  it('accepts a minimal valid device', () => {
    expect(
      createDeviceSchema.parse({ name: 'Nodo-1', type: 'ESP32' }),
    ).toEqual({ name: 'Nodo-1', type: 'ESP32' })
  })

  it('allows optional mac_address', () => {
    const parsed = createDeviceSchema.parse({
      name: 'Nodo-1',
      type: 'ESP32',
      mac_address: '00:1A:2B:3C:4D:5E',
    })
    expect(parsed.mac_address).toBe('00:1A:2B:3C:4D:5E')
  })

  it('rejects short name or short type', () => {
    expect(() => createDeviceSchema.parse({ name: 'x', type: 'ESP32' })).toThrow()
    expect(() => createDeviceSchema.parse({ name: 'ok', type: 'x' })).toThrow()
  })
})
