import { faker } from '@faker-js/faker'
import { describe, expect, it, vi } from 'vitest'
import { registerUseCase } from '@/features/auth/application/use-cases/register'
import type { AuthRepository } from '@/features/auth/infrastructure/auth.repository'

describe('registerUseCase', () => {
  it('derives a default name from the email when not provided', async () => {
    const localPart = faker.internet.username().toLowerCase()
    const email = `${localPart}@example.com`
    const password = faker.internet.password({ length: 12 })
    const token = faker.string.alphanumeric(24)
    const repository: AuthRepository = {
      login: vi.fn(),
      register: vi.fn(async () => ({ access_token: token })),
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
    }
    const storage = { set: vi.fn() }

    await registerUseCase(
      { email, password },
      { repository, storage },
    )

    expect(repository.register).toHaveBeenCalledWith({
      email,
      password,
      name: localPart,
    })
    expect(storage.set).toHaveBeenCalledWith(token)
  })

  it('honours an explicit name', async () => {
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 12 })
    const name = faker.person.firstName()
    const token = faker.string.alphanumeric(24)
    const repository: AuthRepository = {
      login: vi.fn(),
      register: vi.fn(async () => ({ access_token: token })),
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      deleteProfile: vi.fn(),
    }
    const storage = { set: vi.fn() }

    await registerUseCase(
      { email, password, name },
      { repository, storage },
    )
    expect(repository.register).toHaveBeenCalledWith({
      email,
      password,
      name,
    })
  })
})