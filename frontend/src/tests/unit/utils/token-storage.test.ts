import { describe, expect, it, beforeEach } from 'vitest'
import { tokenStorage } from '@/shared/infrastructure/http/token-storage'

describe('tokenStorage', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
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

  it('handles undefined window (SSR)', () => {
    const originalWindow = global.window
    // @ts-expect-error - simulating no window
    delete global.window
    
    expect(tokenStorage.get()).toBeNull()
    tokenStorage.set('test') // Should not throw
    tokenStorage.clear() // Should not throw
    
    global.window = originalWindow
  })
})
