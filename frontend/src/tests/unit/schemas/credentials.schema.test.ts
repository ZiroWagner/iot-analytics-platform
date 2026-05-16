import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema, PASSWORD_MIN_LENGTH } from '@/features/auth/domain/credentials.schema'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.parse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.email).toBe('test@example.com')
  })

  it('rejects invalid email format', () => {
    expect(() =>
      loginSchema.parse({ email: 'not-an-email', password: 'password123' }),
    ).toThrow()
  })

  it('rejects password shorter than minimum', () => {
    const shortPassword = 'x'.repeat(PASSWORD_MIN_LENGTH - 1)
    expect(() =>
      loginSchema.parse({ email: 'test@example.com', password: shortPassword }),
    ).toThrow()
  })

  it('accepts password at minimum length', () => {
    const minPassword = 'x'.repeat(PASSWORD_MIN_LENGTH)
    const result = loginSchema.parse({
      email: 'test@example.com',
      password: minPassword,
    })
    expect(result.password).toBe(minPassword)
  })
})

describe('registerSchema', () => {
  it('accepts valid name, email and password', () => {
    const result = registerSchema.parse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    })
    expect(result.name).toBe('John Doe')
  })

  it('accepts name with 1 character', () => {
    const result = registerSchema.parse({
      name: 'x',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.name).toBe('x')
  })

  it('accepts optional name field', () => {
    const result = registerSchema.parse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.name).toBeUndefined()
  })

  it('rejects invalid email', () => {
    expect(() =>
      registerSchema.parse({ name: 'Test', email: 'invalid', password: 'password123' }),
    ).toThrow()
  })
})