import { describe, expect, it } from 'vitest'
import { decodeSessionFromToken } from '@/features/auth/domain/session'

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
    'base64url',
  )
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.signature`
}

describe('decodeSessionFromToken', () => {
  it('returns null for null input', () => {
    expect(decodeSessionFromToken(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(decodeSessionFromToken('')).toBeNull()
  })

  it('returns null for malformed token (not enough parts)', () => {
    expect(decodeSessionFromToken('not-a-jwt')).toBeNull()
    expect(decodeSessionFromToken('a.b')).toBeNull()
  })

  it('returns null for invalid base64', () => {
    expect(decodeSessionFromToken('a.@@@.c')).toBeNull()
  })

  it('decodes a valid token with all fields', () => {
    const token = makeJwt({
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
    })

    const session = decodeSessionFromToken(token)

    expect(session).toEqual({
      sub: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
    })
  })

  it('returns null when sub claim is missing', () => {
    const token = makeJwt({ email: 'test@example.com', name: 'Test' })
    expect(decodeSessionFromToken(token)).toBeNull()
  })

  it('returns null when email claim is missing', () => {
    const token = makeJwt({ sub: 'user-123', name: 'Test' })
    expect(decodeSessionFromToken(token)).toBeNull()
  })

  it('handles token with only required fields (sub and email)', () => {
    const token = makeJwt({ sub: 'user-123', email: 'test@example.com' })
    const session = decodeSessionFromToken(token)

    expect(session).toEqual({
      sub: 'user-123',
      email: 'test@example.com',
      name: undefined,
      image: undefined,
    })
  })
})