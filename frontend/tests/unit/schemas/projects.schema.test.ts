import { describe, expect, it } from 'vitest'
import { createProjectSchema } from '@/features/projects/domain/schemas'

describe('createProjectSchema', () => {
  it('accepts a valid name', () => {
    expect(createProjectSchema.parse({ name: 'Invernadero A' })).toEqual({
      name: 'Invernadero A',
    })
  })

  it('rejects names shorter than 2 chars', () => {
    expect(() => createProjectSchema.parse({ name: 'x' })).toThrow(/al menos 2/)
  })

  it('rejects names longer than 50 chars', () => {
    expect(() =>
      createProjectSchema.parse({ name: 'x'.repeat(51) }),
    ).toThrow(/m\u00e1s de 50|más de 50/)
  })
})