/**
 * HTTP/WebSocket base URL configuration.
 * `API_BASE_URL` is the server origin (used by Socket.IO).
 * `API_URL` is the REST base with the versioning prefix.
 *
 * In the browser, `API_URL` is relative (`/api/v1`) so requests go through
 * Next.js rewrites (which proxy to the backend inside the Docker network).
 * On the server (SSR), `API_URL` uses the full backend URL for direct access.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://backend:3001'
export const API_PREFIX = '/api/v1'
export const API_URL =
  typeof window === 'undefined'
    ? `${API_BASE_URL}${API_PREFIX}`
    : API_PREFIX
