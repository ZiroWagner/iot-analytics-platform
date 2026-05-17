import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { httpSensorsRepository } from '@/features/sensors/infrastructure/sensors.repository'

vi.mock('@/shared/infrastructure/http', () => ({
  apiClient: vi.fn(),
  API_ENDPOINTS: {
    SENSORS: {
      CREATE: '/sensors',
      DATA: (id: string) => `/sensors/${id}/data`,
    },
  },
}))

import { apiClient } from '@/shared/infrastructure/http'

describe('httpSensorsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls apiClient with correct endpoint for getData', async () => {
    const mockData = [
      { timestamp: '2026-01-01T00:00:00Z', value: 22.5 },
      { timestamp: '2026-01-01T00:01:00Z', value: 22.8 },
    ]
    vi.mocked(apiClient).mockResolvedValue(mockData)

    const result = await httpSensorsRepository.getData('sensor-1')

    expect(apiClient).toHaveBeenCalledWith('/sensors/sensor-1/data')
    expect(result).toEqual(mockData)
  })

  it('calls apiClient with POST for create', async () => {
    const mockSensor = { id: 'sensor-new', name: 'New Sensor', deviceId: 'device-1', metadata: {} }
    vi.mocked(apiClient).mockResolvedValue(mockSensor)

    const payload = { name: 'New Sensor', deviceId: 'device-1', metadata: {} }
    const result = await httpSensorsRepository.create(payload)

    expect(apiClient).toHaveBeenCalledWith('/sensors', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    expect(result).toEqual(mockSensor)
  })
})