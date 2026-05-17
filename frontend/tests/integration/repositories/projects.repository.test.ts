import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { httpProjectsRepository } from '@/features/projects/infrastructure/projects.repository'

vi.mock('@/shared/infrastructure/http', () => ({
  apiClient: vi.fn(),
  API_ENDPOINTS: {
    PROJECTS: {
      LIST: '/projects',
      CREATE: '/projects',
      OVERVIEW: '/projects/overview',
    },
  },
}))

import { apiClient } from '@/shared/infrastructure/http'

describe('httpProjectsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('lists all projects', async () => {
    const mockProjects = [
      { id: 'project-1', name: 'Project 1', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'project-2', name: 'Project 2', createdAt: '2026-01-01T00:00:00Z' },
    ]
    vi.mocked(apiClient).mockResolvedValueOnce(mockProjects)

    const result = await httpProjectsRepository.list()

    expect(apiClient).toHaveBeenCalledWith('/projects')
    expect(result).toEqual(mockProjects)
  })

  it('fetches overview stats', async () => {
    const mockStats = {
      totalProjects: 5,
      totalDevices: 10,
      totalSensors: 50,
      eventsLast24h: 1000,
      recentEvents: [],
    }
    vi.mocked(apiClient).mockResolvedValueOnce(mockStats)

    const result = await httpProjectsRepository.overview()

    expect(apiClient).toHaveBeenCalledWith('/projects/overview')
    expect(result).toEqual(mockStats)
  })

  it('creates a project with validated input', async () => {
    const mockProject = {
      id: 'project-new',
      name: 'New Project',
      createdAt: '2026-01-01T00:00:00Z',
    }
    vi.mocked(apiClient).mockResolvedValueOnce(mockProject)

    const result = await httpProjectsRepository.create({ name: 'New Project' })

    expect(apiClient).toHaveBeenCalledWith(
      '/projects',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New Project' }),
      }),
    )
    expect(result).toEqual(mockProject)
  })
})