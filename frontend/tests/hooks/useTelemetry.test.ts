import { renderHook } from '@testing-library/react'
import { useTelemetry, useSocketStatus } from '@/features/telemetry/presentation/hooks/useTelemetry'
import { getSocket } from '@/features/telemetry/infrastructure/socket'
import { useTelemetryStore } from '@/features/telemetry/presentation/store'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/features/telemetry/infrastructure/socket', () => ({
  getSocket: vi.fn(),
}))

vi.mock('@/features/telemetry/presentation/store', () => ({
  useTelemetryStore: vi.fn(),
}))

describe('useTelemetry hook', () => {
  let mockSocket: {
    on: ReturnType<typeof vi.fn>
    off: ReturnType<typeof vi.fn>
    emit: ReturnType<typeof vi.fn>
    connected: boolean
  }
  let mockStore: {
    setConnected: ReturnType<typeof vi.fn>
    setInitialState: ReturnType<typeof vi.fn>
    applyBatch: ReturnType<typeof vi.fn>
    clearDevices: ReturnType<typeof vi.fn>
    clearRealtimePoints: ReturnType<typeof vi.fn>
    connected: boolean
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      connected: false,
    }
    vi.mocked(getSocket).mockReturnValue(mockSocket as unknown as never)

    mockStore = {
      setConnected: vi.fn(),
      setInitialState: vi.fn(),
      applyBatch: vi.fn(),
      clearDevices: vi.fn(),
      clearRealtimePoints: vi.fn(),
      connected: false,
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useTelemetryStore).mockImplementation((selector: any) => selector(mockStore))
  })

  it('should initialize socket and listeners', () => {
    renderHook(() => useTelemetry('p1'))

    expect(getSocket).toHaveBeenCalled()
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('initial_state', expect.any(Function))
    expect(mockSocket.on).toHaveBeenCalledWith('telemetry_batch', expect.any(Function))
    expect(mockStore.clearDevices).toHaveBeenCalled()
  })

  it('should emit subscribeToProject if socket is already connected', () => {
    mockSocket.connected = true
    renderHook(() => useTelemetry('p1'))

    expect(mockSocket.emit).toHaveBeenCalledWith('subscribeToProject', { projectId: 'p1' })
    expect(mockStore.setConnected).toHaveBeenCalledWith(true)
  })

  it('should emit subscribeToProject on connect if projectId provided', () => {
    renderHook(() => useTelemetry('p1'))

    const onConnect = (mockSocket.on.mock.calls.find((call) => call[0] === 'connect') as unknown as never[])[1] as unknown as () => void
    onConnect()

    expect(mockStore.setConnected).toHaveBeenCalledWith(true)
    expect(mockSocket.emit).toHaveBeenCalledWith('subscribeToProject', { projectId: 'p1' })
  })

  it('should handle disconnect event', () => {
    renderHook(() => useTelemetry('p1'))

    const onDisconnect = (mockSocket.on.mock.calls.find((call) => call[0] === 'disconnect') as unknown as never[])[1] as unknown as () => void
    onDisconnect()

    expect(mockStore.setConnected).toHaveBeenCalledWith(false)
  })

  it('should handle initial_state event', () => {
    renderHook(() => useTelemetry('p1'))

    const onInitialState = (mockSocket.on.mock.calls.find((call) => call[0] === 'initial_state') as unknown as never[])[1] as unknown as (data: unknown) => void
    const data = { projectId: 'p1', devices: { 'd1': { name: 'D1' } } }
    onInitialState(data)

    expect(mockStore.setInitialState).toHaveBeenCalledWith('p1', data.devices)
  })

  it('should ignore initial_state for different project', () => {
    renderHook(() => useTelemetry('p1'))

    const onInitialState = (mockSocket.on.mock.calls.find((call) => call[0] === 'initial_state') as unknown as never[])[1] as unknown as (data: unknown) => void
    const data = { projectId: 'p2', devices: {} }
    onInitialState(data)

    expect(mockStore.setInitialState).not.toHaveBeenCalled()
  })

  it('should handle telemetry_batch event', () => {
    renderHook(() => useTelemetry('p1'))

    const onTelemetryBatch = (mockSocket.on.mock.calls.find((call) => call[0] === 'telemetry_batch') as unknown as never[])[1] as unknown as (data: unknown) => void
    const data = { projectId: 'p1', events: [{ type: 't' }] }
    onTelemetryBatch(data)

    expect(mockStore.applyBatch).toHaveBeenCalledWith(data.events)
  })

  it('should ignore telemetry_batch for different project or invalid events', () => {
    renderHook(() => useTelemetry('p1'))

    const onTelemetryBatch = (mockSocket.on.mock.calls.find((call) => call[0] === 'telemetry_batch') as unknown as never[])[1] as unknown as (data: unknown) => void
    
    // Different project
    onTelemetryBatch({ projectId: 'p2', events: [] })
    expect(mockStore.applyBatch).not.toHaveBeenCalled()

    // Invalid events
    onTelemetryBatch({ projectId: 'p1', events: 'not-an-array' } as unknown as never)
    expect(mockStore.applyBatch).not.toHaveBeenCalled()
  })

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useTelemetry('p1'))
    unmount()

    expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribeFromProject', { projectId: 'p1' })
    expect(mockSocket.off).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('initial_state', expect.any(Function))
    expect(mockSocket.off).toHaveBeenCalledWith('telemetry_batch', expect.any(Function))
  })

  it('useSocketStatus should return connected state from store', () => {
    mockStore.connected = true
    const { result } = renderHook(() => useSocketStatus())
    expect(result.current).toBe(true)
  })
})
