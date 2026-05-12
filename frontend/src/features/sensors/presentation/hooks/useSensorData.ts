"use client"

import { useCallback, useEffect, useState } from "react"
import { httpSensorsRepository } from "../../infrastructure/sensors.repository"
import type { DataPoint } from "../../domain/types"

const DEFAULT_POLL_MS = 3000

/**
 * Polls the most recent data points for a single sensor. Silent on error so
 * transient network blips do not flood the UI.
 */
export function useSensorData(
  sensorId: string,
  pollMs: number = DEFAULT_POLL_MS,
): { dataPoints: DataPoint[]; loading: boolean } {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const data = await httpSensorsRepository.getData(sensorId)
      setDataPoints(data)
    } catch {
      // silent retry on next tick
    } finally {
      setLoading(false)
    }
  }, [sensorId])

  useEffect(() => {
    fetchData()
    if (pollMs <= 0) return
    const interval = setInterval(fetchData, pollMs)
    return () => clearInterval(interval)
  }, [fetchData, pollMs])

  return { dataPoints, loading }
}
