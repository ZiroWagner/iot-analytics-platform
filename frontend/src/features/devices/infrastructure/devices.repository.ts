import { apiClient, API_ENDPOINTS } from '@/shared/infrastructure/http'
import { createDeviceSchema, type CreateDeviceInput } from '../domain/schemas'
import type { Device } from '../domain/types'

export interface DevicesRepository {
  listByProject(projectId: string): Promise<Device[]>
  create(projectId: string, input: CreateDeviceInput): Promise<Device>
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
}
