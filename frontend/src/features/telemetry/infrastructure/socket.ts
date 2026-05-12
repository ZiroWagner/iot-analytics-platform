import { io, type Socket } from 'socket.io-client'
import { getApiBaseUrl } from '@/shared/infrastructure/http'

let globalSocket: Socket | null = null

/**
 * Returns a singleton Socket.IO client connected to the backend origin.
 * Lazily created so it does not run during SSR/build.
 */
export function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io(getApiBaseUrl(), {
      transports: ['websocket'],
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
