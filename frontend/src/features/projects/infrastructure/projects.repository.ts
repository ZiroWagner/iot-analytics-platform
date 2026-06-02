import { apiClient, API_ENDPOINTS } from '@/shared/infrastructure/http'
import { createProjectSchema } from '../domain/schemas'
import type { CreateProjectInput } from '../domain/schemas'
import type { OverviewStats, Project } from '../domain/types'

export interface ProjectsRepository {
  list(): Promise<Project[]>
  overview(): Promise<OverviewStats>
  create(input: CreateProjectInput): Promise<Project>
  update(id: string, input: CreateProjectInput): Promise<Project>
  delete(id: string): Promise<void>
}

export const httpProjectsRepository: ProjectsRepository = {
  list: () => apiClient<Project[]>(API_ENDPOINTS.PROJECTS.LIST),

  overview: () => apiClient<OverviewStats>(API_ENDPOINTS.PROJECTS.OVERVIEW),

  create: (input) => {
    const body = createProjectSchema.parse(input)
    return apiClient<Project>(API_ENDPOINTS.PROJECTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update: (id, input) => {
    const body = createProjectSchema.parse(input)
    return apiClient<Project>(API_ENDPOINTS.PROJECTS.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete: (id) =>
    apiClient<void>(API_ENDPOINTS.PROJECTS.DELETE(id), {
      method: 'DELETE',
    }),
}
