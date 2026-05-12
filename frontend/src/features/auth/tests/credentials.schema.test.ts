import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from '../domain/credentials.schema'

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const parsed = loginSchema.parse({
      email: 'user@example.com',
      password: 'secret123',
    })
    expect(parsed.email).toBe('user@example.com')
  })

  it('rejects invalid email', () => {
    expect(() =>
      loginSchema.parse({ email: 'not-an-email', password: 'secret123' }),
    ).toThrowError(/Correo electr/)
  })

  it('rejects passwords below the minimum length', () => {
    expect(() =>
      loginSchema.parse({ email: 'user@example.com', password: '123' }),
    ).toThrowError(/contrase/i)
  })
})

describe('registerSchema', () => {
  it('accepts an optional name', () => {
    const parsed = registerSchema.parse({
      email: 'user@example.com',
      password: 'secret123',
    })
    expect(parsed.name).toBeUndefined()
  })

  it('rejects an empty name when present', () => {
    expect(() =>
      registerSchema.parse({
        email: 'user@example.com',
        password: 'secret123',
        name: '',
      }),
    ).toThrowError(/Nombre requerido/)
  })
})
