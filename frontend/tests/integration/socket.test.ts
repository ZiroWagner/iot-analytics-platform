import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { getSocket, __resetSocketForTests } from '@/features/telemetry/infrastructure/socket'

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    connected: true,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    removeAllListeners: vi.fn(),
    disconnect: vi.fn(),
  })),
}))

describe('socket', () => {
  beforeEach(() => {
    __resetSocketForTests()
  })

  afterEach(() => {
    __resetSocketForTests()
  })

  it('returns a socket singleton', () => {
    const socket1 = getSocket()
    const socket2 = getSocket()
    expect(socket1).toBe(socket2)
  })

  it('resets the singleton between tests', () => {
    const socket1 = getSocket()
    __resetSocketForTests()
    const socket2 = getSocket()
    expect(socket1).not.toBe(socket2)
  })
})