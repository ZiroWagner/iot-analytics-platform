import { describe, expect, it } from 'vitest'
import { decodeSessionFromToken } from '../domain/session'

function makeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
    'base64url',
  )
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.signature`
}

describe('decodeSessionFromToken', () => {
  it('returns null for null/empty tokens', () => {
    expect(decodeSessionFromToken(null)).toBeNull()
    expect(decodeSessionFromToken('')).toBeNull()
  })

  it('returns null for malformed tokens', () => {
    expect(decodeSessionFromToken('not-a-jwt')).toBeNull()
    expect(decodeSessionFromToken('a.b')).toBeNull() // base64-decoded "m" is not valid JSON
    expect(decodeSessionFromToken('a.@@@.c')).toBeNull()
  })

  it('decodes a valid token payload', () => {
    const token = makeJwt({
      sub: 'user-123',
      email: 'a@b.com',
      name: 'Alice',
      image: 'http://img',
    })
    expect(decodeSessionFromToken(token)).toEqual({
      sub: 'user-123',
      email: 'a@b.com',
      name: 'Alice',
      image: 'http://img',
    })
  })

  it('returns null when required claims are missing', () => {
    const token = makeJwt({ name: 'Alice' })
    expect(decodeSessionFromToken(token)).toBeNull()
  })
})
