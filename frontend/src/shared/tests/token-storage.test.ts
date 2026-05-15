import { describe, expect, it, beforeEach, vi } from 'vitest'
import { tokenStorage } from '../infrastructure/http/token-storage'

describe('tokenStorage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns null when no token is stored', () => {
    expect(tokenStorage.get()).toBeNull()
  })

  it('stores and retrieves a token', () => {
    tokenStorage.set('my-jwt-token')
    expect(tokenStorage.get()).toBe('my-jwt-token')
  })

  it('clears the stored token', () => {
    tokenStorage.set('my-jwt-token')
    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
  })

  it('overwrites existing token on set', () => {
    tokenStorage.set('token-1')
    tokenStorage.set('token-2')
    expect(tokenStorage.get()).toBe('token-2')
  })
})
