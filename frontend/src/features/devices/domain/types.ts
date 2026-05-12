import type { Sensor } from '@/features/sensors/domain/types'

export interface Device {
  id: string
  name: string
  type: string
  mac_address?: string
  api_key?: string
  sensors: Sensor[]
  createdAt: string
  lastSeenAt?: string
}
