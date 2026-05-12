import { tokenStorage } from '@/shared/infrastructure/http'
import { decodeSessionFromToken, type Session } from '../../domain/session'

export interface SessionDeps {
  storage?: Pick<typeof tokenStorage, 'get'>
}

/**
 * Returns the decoded session from the persisted token, or `null` when there
 * is no token or the token is malformed.
 */
export function getCurrentSessionUseCase(deps: SessionDeps = {}): Session | null {
  const storage = deps.storage ?? tokenStorage
  return decodeSessionFromToken(storage.get())
}
