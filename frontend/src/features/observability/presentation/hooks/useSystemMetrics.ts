"use client"

import { useCallback, useEffect, useState } from "react"
import { httpObservabilityRepository } from "../../infrastructure/observability.repository"
import type { SystemMetrics } from "../../domain/types"

const DEFAULT_POLL_MS = 3000

export interface UseSystemMetricsResult {
  metrics: SystemMetrics | null
  loading: boolean
  refresh: () => Promise<void>
}

/** Polls the global observability metrics endpoint (silent on error). */
export function useSystemMetrics(
  pollMs: number = DEFAULT_POLL_MS,
): UseSystemMetricsResult {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const data = await httpObservabilityRepository.metrics()
      setMetrics(data)
    } catch {
      // silent retry on next tick
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(fetch, 0)
    if (pollMs <= 0) return () => clearTimeout(timeout)
    const interval = setInterval(fetch, pollMs)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetch, pollMs])

  return { metrics, loading, refresh: fetch }
}
