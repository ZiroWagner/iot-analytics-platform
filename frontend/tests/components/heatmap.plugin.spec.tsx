import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { heatmapPlugin } from '@/features/analytics/presentation/plugins/heatmap.plugin'

const baseConfig = {
  id: 'heatmap-1',
  title: 'Activity Heatmap',
  series: [{ id: 's1', sensorId: 'sens-1', sensorName: 'Sensor A', metric: 'temperature', chartType: 'line' as const, color: '#8b5cf6', yAxisId: 'left' as const, unit: '°C' }],
  size: 'lg' as const,
  timeRange: '24h' as const,
  showGrid: false,
  showLegend: false,
  showReferenceLines: false,
  yAxisAutoRange: false,
  refreshInterval: 10000,
  type: 'heatmap',
  heatmapColor: 'purple',
}

const makeData = () => {
  const points = []
  const now = Date.now()
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      points.push({
        timestamp: new Date(now - (6 - day) * 86400000 - (23 - hour) * 3600000).toISOString(),
        timeLabel: `${day}-${hour}`,
        'Sensor A:temperature': 20 + Math.sin(day * 0.5 + hour * 0.3) * 10,
      })
    }
  }
  return points
}

describe('heatmap.plugin', () => {
  describe('HeatmapRender', () => {
    it('shows loading spinner when loading with no data', () => {
      const { container } = render(
        <heatmapPlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={true} />
      )
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows empty state when no data', () => {
      render(
        <heatmapPlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={false} />
      )
      expect(screen.getByText('Sin históricos disponibles.')).toBeInTheDocument()
    })

    it('renders day-of-week labels', () => {
      const data = makeData()
      render(
        <heatmapPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('Dom')).toBeInTheDocument()
      expect(screen.getByText('Lun')).toBeInTheDocument()
      expect(screen.getByText('Mar')).toBeInTheDocument()
      expect(screen.getByText('Mié')).toBeInTheDocument()
      expect(screen.getByText('Jue')).toBeInTheDocument()
      expect(screen.getByText('Vie')).toBeInTheDocument()
      expect(screen.getByText('Sáb')).toBeInTheDocument()
    })

    it('renders min and max value labels', () => {
      const data = makeData()
      render(
        <heatmapPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText(/Bajo/)).toBeInTheDocument()
      expect(screen.getByText(/Alto/)).toBeInTheDocument()
    })
  })

  describe('HeatmapConfigForm', () => {
    it('renders color scheme selector', () => {
      render(
        <heatmapPlugin.ConfigFormComponent
          config={baseConfig}
          onChange={vi.fn()}
          availableMetrics={[]}
        />
      )
      expect(screen.getByText('Esquema de Color')).toBeInTheDocument()
    })
  })
})
