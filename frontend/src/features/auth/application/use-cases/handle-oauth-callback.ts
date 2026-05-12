import { tokenStorage } from '@/shared/infrastructure/http'

export interface OAuthCallbackDeps {
  storage?: Pick<typeof tokenStorage, 'set'>
}

/**
 * Persists the token returned by the backend's OAuth redirect flow.
 * Returns `true` when a non-empty token was stored.
 */
export function handleOAuthCallbackUseCase(
  token: string | null,
  deps: OAuthCallbackDeps = {},
): boolean {
  if (!token) return false
  const storage = deps.storage ?? tokenStorage
  storage.set(token)
  return true
}
