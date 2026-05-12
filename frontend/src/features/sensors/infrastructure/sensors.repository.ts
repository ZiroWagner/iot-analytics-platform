import { apiClient, API_ENDPOINTS } from '@/shared/infrastructure/http'
import type { DataPoint, Sensor } from '../domain/types'

export interface CreateSensorPayload {
  name: string
  deviceId: string
  metadata: Record<string, unknown>
}

export interface SensorsRepository {
  create(payload: CreateSensorPayload): Promise<Sensor>
  getData(sensorId: string): Promise<DataPoint[]>
}

export const httpSensorsRepository: SensorsRepository = {
  create: (payload) =>
    apiClient<Sensor>(API_ENDPOINTS.SENSORS.CREATE, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getData: (sensorId) =>
    apiClient<DataPoint[]>(API_ENDPOINTS.SENSORS.DATA(sensorId)),
}
