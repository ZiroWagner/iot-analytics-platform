import { renderHook, act } from '@testing-library/react'
import { useSensorData } from '@/features/sensors/presentation/hooks/useSensorData'
import { httpSensorsRepository } from '@/features/sensors/infrastructure/sensors.repository'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'

vi.mock('@/features/sensors/infrastructure/sensors.repository', () => ({
  httpSensorsRepository: {
    getData: vi.fn(),
  },
}))

describe('useSensorData hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should fetch sensor data successfully', async () => {
    const mockData = [{ 
      timestamp: faker.date.recent().toISOString(), 
      value: faker.number.float({ min: 0, max: 100 }) 
    }]
    vi.mocked(httpSensorsRepository.getData).mockResolvedValue(mockData as unknown as never)

    const { result } = renderHook(() => useSensorData('s1'))
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.dataPoints).toEqual(mockData)
      expect(result.current.loading).toBe(false)
    })
  })

  it('should handle fetch error silently', async () => {
    vi.mocked(httpSensorsRepository.getData).mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useSensorData('s1'))
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.dataPoints).toEqual([])
    })
  })

  it('should poll for sensor data', async () => {
    vi.mocked(httpSensorsRepository.getData).mockResolvedValue([])

    renderHook(() => useSensorData('s1', 1000))

    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(httpSensorsRepository.getData).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(httpSensorsRepository.getData).toHaveBeenCalledTimes(2)
  })

  it('should stop polling if pollMs is 0', async () => {
    vi.mocked(httpSensorsRepository.getData).mockResolvedValue([])

    renderHook(() => useSensorData('s1', 0))

    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(httpSensorsRepository.getData).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(httpSensorsRepository.getData).toHaveBeenCalledTimes(1)
  })
})
