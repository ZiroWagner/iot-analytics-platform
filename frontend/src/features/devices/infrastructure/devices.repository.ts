import { apiClient, API_ENDPOINTS } from '@/shared/infrastructure/http'
import { createDeviceSchema, type CreateDeviceInput } from '../domain/schemas'
import type { Device } from '../domain/types'

export interface DevicesRepository {
  listByProject(projectId: string): Promise<Device[]>
  create(projectId: string, input: CreateDeviceInput): Promise<Device>
  update(id: string, input: CreateDeviceInput): Promise<Device>
  delete(id: string): Promise<void>
}

export const httpDevicesRepository: DevicesRepository = {
  listByProject: (projectId) =>
    apiClient<Device[]>(API_ENDPOINTS.DEVICES.LIST_BY_PROJECT(projectId)),

  create: (projectId, input) => {
    const body = createDeviceSchema.parse(input)
    return apiClient<Device>(API_ENDPOINTS.DEVICES.CREATE, {
      method: 'POST',
      body: JSON.stringify({ ...body, projectId }),
    })
  },

  update: (id, input) => {
    const body = createDeviceSchema.parse(input)
    return apiClient<Device>(API_ENDPOINTS.DEVICES.UPDATE(id), {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },

  delete: (id) =>
    apiClient<void>(API_ENDPOINTS.DEVICES.DELETE(id), {
      method: 'DELETE',
    }),
}
