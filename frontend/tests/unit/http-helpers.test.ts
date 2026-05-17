import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getAuthUrl, getApiBaseUrl, isAuthenticated } from '@/shared/infrastructure/http/api-client'
import { API_BASE_URL, API_PREFIX } from '@/shared/infrastructure/http/config'
import { API_ENDPOINTS } from '@/shared/infrastructure/http/endpoints'
import { tokenStorage } from '@/shared/infrastructure/http/token-storage'

describe('getApiBaseUrl', () => {
  it('returns the configured API base URL', () => {
    expect(getApiBaseUrl()).toBe(API_BASE_URL)
  })
})

describe('getAuthUrl', () => {
  it('builds complete auth URL with prefix', () => {
    expect(getAuthUrl(API_ENDPOINTS.AUTH.GOOGLE)).toBe(`${API_BASE_URL}${API_PREFIX}/auth/google`)
    expect(getAuthUrl(API_ENDPOINTS.AUTH.GITHUB)).toBe(`${API_BASE_URL}${API_PREFIX}/auth/github`)
  })
})

describe('tokenStorage', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
  })

  it('stores and retrieves token', () => {
    tokenStorage.set('test-token')
    expect(tokenStorage.get()).toBe('test-token')
  })

  it('clears token', () => {
    tokenStorage.set('test-token')
    tokenStorage.clear()
    expect(tokenStorage.get()).toBeNull()
  })
})

describe('isAuthenticated', () => {
  beforeEach(() => {
    globalThis.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('returns false when no token stored', () => {
    expect(isAuthenticated()).toBe(false)
  })

  it('returns true when token exists', () => {
    tokenStorage.set('some-token')
    expect(isAuthenticated()).toBe(true)
  })

  it('returns false after token is cleared', () => {
    tokenStorage.set('some-token')
    tokenStorage.clear()
    expect(isAuthenticated()).toBe(false)
  })
})