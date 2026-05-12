import { apiClient, API_ENDPOINTS } from '@/shared/infrastructure/http'
import type {
  AvailableMetric,
  ChartWidgetConfig,
  MetricStats,
  TimeseriesPoint,
} from '../domain/types'

export interface TimeQueryParams {
  from?: string
  to?: string
}

export interface DashboardConfigPayload {
  layout_config?: unknown[]
}

export interface AnalyticsRepository {
  availableMetrics(projectId: string): Promise<AvailableMetric[]>
  getDashboardConfig(projectId: string): Promise<DashboardConfigPayload>
  saveDashboardConfig(
    projectId: string,
    layoutConfig: ChartWidgetConfig[],
  ): Promise<void>
  multiTimeseries(
    projectId: string,
    params: Record<string, string>,
  ): Promise<TimeseriesPoint[]>
  stats(
    projectId: string,
    params: Record<string, string>,
  ): Promise<MetricStats>
}

function toQueryString(params: Record<string, string>): string {
  return new URLSearchParams(params).toString()
}

export const httpAnalyticsRepository: AnalyticsRepository = {
  availableMetrics: (projectId) =>
    apiClient<AvailableMetric[]>(API_ENDPOINTS.ANALYTICS.METRICS(projectId)),

  getDashboardConfig: (projectId) =>
    apiClient<DashboardConfigPayload>(API_ENDPOINTS.DASHBOARDS.GET(projectId)),

  saveDashboardConfig: (projectId, layoutConfig) =>
    apiClient<void>(API_ENDPOINTS.DASHBOARDS.SAVE(projectId), {
      method: 'POST',
      body: JSON.stringify({ layout_config: layoutConfig }),
    }),

  multiTimeseries: (projectId, params) =>
    apiClient<TimeseriesPoint[]>(
      `${API_ENDPOINTS.ANALYTICS.MULTI_TIMESERIES(projectId)}?${toQueryString(params)}`,
    ),

  stats: (projectId, params) =>
    apiClient<MetricStats>(
      `${API_ENDPOINTS.ANALYTICS.STATS(projectId)}?${toQueryString(params)}`,
    ),
}
