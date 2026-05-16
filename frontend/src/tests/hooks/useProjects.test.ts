import { renderHook, act } from '@testing-library/react'
import { useProjects } from '@/features/projects/presentation/hooks/useProjects'
import { isAuthenticated } from '@/shared/infrastructure/http'
import { httpProjectsRepository } from '@/features/projects/infrastructure/projects.repository'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'

vi.mock('@/shared/infrastructure/http', () => ({
  isAuthenticated: vi.fn(),
}))

vi.mock('@/features/projects/infrastructure/projects.repository', () => ({
  httpProjectsRepository: {
    list: vi.fn(),
  },
}))

describe('useProjects hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return unauthorized if not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)
    const { result } = renderHook(() => useProjects())
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => expect(result.current.unauthorized).toBe(true))
  })

  it('should fetch projects successfully', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    const mockProjects = [{ 
      id: faker.string.uuid(), 
      name: faker.commerce.productName(),
      createdAt: faker.date.past().toISOString()
    }]
    vi.mocked(httpProjectsRepository.list).mockResolvedValue(mockProjects as unknown as never)

    const { result } = renderHook(() => useProjects())
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.projects).toEqual(mockProjects)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('should handle fetch error', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    const errorMessage = faker.lorem.sentence()
    vi.mocked(httpProjectsRepository.list).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useProjects())
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.loading).toBe(false)
    })
  })

  it('should poll for projects', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.list).mockResolvedValue([])

    renderHook(() => useProjects(1000))

    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(httpProjectsRepository.list).toHaveBeenCalledTimes(1)

    // First interval
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(httpProjectsRepository.list).toHaveBeenCalledTimes(2)
    
    // Second interval
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(httpProjectsRepository.list).toHaveBeenCalledTimes(3)
  })

  it('should stop polling if pollMs is 0', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.list).mockResolvedValue([])

    renderHook(() => useProjects(0))

    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(httpProjectsRepository.list).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(httpProjectsRepository.list).toHaveBeenCalledTimes(1)
  })

  it('should refetch manually', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.list).mockResolvedValue([])

    const { result } = renderHook(() => useProjects(0))
    
    await vi.advanceTimersByTimeAsync(0)
    expect(httpProjectsRepository.list).toHaveBeenCalledTimes(1)

    await result.current.refetch()
    expect(httpProjectsRepository.list).toHaveBeenCalledTimes(2)
  })
})
