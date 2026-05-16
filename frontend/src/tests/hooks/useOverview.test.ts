import { renderHook, act } from '@testing-library/react'
import { useOverview } from '@/features/projects/presentation/hooks/useOverview'
import { isAuthenticated } from '@/shared/infrastructure/http'
import { httpProjectsRepository } from '@/features/projects/infrastructure/projects.repository'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'

vi.mock('@/shared/infrastructure/http', () => ({
  isAuthenticated: vi.fn(),
}))

vi.mock('@/features/projects/infrastructure/projects.repository', () => ({
  httpProjectsRepository: {
    overview: vi.fn(),
  },
}))

describe('useOverview hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return unauthorized if not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)
    const { result } = renderHook(() => useOverview())
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => expect(result.current.unauthorized).toBe(true))
  })

  it('should fetch overview stats successfully', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    const mockStats = { 
      totalProjects: faker.number.int({ min: 1, max: 10 }), 
      totalDevices: faker.number.int({ min: 10, max: 50 }), 
      totalSensors: faker.number.int({ min: 50, max: 200 }), 
      eventsLast24h: faker.number.int({ min: 1000, max: 5000 }), 
      recentEvents: [] 
    }
    vi.mocked(httpProjectsRepository.overview).mockResolvedValue(mockStats as any)

    const { result } = renderHook(() => useOverview())
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.stats).toEqual(mockStats)
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle fetch error silently', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.overview).mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useOverview())
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.stats).toBeNull()
    })
  })

  it('should poll for overview stats', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.overview).mockResolvedValue({} as any)

    renderHook(() => useOverview(1000))

    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(httpProjectsRepository.overview).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(httpProjectsRepository.overview).toHaveBeenCalledTimes(2)
  })
})
