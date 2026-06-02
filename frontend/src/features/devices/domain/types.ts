import type { Sensor } from '@/features/sensors/domain/types'

export interface Device {
  id: string
  name: string
  type: string
  macAddress?: string
  apiKey?: string
  sensors: Sensor[]
  createdAt: string
  lastSeenAt?: string
}
