import { tokenStorage } from '@/shared/infrastructure/http'

export interface LogoutDeps {
  storage?: Pick<typeof tokenStorage, 'clear'>
}

/** Clears the persisted token so subsequent requests are anonymous. */
export function logoutUseCase(deps: LogoutDeps = {}): void {
  const storage = deps.storage ?? tokenStorage
  storage.clear()
}
