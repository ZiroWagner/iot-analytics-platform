import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { httpDevicesRepository } from '@/features/devices/infrastructure/devices.repository'

vi.mock('@/shared/infrastructure/http', () => ({
  apiClient: vi.fn(),
  API_ENDPOINTS: {
    DEVICES: {
      LIST_BY_PROJECT: (id: string) => `/projects/${id}/devices`,
      CREATE: '/devices',
      UPDATE: (id: string) => `/devices/${id}`,
      DELETE: (id: string) => `/devices/${id}`,
    },
  },
}))

import { apiClient } from '@/shared/infrastructure/http'

describe('httpDevicesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls apiClient with correct endpoint for listByProject', async () => {
    const mockDevices = [
      { id: 'device-1', name: 'Device 1', projectId: 'project-1', status: 'online', sensors: [] },
    ]
    vi.mocked(apiClient).mockResolvedValue(mockDevices)

    const result = await httpDevicesRepository.listByProject('project-1')

    expect(apiClient).toHaveBeenCalledWith('/projects/project-1/devices')
    expect(result).toEqual(mockDevices)
  })

  it('calls apiClient with POST for create', async () => {
    const mockDevice = { id: 'device-new', name: 'New Device', projectId: 'project-1', status: 'online', sensors: [] }
    vi.mocked(apiClient).mockResolvedValue(mockDevice)

    const result = await httpDevicesRepository.create('project-1', { name: 'New Device', type: 'ESP32' })

    expect(apiClient).toHaveBeenCalledWith('/devices', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Device', type: 'ESP32', projectId: 'project-1' }),
    })
    expect(result).toEqual(mockDevice)
  })

  it('updates a device with PATCH', async () => {
    const mockDevice = { id: 'device-1', name: 'Updated Device', projectId: 'project-1', status: 'online', sensors: [] }
    vi.mocked(apiClient).mockResolvedValue(mockDevice)

    const result = await httpDevicesRepository.update('device-1', { name: 'Updated Device', type: 'ESP32' })

    expect(apiClient).toHaveBeenCalledWith('/devices/device-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated Device', type: 'ESP32' }),
    })
    expect(result).toEqual(mockDevice)
  })

  it('deletes a device with DELETE', async () => {
    vi.mocked(apiClient).mockResolvedValue(undefined)

    await httpDevicesRepository.delete('device-1')

    expect(apiClient).toHaveBeenCalledWith(
      '/devices/device-1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})