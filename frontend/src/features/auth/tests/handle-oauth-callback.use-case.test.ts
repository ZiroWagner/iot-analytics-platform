import { describe, expect, it, vi } from 'vitest'
import { handleOAuthCallbackUseCase } from '../application/use-cases/handle-oauth-callback'
import { getCurrentSessionUseCase } from '../application/use-cases/get-current-session'

describe('handleOAuthCallbackUseCase', () => {
  it('returns false and does not persist when token is missing', () => {
    const storage = { set: vi.fn() }
    expect(handleOAuthCallbackUseCase(null, { storage })).toBe(false)
    expect(handleOAuthCallbackUseCase('', { storage })).toBe(false)
    expect(storage.set).not.toHaveBeenCalled()
  })

  it('persists a non-empty token', () => {
    const storage = { set: vi.fn() }
    expect(handleOAuthCallbackUseCase('jwt-token', { storage })).toBe(true)
    expect(storage.set).toHaveBeenCalledWith('jwt-token')
  })
})

describe('getCurrentSessionUseCase', () => {
  it('returns null when no token is stored', () => {
    expect(getCurrentSessionUseCase({ storage: { get: () => null } })).toBeNull()
  })

  it('decodes a valid token from storage', () => {
    const payload = Buffer.from(
      JSON.stringify({ sub: 'u1', email: 'a@b.com' }),
    ).toString('base64url')
    const token = `header.${payload}.sig`
    const session = getCurrentSessionUseCase({ storage: { get: () => token } })
    expect(session).toEqual({
      sub: 'u1',
      email: 'a@b.com',
      name: undefined,
      image: undefined,
    })
  })
})
