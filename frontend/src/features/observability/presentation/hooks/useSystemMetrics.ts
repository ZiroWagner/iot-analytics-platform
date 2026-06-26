"use client"

import { useCallback, useEffect, useState } from "react"
import { httpObservabilityRepository } from "../../infrastructure/observability.repository"
import { useTelemetryStore } from "@/features/telemetry"
import type { SystemMetrics } from "../../domain/types"

const FALLBACK_POLL_MS = 10000

export interface UseSystemMetricsResult {
  metrics: SystemMetrics | null
  loading: boolean
  refresh: () => Promise<void>
}

/**
 * Reads system metrics from the WebSocket store (fastest path).
 * Falls back to HTTP polling as a safety net.
 */
export function useSystemMetrics(
  pollMs: number = FALLBACK_POLL_MS,
): UseSystemMetricsResult {
  const wsMetrics = useTelemetryStore((s) => s.systemMetrics)
  const [httpMetrics, setHttpMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialFetchDone, setInitialFetchDone] = useState(false)

  const fetch = useCallback(async () => {
    try {
      const data = await httpObservabilityRepository.metrics()
      setHttpMetrics(data)
    } catch {
      // silent retry on next tick
    } finally {
      setLoading(false)
      setInitialFetchDone(true)
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

  // Use WebSocket metrics when available, fall back to HTTP
  const metrics = wsMetrics ?? httpMetrics

  return { metrics, loading: loading && !initialFetchDone, refresh: fetch }
}
