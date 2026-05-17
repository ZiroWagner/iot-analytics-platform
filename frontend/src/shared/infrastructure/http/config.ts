/**
 * HTTP/WebSocket base URL configuration.
 * `API_BASE_URL` is the server origin (used by Socket.IO).
 * `API_URL` is the REST base with the versioning prefix.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://backend:3000'
export const API_PREFIX = '/api/v1'
export const API_URL = `${API_BASE_URL}${API_PREFIX}`
