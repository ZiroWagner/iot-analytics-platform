import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { PASSWORD_MIN_LENGTH, loginSchema, registerSchema } from '@/features/auth/domain/credentials.schema'

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 12 })
    const parsed = loginSchema.parse({
      email,
      password,
    })
    expect(parsed.email).toBe(email)
  })

  it('rejects invalid email', () => {
    const password = faker.internet.password({ length: 12 })
    expect(() =>
      loginSchema.parse({ email: 'not-an-email', password }),
    ).toThrow(/Correo electr/)
  })

  it('rejects passwords below the minimum length', () => {
    const email = faker.internet.email()
    const password = faker.string.alphanumeric(PASSWORD_MIN_LENGTH - 1)
    expect(() =>
      loginSchema.parse({ email, password }),
    ).toThrow(/contrase/i)
  })
})

describe('registerSchema', () => {
  it('accepts an optional name', () => {
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 12 })
    const parsed = registerSchema.parse({
      email,
      password,
    })
    expect(parsed.name).toBeUndefined()
  })

  it('rejects an empty name when present', () => {
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 12 })
    expect(() =>
      registerSchema.parse({
        email,
        password,
        name: '',
      }),
    ).toThrow(/Nombre requerido/)
  })
})
