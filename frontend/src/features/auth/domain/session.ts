export interface Session {
  sub: string
  email: string
  name?: string
  image?: string
}

/**
 * Decodes a JWT payload into a Session without verifying the signature.
 * Signature verification is the backend's responsibility; the frontend only
 * reads claims for UI purposes. Returns `null` when the token is malformed.
 */
export function decodeSessionFromToken(token: string | null): Session | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const payloadB64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json =
      typeof atob === 'function'
        ? atob(payloadB64)
        : Buffer.from(payloadB64, 'base64').toString('utf-8')
    const payload = JSON.parse(json) as Partial<Session>
    if (!payload.sub || !payload.email) return null
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      image: payload.image,
    }
  } catch {
    return null
  }
}
