import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { httpAnalyticsRepository } from '@/features/analytics/infrastructure/analytics.repository'

vi.mock('@/shared/infrastructure/http', () => ({
  apiClient: vi.fn(),
  API_ENDPOINTS: {
    ANALYTICS: {
      METRICS: (id: string) => `/analytics/${id}/metrics`,
      MULTI_TIMESERIES: (id: string) => `/analytics/${id}/multi-timeseries`,
      STATS: (id: string) => `/analytics/${id}/stats`,
    },
    DASHBOARDS: {
      GET: (id: string) => `/dashboards/project/${id}`,
      SAVE: (id: string) => `/dashboards/project/${id}`,
    },
  },
}))

import { apiClient } from '@/shared/infrastructure/http'

describe('httpAnalyticsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches available metrics for a project', async () => {
    const mockMetrics = [{ name: 'temperature', unit: '°C' }]
    vi.mocked(apiClient).mockResolvedValueOnce(mockMetrics)

    const result = await httpAnalyticsRepository.availableMetrics('project-1')

    expect(apiClient).toHaveBeenCalledWith('/analytics/project-1/metrics')
    expect(result).toEqual(mockMetrics)
  })

  it('fetches dashboard config', async () => {
    const mockConfig = { layout_config: [] }
    vi.mocked(apiClient).mockResolvedValueOnce(mockConfig)

    const result = await httpAnalyticsRepository.getDashboardConfig('project-1')

    expect(apiClient).toHaveBeenCalledWith('/dashboards/project/project-1')
    expect(result).toEqual(mockConfig)
  })

  it('saves dashboard config', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce(undefined)

    const layoutConfig = [{ id: '1', type: 'line' }] as unknown as import('@/features/analytics/domain/types').ChartWidgetConfig[]
    await httpAnalyticsRepository.saveDashboardConfig('project-1', layoutConfig)

    expect(apiClient).toHaveBeenCalledWith(
      '/dashboards/project/project-1',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ layout_config: layoutConfig }),
      }),
    )
  })

  it('fetches multi timeseries data', async () => {
    const mockData = [{ timestamp: '2026-01-01T00:00:00Z', value: 22.5 }]
    vi.mocked(apiClient).mockResolvedValueOnce(mockData)

    const params = { from: '2026-01-01T00:00:00Z', to: '2026-01-02T00:00:00Z' }
    const result = await httpAnalyticsRepository.multiTimeseries('project-1', params)

    expect(apiClient).toHaveBeenCalledWith(
      '/analytics/project-1/multi-timeseries?from=2026-01-01T00%3A00%3A00Z&to=2026-01-02T00%3A00%3A00Z',
    )
    expect(result).toEqual(mockData)
  })

  it('fetches stats data', async () => {
    const mockStats = { avg: 22.5, min: 20, max: 25 }
    vi.mocked(apiClient).mockResolvedValueOnce(mockStats)

    const params = { from: '2026-01-01T00:00:00Z', to: '2026-01-02T00:00:00Z' }
    const result = await httpAnalyticsRepository.stats('project-1', params)

    expect(apiClient).toHaveBeenCalledWith(
      '/analytics/project-1/stats?from=2026-01-01T00%3A00%3A00Z&to=2026-01-02T00%3A00%3A00Z',
    )
    expect(result).toEqual(mockStats)
  })

  it('handles empty query params gracefully', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce([])

    const result = await httpAnalyticsRepository.multiTimeseries('project-1', {})

    expect(apiClient).toHaveBeenCalledWith('/analytics/project-1/multi-timeseries?')
    expect(result).toEqual([])
  })
})