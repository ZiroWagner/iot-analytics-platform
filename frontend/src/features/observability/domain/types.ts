export interface SystemMetrics {
  streamSize: number
  consumerLag: number
  eventsPerSecond: number
  onlineDevices: number
  timestamp: string
  pendingMessages: number
  redisMemoryUsedBytes: number
  dbInsertLatencyMs: number
}

export type LagSeverity = 'ok' | 'warning' | 'critical'
