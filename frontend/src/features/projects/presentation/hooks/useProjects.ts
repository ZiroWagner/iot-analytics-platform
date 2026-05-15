"use client"

import { useCallback, useEffect, useState } from "react"
import { isAuthenticated } from "@/shared/infrastructure/http"
import { httpProjectsRepository } from "../../infrastructure/projects.repository"
import type { Project } from "../../domain/types"

const DEFAULT_POLL_MS = 2000

export interface UseProjectsResult {
  projects: Project[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  /** Returns true when auth is missing, caller should redirect to /login. */
  unauthorized: boolean
}

/**
 * Fetches the user's projects and keeps them fresh with a lightweight polling
 * loop. Transport and caching concerns live here; pages consume the result.
 */
export function useProjects(pollMs: number = DEFAULT_POLL_MS): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  const fetchProjects = useCallback(async (silent = false) => {
    if (!isAuthenticated()) {
      setUnauthorized(true)
      return
    }
    if (!silent) setLoading(true)
    try {
      const data = await httpProjectsRepository.list()
      setProjects(data)
      setError(null)
    } catch (err) {
      if (!silent) {
        setError(err instanceof Error ? err.message : "Error al cargar los proyectos")
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => fetchProjects(), 0)
    if (pollMs <= 0) return () => clearTimeout(timeout)
    const interval = setInterval(() => fetchProjects(true), pollMs)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [fetchProjects, pollMs])

  return {
    projects,
    loading,
    error,
    refetch: () => fetchProjects(),
    unauthorized,
  }
}
