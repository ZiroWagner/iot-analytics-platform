import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSystemMetrics } from '../presentation/hooks/useSystemMetrics'

vi.mock('../infrastructure/observability.repository', () => ({
  httpObservabilityRepository: {
    metrics: vi.fn(),
  },
}))

import { httpObservabilityRepository } from '../infrastructure/observability.repository'

const mockMetrics = {
  streamSize: 1000,
  consumerLag: 5,
  eventsPerSecond: 50,
  onlineDevices: 20,
}

describe('useSystemMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null metrics initially', () => {
    vi.mocked(httpObservabilityRepository.metrics).mockResolvedValue(mockMetrics)

    const { result } = renderHook(() => useSystemMetrics(0))

    expect(result.current.metrics).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('loads metrics after mount', async () => {
    vi.mocked(httpObservabilityRepository.metrics).mockResolvedValue(mockMetrics)

    const { result } = renderHook(() => useSystemMetrics(0))

    await waitFor(() => {
      expect(result.current.metrics).toEqual(mockMetrics)
    }, { timeout: 1000 })
  })

  it('handles errors silently without crashing', async () => {
    vi.mocked(httpObservabilityRepository.metrics).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useSystemMetrics(0))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    expect(result.current.metrics).toBeNull()
  })

  it('provides refresh function', async () => {
    vi.mocked(httpObservabilityRepository.metrics).mockResolvedValue(mockMetrics)

    const { result } = renderHook(() => useSystemMetrics(0))

    await waitFor(() => {
      expect(result.current.metrics).toEqual(mockMetrics)
    }, { timeout: 1000 })

    vi.mocked(httpObservabilityRepository.metrics).mockResolvedValue({
      ...mockMetrics,
      eventsPerSecond: 60,
    })

    await result.current.refresh()

    expect(httpObservabilityRepository.metrics).toHaveBeenCalledTimes(2)
  })
})