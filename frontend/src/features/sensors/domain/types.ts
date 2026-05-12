export interface Sensor {
  id: string
  name: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface DataPoint {
  id: string
  timestamp: string
  payload: Record<string, unknown>
}
