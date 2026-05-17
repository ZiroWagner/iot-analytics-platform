import { describe, expect, it, vi } from 'vitest'
import { logoutUseCase } from '@/features/auth/application/use-cases/logout'

describe('logoutUseCase', () => {
  it('clears the token storage when deps provided', () => {
    const clear = vi.fn()
    logoutUseCase({ storage: { clear } })
    expect(clear).toHaveBeenCalledTimes(1)
  })
})