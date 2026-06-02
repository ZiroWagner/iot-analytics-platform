import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { httpProjectsRepository } from '@/features/projects/infrastructure/projects.repository'

vi.mock('@/shared/infrastructure/http', () => ({
  apiClient: vi.fn(),
  API_ENDPOINTS: {
    PROJECTS: {
      LIST: '/projects',
      CREATE: '/projects',
      OVERVIEW: '/projects/overview',
      UPDATE: (id: string) => `/projects/${id}`,
      DELETE: (id: string) => `/projects/${id}`,
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

  it('updates a project with PATCH', async () => {
    const mockProject = {
      id: 'project-1',
      name: 'Updated Project',
      createdAt: '2026-01-01T00:00:00Z',
    }
    vi.mocked(apiClient).mockResolvedValueOnce(mockProject)

    const result = await httpProjectsRepository.update('project-1', { name: 'Updated Project' })

    expect(apiClient).toHaveBeenCalledWith(
      '/projects/project-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Project' }),
      }),
    )
    expect(result).toEqual(mockProject)
  })

  it('deletes a project with DELETE', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(undefined)

    await httpProjectsRepository.delete('project-1')

    expect(apiClient).toHaveBeenCalledWith(
      '/projects/project-1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})