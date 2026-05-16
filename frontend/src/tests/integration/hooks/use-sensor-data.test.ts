import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSensorData } from '@/features/sensors/presentation/hooks/useSensorData'

vi.mock('@/features/sensors/infrastructure/sensors.repository', () => ({
  httpSensorsRepository: {
    getData: vi.fn(),
  },
}))

import { httpSensorsRepository } from '@/features/sensors/infrastructure/sensors.repository'

const mockDataPoints = [
  { timestamp: '2026-01-01T00:00:00Z', value: 22.5 },
  { timestamp: '2026-01-01T00:01:00Z', value: 22.8 },
]

describe('useSensorData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty data points initially', () => {
    vi.mocked(httpSensorsRepository.getData).mockResolvedValue(mockDataPoints)

    const { result } = renderHook(() => useSensorData('sensor-1', 0))

    expect(result.current.dataPoints).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('loads sensor data after mount', async () => {
    vi.mocked(httpSensorsRepository.getData).mockResolvedValue(mockDataPoints)

    const { result } = renderHook(() => useSensorData('sensor-1', 0))

    await waitFor(() => {
      expect(result.current.dataPoints).toEqual(mockDataPoints)
    }, { timeout: 1000 })

    expect(httpSensorsRepository.getData).toHaveBeenCalledWith('sensor-1')
  })

  it('handles errors silently', async () => {
    vi.mocked(httpSensorsRepository.getData).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSensorData('sensor-1', 0))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    }, { timeout: 1000 })

    expect(result.current.dataPoints).toEqual([])
  })
})