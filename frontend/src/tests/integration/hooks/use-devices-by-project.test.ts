import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDevicesByProject } from '@/features/devices/presentation/hooks/useDevicesByProject'

vi.mock('@/shared/infrastructure/http', () => ({
  isAuthenticated: vi.fn(),
}))

vi.mock('@/features/devices/infrastructure/devices.repository', () => ({
  httpDevicesRepository: {
    listByProject: vi.fn(),
  },
}))

import { isAuthenticated } from '@/shared/infrastructure/http'
import { httpDevicesRepository } from '@/features/devices/infrastructure/devices.repository'

const mockDevices = [
  { id: 'device-1', name: 'Device 1', projectId: 'project-1', status: 'online', sensors: [] },
  { id: 'device-2', name: 'Device 2', projectId: 'project-1', status: 'offline', sensors: [] },
]

describe('useDevicesByProject', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns empty devices initially', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpDevicesRepository.listByProject).mockResolvedValue(mockDevices)

    const { result } = renderHook(() => useDevicesByProject('project-1'))

    expect(result.current.devices).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.unauthorized).toBe(false)
  })

  it('loads devices after mount', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpDevicesRepository.listByProject).mockResolvedValue(mockDevices)

    const { result } = renderHook(() => useDevicesByProject('project-1'))

    await waitFor(() => {
      expect(result.current.devices).toEqual(mockDevices)
    }, { timeout: 1000 })
  })

  it('sets unauthorized when not authenticated', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)

    const { result } = renderHook(() => useDevicesByProject('project-1'))

    await waitFor(() => {
      expect(result.current.unauthorized).toBe(true)
    })
  })

  it('handles errors and sets error message', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpDevicesRepository.listByProject).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useDevicesByProject('project-1'))

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    }, { timeout: 1000 })
  })

  it('provides refetch function', async () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    vi.mocked(httpDevicesRepository.listByProject).mockResolvedValue(mockDevices)

    const { result } = renderHook(() => useDevicesByProject('project-1'))

    await waitFor(() => {
      expect(result.current.devices).toEqual(mockDevices)
    }, { timeout: 1000 })

    await result.current.refetch()

    expect(httpDevicesRepository.listByProject).toHaveBeenCalledTimes(2)
  })
})