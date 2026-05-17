import { renderHook, act } from '@testing-library/react'
import { useDevicesByProject } from '@/features/devices/presentation/hooks/useDevicesByProject'
import { isAuthenticated } from '@/shared/infrastructure/http'
import { httpDevicesRepository } from '@/features/devices/infrastructure/devices.repository'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { faker } from '@faker-js/faker'

vi.mock('@/shared/infrastructure/http', () => ({
  isAuthenticated: vi.fn(),
}))

vi.mock('@/features/devices/infrastructure/devices.repository', () => ({
  httpDevicesRepository: {
    listByProject: vi.fn(),
  },
}))

describe('useDevicesByProject hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return unauthorized if not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)
    const { result } = renderHook(() => useDevicesByProject('p1'))
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => expect(result.current.unauthorized).toBe(true))
  })

  it('should fetch devices successfully', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    const mockDevices = [{ 
      id: faker.string.uuid(), 
      name: faker.commerce.productName(), 
      sensors: [] 
    }]
    vi.mocked(httpDevicesRepository.listByProject).mockResolvedValue(mockDevices as unknown as never)

    const { result } = renderHook(() => useDevicesByProject('p1'))
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.devices).toEqual(mockDevices)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('should handle fetch error', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    const errorMessage = faker.lorem.sentence()
    vi.mocked(httpDevicesRepository.listByProject).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useDevicesByProject('p1'))
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    await vi.waitFor(() => {
      expect(result.current.error).toBe(errorMessage)
      expect(result.current.loading).toBe(false)
    })
  })

  it('should not fetch if projectId is missing', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    renderHook(() => useDevicesByProject(''))
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    
    expect(httpDevicesRepository.listByProject).not.toHaveBeenCalled()
  })

  it('should refetch manually', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpDevicesRepository.listByProject).mockResolvedValue([])

    const { result } = renderHook(() => useDevicesByProject('p1'))
    
    await act(async () => {
      vi.advanceTimersByTime(0)
    })
    expect(httpDevicesRepository.listByProject).toHaveBeenCalledTimes(1)

    await result.current.refetch()
    expect(httpDevicesRepository.listByProject).toHaveBeenCalledTimes(2)
  })
})
