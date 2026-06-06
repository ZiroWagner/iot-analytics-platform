import { API_BASE_URL, API_PREFIX, API_URL } from './config'
import { tokenStorage } from './token-storage'

/**
 * Returns the full backend URL for OAuth redirects.
 */
export function getAuthUrl(path: string): string {
  return `${API_BASE_URL}${API_PREFIX}${path}`
}

/**
 * Returns the base API origin (without /api/v1) for WebSocket connections.
 * Socket.IO mounts on the server root path (/socket.io/), not under the REST prefix.
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL
}

/**
 * Checks if the user is authenticated (has a valid token).
 */
export function isAuthenticated(): boolean {
  return !!tokenStorage.get()
}

/**
 * Centralized fetch wrapper that handles auth headers and error parsing.
 * Throws on non-OK responses.
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenStorage.get()
  const headers: HeadersInit = {
    ...(options.headers),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  if (options.body && typeof options.body === 'string') {
    ; (headers as Record<string, string>)['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorTextResponse = res.clone()
    let errorJson: unknown
    try {
      errorJson = await res.json()
    } catch {
      const text = await errorTextResponse.text().catch(() => "Unknown error")
      throw new Error(`API Error ${res.status}: ${text}`)
    }

    if (
      errorJson &&
      typeof errorJson === 'object' &&
      'details' in errorJson &&
      Array.isArray(errorJson.details)
    ) {
      throw new Error(errorJson.details.join(", "))
    }

    if (
      errorJson &&
      typeof errorJson === 'object' &&
      'message' in errorJson &&
      typeof errorJson.message === 'string'
    ) {
      throw new Error(errorJson.message)
    }

    throw new Error(`API Error ${res.status}: ${JSON.stringify(errorJson)}`)
  }

  const response = await res.json()

  // Unwrap { success, data, ... } envelope when present
  if (
    response &&
    typeof response === 'object' &&
    'success' in response &&
    'data' in response
  ) {
    return response.data as T
  }

  return response as T
}
