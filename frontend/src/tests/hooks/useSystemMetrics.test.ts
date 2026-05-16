import { renderHook, act } from '@testing-library/react'
import { useSystemMetrics } from '@/features/observability/presentation/hooks/useSystemMetrics'
import { httpObservabilityRepository } from '@/features/observability/infrastructure/observability.repository'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'

vi.mock('@/features/observability/infrastructure/observability.repository', () => ({
  httpObservabilityRepository: {
    metrics: vi.fn(),
  },
}))

describe('useSystemMetrics hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should fetch system metrics successfully', async () => {
    const mockMetrics = { 
      cpu: faker.number.int({ min: 0, max: 100 }), 
      memory: faker.number.int({ min: 0, max: 100 }), 
      uptime: faker.number.int({ min: 1000, max: 5000 }), 
      disk: faker.number.int({ min: 0, max: 100 }) 
    }
    vi.mocked(httpObservabilityRepository.metrics).mockResolvedValue(mockMetrics as unknown as never)

    const { result } = renderHook(() => useSystemMetrics())
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.metrics).toEqual(mockMetrics)
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle fetch error silently', async () => {
    vi.mocked(httpObservabilityRepository.metrics).mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useSystemMetrics())
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.metrics).toBeNull()
    })
  })

  it('should poll for system metrics', async () => {
    vi.mocked(httpObservabilityRepository.metrics).mockResolvedValue({} as unknown as never)

    renderHook(() => useSystemMetrics(1000))

    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(httpObservabilityRepository.metrics).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(httpObservabilityRepository.metrics).toHaveBeenCalledTimes(2)
  })

  it('should refresh manually', async () => {
    vi.mocked(httpObservabilityRepository.metrics).mockResolvedValue({} as unknown as never)

    const { result } = renderHook(() => useSystemMetrics(0))
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(httpObservabilityRepository.metrics).toHaveBeenCalledTimes(1)

    await result.current.refresh()
    expect(httpObservabilityRepository.metrics).toHaveBeenCalledTimes(2)
  })
})
