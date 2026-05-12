export interface ProjectDeviceSummary {
  id: string
  lastSeenAt?: string
}

export interface Project {
  id: string
  name: string
  createdAt: string
  _count?: { devices: number }
  devices?: ProjectDeviceSummary[]
}

export interface RecentEvent {
  id: string
  timestamp: string
  payload: Record<string, unknown>
  sensor?: {
    name: string
    device?: { name: string }
  }
}

export interface OverviewStats {
  totalProjects: number
  totalDevices: number
  totalSensors: number
  eventsLast24h: number
  recentEvents: RecentEvent[]
}
