export interface SystemMetrics {
  streamSize: number
  consumerLag: number
  eventsPerSecond: number
  onlineDevices: number
  timestamp: string
}

export type LagSeverity = 'ok' | 'warning' | 'critical'
