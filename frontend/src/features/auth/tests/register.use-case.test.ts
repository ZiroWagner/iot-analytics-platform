import { describe, expect, it, vi } from 'vitest'
import { registerUseCase } from '../application/use-cases/register'
import type { AuthRepository } from '../infrastructure/auth.repository'

describe('registerUseCase', () => {
  it('derives a default name from the email when not provided', async () => {
    const repository: AuthRepository = {
      login: vi.fn(),
      register: vi.fn(async () => ({ access_token: 'tk' })),
    }
    const storage = { set: vi.fn() }

    await registerUseCase(
      { email: 'alice@example.com', password: 'secret123' },
      { repository, storage },
    )

    expect(repository.register).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'secret123',
      name: 'alice',
    })
    expect(storage.set).toHaveBeenCalledWith('tk')
  })

  it('honours an explicit name', async () => {
    const repository: AuthRepository = {
      login: vi.fn(),
      register: vi.fn(async () => ({ access_token: 'tk' })),
    }
    const storage = { set: vi.fn() }

    await registerUseCase(
      { email: 'alice@example.com', password: 'secret123', name: 'Alice' },
      { repository, storage },
    )
    expect(repository.register).toHaveBeenCalledWith({
      email: 'alice@example.com',
      password: 'secret123',
      name: 'Alice',
    })
  })
})
