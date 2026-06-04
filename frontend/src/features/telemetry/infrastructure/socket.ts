import { io, type Socket } from 'socket.io-client'
import { getApiBaseUrl } from '@/shared/infrastructure/http'

let globalSocket: Socket | null = null

/**
 * Socket.IO connection URL.
 * - On SSR (server side inside Docker): use the full backend URL (e.g. http://backend:3000).
 * - In the browser: use `NEXT_PUBLIC_WS_URL` (host-mapped port, e.g. http://localhost:3001)
 *   because Next.js rewrites do not proxy WebSocket upgrades.
 */
function getSocketUrl(): string {
  if (typeof window === 'undefined') {
    return getApiBaseUrl()
  }
  return process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001'
}

/**
 * Returns a singleton Socket.IO client connected to the backend origin.
 * Lazily created so it does not run during SSR/build.
 */
export function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
  }
  return globalSocket
}

/** Test-only helper to reset the singleton between tests. */
export function __resetSocketForTests(): void {
  if (globalSocket) {
    globalSocket.removeAllListeners()
    globalSocket.disconnect()
  }
  globalSocket = null
}
