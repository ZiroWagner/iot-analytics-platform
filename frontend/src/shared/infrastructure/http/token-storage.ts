/**
 * Browser-side auth token storage. Abstracts localStorage access so the rest
 * of the app does not depend directly on a particular storage mechanism and
 * remains SSR-safe.
 */
const TOKEN_KEY = 'iot_token'

export const tokenStorage = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(TOKEN_KEY)
  },
  set(token: string): void {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(TOKEN_KEY, token)
  },
  clear(): void {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(TOKEN_KEY)
  },
}
