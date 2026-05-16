import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTelemetry, useSocketStatus } from '@/features/telemetry/presentation/hooks/useTelemetry'
import { useTelemetryStore } from '@/features/telemetry/presentation/store'

const mockSocket = {
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}

vi.mock('@/features/telemetry/infrastructure/socket', () => ({
  getSocket: vi.fn(() => mockSocket),
}))

describe('useTelemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTelemetryStore.setState({
      connected: false,
      devices: {},
      systemMetrics: null,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('connects socket on mount', () => {
    renderHook(() => useTelemetry('project-1'))
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
  })

  it('clears devices when projectId changes', () => {
    const { rerender } = renderHook(({ projectId }) => useTelemetry(projectId), {
      initialProps: { projectId: 'project-1' },
    })

    useTelemetryStore.setState({
      devices: { 'device-1': { deviceId: 'device-1', status: 'online', lastSeenAt: '2026-01-01T00:00:00Z', sensors: {} } },
    })

    rerender({ projectId: 'project-2' })

    expect(useTelemetryStore.getState().devices).toEqual({})
  })

  it('cleans up listeners on unmount', () => {
    const { unmount } = renderHook(() => useTelemetry('project-1'))
    unmount()
    expect(mockSocket.off).toHaveBeenCalledTimes(4)
  })
})

describe('useSocketStatus', () => {
  beforeEach(() => {
    useTelemetryStore.setState({
      connected: false,
      devices: {},
      systemMetrics: null,
    })
  })

  it('returns false when not connected', () => {
    const { result } = renderHook(() => useSocketStatus())
    expect(result.current).toBe(false)
  })

  it('returns true when connected', () => {
    useTelemetryStore.setState({ connected: true, devices: {}, systemMetrics: null })
    const { result } = renderHook(() => useSocketStatus())
    expect(result.current).toBe(true)
  })
})