import { faker } from '@faker-js/faker'
import { describe, expect, it } from 'vitest'
import { loginSchema, registerSchema } from '@/features/auth/domain/credentials.schema'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.parse({
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
    })
    expect(result.email).toBeDefined()
  })

  it('rejects invalid email format', () => {
    expect(() =>
      loginSchema.parse({ email: 'not-an-email', password: faker.internet.password({ length: 12 }) }),
    ).toThrow()
  })

  it('rejects password shorter than minimum', () => {
    const shortPassword = faker.internet.password({ length: 5 })
    expect(() =>
      loginSchema.parse({ email: faker.internet.email(), password: shortPassword }),
    ).toThrow()
  })

  it('accepts password at minimum length', () => {
    const minPassword = faker.internet.password({ length: 6 })
    const result = loginSchema.parse({
      email: faker.internet.email(),
      password: minPassword,
    })
    expect(result.password).toBe(minPassword)
  })
})

describe('registerSchema', () => {
  it('accepts valid name, email and password', () => {
    const result = registerSchema.parse({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
    })
    expect(result.name).toBeDefined()
  })

  it('accepts name with 1 character', () => {
    const result = registerSchema.parse({
      name: faker.string.alpha({ length: 1 }),
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
    })
    expect(result.name).toHaveLength(1)
  })

  it('accepts optional name field', () => {
    const result = registerSchema.parse({
      email: faker.internet.email(),
      password: faker.internet.password({ length: 12 }),
    })
    expect(result.name).toBeUndefined()
  })

  it('rejects invalid email', () => {
    expect(() =>
      registerSchema.parse({ name: faker.person.fullName(), email: 'invalid', password: faker.internet.password({ length: 12 }) }),
    ).toThrow()
  })
})