import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSystemMetrics } from '@/features/observability/presentation/hooks/useSystemMetrics'

vi.mock('@/features/observability/infrastructure/observability.repository', () => ({
  httpObservabilityRepository: {
    metrics: vi.fn(),
  },
}))

import { httpObservabilityRepository } from '@/features/observability/infrastructure/observability.repository'

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
  })

  it('loads metrics after mount', async () => {
    vi.mocked(httpObservabilityRepository.metrics).mockResolvedValue(mockMetrics)

    const { result } = renderHook(() => useSystemMetrics(0))

    await waitFor(() => {
      expect(result.current.metrics).toEqual(mockMetrics)
    }, { timeout: 1000 })

    expect(httpObservabilityRepository.metrics).toHaveBeenCalled()
  })

  it('handles errors silently', async () => {
    vi.mocked(httpObservabilityRepository.metrics).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSystemMetrics(0))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    expect(result.current.metrics).toBeNull()
  })
})