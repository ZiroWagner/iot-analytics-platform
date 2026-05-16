import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOverview } from '@/features/projects/presentation/hooks/useOverview'

vi.mock('@/shared/infrastructure/http', () => ({
  isAuthenticated: vi.fn(),
}))

vi.mock('@/features/projects/infrastructure/projects.repository', () => ({
  httpProjectsRepository: {
    overview: vi.fn(),
  },
}))

import { isAuthenticated } from '@/shared/infrastructure/http'
import { httpProjectsRepository } from '@/features/projects/infrastructure/projects.repository'

const mockStats = {
  totalProjects: 5,
  totalDevices: 10,
  activeDevices: 8,
  eventsLastHour: 100,
}

describe('useOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null stats initially', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.overview).mockResolvedValue(mockStats)

    const { result } = renderHook(() => useOverview(0))

    expect(result.current.stats).toBeNull()
    expect(result.current.unauthorized).toBe(false)
  })

  it('loads overview stats after mount', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.overview).mockResolvedValue(mockStats)

    const { result } = renderHook(() => useOverview(0))

    await waitFor(() => {
      expect(result.current.stats).toEqual(mockStats)
    }, { timeout: 1000 })
  })

  it('sets unauthorized when not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)

    const { result } = renderHook(() => useOverview(0))

    await waitFor(() => {
      expect(result.current.unauthorized).toBe(true)
    })
  })

  it('handles errors silently without crashing', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.overview).mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useOverview(0))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    expect(result.current.stats).toBeNull()
  })
})