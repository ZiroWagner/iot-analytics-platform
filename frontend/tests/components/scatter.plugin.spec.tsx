import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { scatterPlugin } from '@/features/analytics/presentation/plugins/scatter.plugin'

const baseConfig = {
  id: 'scatter-1',
  title: 'Temp vs Humidity',
  series: [
    { id: 's1', sensorId: 'sens-1', sensorName: 'Sensor A', metric: 'temperature', chartType: 'line' as const, color: '#10b981', yAxisId: 'left' as const, unit: '°C' },
    { id: 's2', sensorId: 'sens-2', sensorName: 'Sensor B', metric: 'humidity', chartType: 'line' as const, color: '#6366f1', yAxisId: 'left' as const, unit: '%' },
  ],
  size: 'md' as const,
  timeRange: '15m' as const,
  showGrid: true,
  showLegend: false,
  showReferenceLines: false,
  yAxisAutoRange: true,
  refreshInterval: 3000,
  type: 'scatter',
}

describe('scatter.plugin', () => {
  describe('ScatterRender', () => {
    it('shows message when only one series is configured', () => {
      const config = { ...baseConfig, series: [baseConfig.series[0]] }
      render(
        <scatterPlugin.RenderComponent config={config} data={[]} isLive={false} loading={false} />
      )
      expect(screen.getByText(/Añade exactamente 2 series/)).toBeInTheDocument()
    })

    it('shows loading spinner when loading with no data', () => {
      const { container } = render(
        <scatterPlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={true} />
      )
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows awaiting data when scatter data is empty', () => {
      render(
        <scatterPlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={false} />
      )
      expect(screen.getByText('Esperando datos combinados...')).toBeInTheDocument()
    })
  })

  describe('ScatterConfigForm', () => {
    it('renders informational text about two series requirement', () => {
      render(
        <scatterPlugin.ConfigFormComponent
          config={baseConfig}
          onChange={vi.fn()}
          availableMetrics={[]}
        />
      )
      expect(screen.getByText(/El gráfico de dispersión requiere exactamente dos series/)).toBeInTheDocument()
    })
  })
})
