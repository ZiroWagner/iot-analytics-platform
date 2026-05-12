import { apiClient, API_ENDPOINTS } from '@/shared/infrastructure/http'
import type { SystemMetrics } from '../domain/types'

export interface ObservabilityRepository {
  metrics(): Promise<SystemMetrics>
}

export const httpObservabilityRepository: ObservabilityRepository = {
  metrics: () => apiClient<SystemMetrics>(API_ENDPOINTS.OBSERVABILITY.METRICS),
}
