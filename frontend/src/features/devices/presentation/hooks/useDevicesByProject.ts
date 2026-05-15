"use client"

import { useCallback, useEffect, useState } from "react"
import { isAuthenticated } from "@/shared/infrastructure/http"
import { httpDevicesRepository } from "../../infrastructure/devices.repository"
import type { Device } from "../../domain/types"

export interface UseDevicesByProjectResult {
  devices: Device[]
  loading: boolean
  unauthorized: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Initial fetch of devices for a project. Real-time updates are driven by the
 * telemetry WebSocket feed; the HTTP fetch is only for metadata + sensor list.
 */
export function useDevicesByProject(projectId: string): UseDevicesByProjectResult {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = useCallback(async () => {
    if (!isAuthenticated()) {
      setUnauthorized(true)
      return
    }
    setLoading(true)
    try {
      const data = await httpDevicesRepository.listByProject(projectId)
      setDevices(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los Gateways (Devices)")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (!projectId) return
    const timeout = setTimeout(fetchDevices, 0)
    return () => clearTimeout(timeout)
  }, [projectId, fetchDevices])

  return { devices, loading, unauthorized, error, refetch: fetchDevices }
}
