"use client"

import { useCallback, useEffect, useState } from "react"
import { isAuthenticated } from "@/shared/infrastructure/http"
import { httpProjectsRepository } from "../../infrastructure/projects.repository"
import type { OverviewStats } from "../../domain/types"

const DEFAULT_POLL_MS = 2000

export interface UseOverviewResult {
  stats: OverviewStats | null
  loading: boolean
  unauthorized: boolean
}

/**
 * Polls the global overview stats endpoint. Silent on error to avoid flooding
 * the UI when the backend is momentarily unavailable.
 */
export function useOverview(pollMs: number = DEFAULT_POLL_MS): UseOverviewResult {
  const [stats, setStats] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  const fetchOverview = useCallback(async () => {
    if (!isAuthenticated()) {
      setUnauthorized(true)
      return
    }
    try {
      const data = await httpProjectsRepository.overview()
      setStats(data)
    } catch {
      // Intentionally silent: next poll will retry.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
    if (pollMs <= 0) return
    const interval = setInterval(fetchOverview, pollMs)
    return () => clearInterval(interval)
  }, [fetchOverview, pollMs])

  return { stats, loading, unauthorized }
}
