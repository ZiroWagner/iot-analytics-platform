import { faker } from '@faker-js/faker'
import { describe, expect, it, vi } from 'vitest'
import { loginUseCase } from '../application/use-cases/login'
import type { AuthRepository } from '../infrastructure/auth.repository'

function buildDeps(overrides: Partial<{ token: string; throwOnLogin: boolean }> = {}) {
  const repository: AuthRepository = {
    login: vi.fn(async () => {
      if (overrides.throwOnLogin) throw new Error('boom')
      return { access_token: overrides.token ?? 'token-abc' }
    }),
    register: vi.fn(),
  }
  const storage = { set: vi.fn() }
  return { repository, storage }
}

describe('loginUseCase', () => {
  it('validates credentials, calls the repository and persists the token', async () => {
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 12 })
    const token = faker.string.alphanumeric(24)
    const { repository, storage } = buildDeps({ token })

    const result = await loginUseCase(
      { email, password },
      { repository, storage },
    )
    expect(repository.login).toHaveBeenCalledWith({
      email,
      password,
    })
    expect(storage.set).toHaveBeenCalledWith(token)
    expect(result).toEqual({ token })
  })

  it('rejects invalid input before reaching the repository', async () => {
    const { repository, storage } = buildDeps()
    await expect(
      loginUseCase({ email: 'nope', password: '123' }, { repository, storage }),
    ).rejects.toThrow()
    expect(repository.login).not.toHaveBeenCalled()
    expect(storage.set).not.toHaveBeenCalled()
  })

  it('throws when the API responds without a token', async () => {
    const email = faker.internet.email()
    const password = faker.internet.password({ length: 12 })
    const { repository, storage } = buildDeps({ token: '' })
    await expect(
      loginUseCase(
        { email, password },
        { repository, storage },
      ),
    ).rejects.toThrow(/token de acceso/)
    expect(storage.set).not.toHaveBeenCalled()
  })
})
