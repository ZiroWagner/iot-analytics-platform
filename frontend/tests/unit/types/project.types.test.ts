import { describe, expect, it } from 'vitest'
import type { Project, OverviewStats, RecentEvent } from '@/features/projects/domain/types'

describe('projects domain types', () => {
  it('Project can be created with required fields', () => {
    const project: Project = {
      id: 'project-1',
      name: 'My Project',
      createdAt: '2026-01-01T00:00:00Z',
    }
    expect(project.id).toBe('project-1')
  })

  it('Project can have devices count', () => {
    const project: Project = {
      id: 'project-1',
      name: 'My Project',
      createdAt: '2026-01-01T00:00:00Z',
      _count: { devices: 5 },
    }
    expect(project._count?.devices).toBe(5)
  })

  it('Project can contain device summaries', () => {
    const project: Project = {
      id: 'project-1',
      name: 'My Project',
      createdAt: '2026-01-01T00:00:00Z',
      devices: [
        { id: 'device-1', lastSeenAt: '2026-01-15T10:00:00Z' },
        { id: 'device-2' },
      ],
    }
    expect(project.devices?.length).toBe(2)
  })

  it('OverviewStats has all required stats fields', () => {
    const stats: OverviewStats = {
      totalProjects: 10,
      totalDevices: 50,
      totalSensors: 200,
      eventsLast24h: 1000,
      recentEvents: [],
    }
    expect(stats.totalProjects).toBe(10)
    expect(stats.totalDevices).toBe(50)
  })

  it('RecentEvent has sensor and device info', () => {
    const event: RecentEvent = {
      id: 'event-1',
      timestamp: '2026-01-15T10:00:00Z',
      payload: { temperature: 22 },
      sensor: {
        name: 'Temperature Sensor',
        device: { name: 'Gateway 1' },
      },
    }
    expect(event.sensor?.device?.name).toBe('Gateway 1')
  })
})