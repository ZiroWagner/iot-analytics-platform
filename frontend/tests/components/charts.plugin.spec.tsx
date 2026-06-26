import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { chartsPlugin } from '@/features/analytics/presentation/plugins/charts.plugin'

const baseConfig = {
  id: 'chart-1',
  title: 'Temperature Chart',
  series: [
    { id: 's1', sensorId: 'sens-1', sensorName: 'Sensor A', metric: 'temperature', chartType: 'line' as const, color: '#10b981', yAxisId: 'left' as const, unit: '°C' },
  ],
  size: 'md' as const,
  timeRange: '15m' as const,
  showGrid: true,
  showLegend: true,
  showReferenceLines: false,
  yAxisAutoRange: true,
  refreshInterval: 3000,
  type: 'charts',
  anomalyDetection: false,
  anomalyThreshold: 3.0,
  forecast: false,
}

describe('charts.plugin', () => {
  describe('ChartsRender', () => {
    it('shows loading spinner when loading with no data', () => {
      const { container } = render(
        <chartsPlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={true} />
      )
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows empty state when no data', () => {
      render(
        <chartsPlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={false} />
      )
      expect(screen.getByText(/Sin datos históricos/)).toBeInTheDocument()
    })
  })

  describe('ChartsConfigForm', () => {
    it('renders anomaly detection toggle', () => {
      render(
        <chartsPlugin.ConfigFormComponent
          config={baseConfig}
          onChange={vi.fn()}
          availableMetrics={[]}
        />
      )
      expect(screen.getByText('Detección de anomalías (Z-Score)')).toBeInTheDocument()
    })

    it('renders forecast toggle', () => {
      render(
        <chartsPlugin.ConfigFormComponent
          config={baseConfig}
          onChange={vi.fn()}
          availableMetrics={[]}
        />
      )
      expect(screen.getByText('Proyección de tendencia (Regresión)')).toBeInTheDocument()
    })

    it('shows threshold input when anomaly detection is enabled', () => {
      const config = { ...baseConfig, anomalyDetection: true }
      render(
        <chartsPlugin.ConfigFormComponent
          config={config}
          onChange={vi.fn()}
          availableMetrics={[]}
        />
      )
      expect(screen.getByLabelText('Umbral de anomalía (Z-Score)')).toBeInTheDocument()
    })

    it('enables forecast toggle when checked', () => {
      const config = { ...baseConfig, forecast: true }
      const onChange = vi.fn()
      render(
        <chartsPlugin.ConfigFormComponent
          config={config}
          onChange={onChange}
          availableMetrics={[]}
        />
      )
      const toggle = screen.getByLabelText('Proyección de tendencia (Regresión)')
      expect(toggle).toBeChecked()
      toggle.click()
      expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ forecast: false }))
    })
  })
})
