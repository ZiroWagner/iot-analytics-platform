import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { httpObservabilityRepository } from '@/features/observability/infrastructure/observability.repository'

vi.mock('@/shared/infrastructure/http', () => ({
  apiClient: vi.fn(),
  API_ENDPOINTS: {
    OBSERVABILITY: {
      METRICS: '/observability/metrics',
    },
  },
}))

import { apiClient } from '@/shared/infrastructure/http'

describe('httpObservabilityRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls apiClient with correct endpoint for metrics', async () => {
    const mockMetrics = {
      streamSize: 1000,
      consumerLag: 5,
      eventsPerSecond: 50,
      onlineDevices: 20,
    }
    vi.mocked(apiClient).mockResolvedValue(mockMetrics)

    const result = await httpObservabilityRepository.metrics()

    expect(apiClient).toHaveBeenCalledWith('/observability/metrics')
    expect(result).toEqual(mockMetrics)
  })
})