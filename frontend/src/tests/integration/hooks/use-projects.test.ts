import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProjects } from '@/features/projects/presentation/hooks/useProjects'
import type { Project } from '@/features/projects/domain/types'

vi.mock('@/shared/infrastructure/http', () => ({
  isAuthenticated: vi.fn(),
}))

vi.mock('@/features/projects/infrastructure/projects.repository', () => ({
  httpProjectsRepository: {
    list: vi.fn(() => Promise.resolve([])),
  },
}))

import { isAuthenticated } from '@/shared/infrastructure/http'
import { httpProjectsRepository } from '@/features/projects/infrastructure/projects.repository'

const mockProjects: Project[] = [
  { id: '1', name: 'Project 1', description: 'desc', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
  { id: '2', name: 'Project 2', description: 'desc', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
]

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty projects initially', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.list).mockResolvedValue(mockProjects)

    const { result } = renderHook(() => useProjects(0))

    expect(result.current.projects).toEqual([])
    expect(result.current.unauthorized).toBe(false)
  })

  it('sets unauthorized when not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)

    const { result } = renderHook(() => useProjects(0))

    await waitFor(() => {
      expect(result.current.unauthorized).toBe(true)
    })
    expect(httpProjectsRepository.list).not.toHaveBeenCalled()
  })

  it('loads projects after mount', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.list).mockResolvedValue(mockProjects)

    const { result } = renderHook(() => useProjects(0))

    await waitFor(() => {
      expect(result.current.projects).toEqual(mockProjects)
    }, { timeout: 1000 })
  })

  it('handles errors and sets error message', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.list).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProjects(0))

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    }, { timeout: 1000 })
  })

  it('provides refetch function', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpProjectsRepository.list).mockResolvedValue(mockProjects)

    const { result } = renderHook(() => useProjects(0))

    await waitFor(() => {
      expect(result.current.projects).toEqual(mockProjects)
    }, { timeout: 1000 })

    vi.mocked(httpProjectsRepository.list).mockResolvedValue([mockProjects[0]])

    await act(async () => {
      await result.current.refetch()
    })

    expect(httpProjectsRepository.list).toHaveBeenCalledTimes(2)
  })
})