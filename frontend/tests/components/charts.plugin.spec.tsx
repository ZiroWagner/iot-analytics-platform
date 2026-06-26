import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

    it('renders chart with data', () => {
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('renders anomaly scatter points when anomaly detection is enabled', () => {
      const config = { ...baseConfig, anomalyDetection: true, anomalyThreshold: 1.5 }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
        { 'Sensor A:temperature': 80, timeLabel: '10:02' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent config={config} data={data} isLive={false} loading={false} />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('renders chart with trend directions when forecast is enabled', () => {
      const config = { ...baseConfig, forecast: true }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent
          config={config}
          data={data}
          isLive={false}
          loading={false}
          trendDirections={{ 'Sensor A:temperature': 'up' }}
        />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('renders area chart type', () => {
      const config = {
        ...baseConfig,
        series: [{ ...baseConfig.series[0], chartType: 'area' as const }],
      }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent config={config} data={data} isLive={false} loading={false} />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('renders bar chart type', () => {
      const config = {
        ...baseConfig,
        series: [{ ...baseConfig.series[0], chartType: 'bar' as const }],
      }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent config={config} data={data} isLive={false} loading={false} />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
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

    it('shows threshold value when anomaly detection is enabled', () => {
      const config = { ...baseConfig, anomalyDetection: true, anomalyThreshold: 2.5 }
      render(
        <chartsPlugin.ConfigFormComponent
          config={config}
          onChange={vi.fn()}
          availableMetrics={[]}
        />
      )
      const input = screen.getByLabelText('Umbral de anomalía (Z-Score)') as HTMLInputElement
      expect(input.value).toBe('2.5')
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

  describe('ChartsRender — edge cases', () => {
    it('renders without grid', () => {
      const config = { ...baseConfig, showGrid: false }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent config={config} data={data} isLive={false} loading={false} />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('renders without legend', () => {
      const config = { ...baseConfig, showLegend: false }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent config={config} data={data} isLive={false} loading={false} />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('renders with multiple Y axes', () => {
      const config = {
        ...baseConfig,
        series: [
          { id: 's1', sensorId: 'sens-1', sensorName: 'Sensor A', metric: 'temperature', chartType: 'line' as const, color: '#10b981', yAxisId: 'left' as const, unit: '°C' },
          { id: 's2', sensorId: 'sens-2', sensorName: 'Sensor B', metric: 'humidity', chartType: 'line' as const, color: '#6366f1', yAxisId: 'right' as const, unit: '%' },
        ],
      }
      const data = [
        { 'Sensor A:temperature': 22, 'Sensor B:humidity': 60, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, 'Sensor B:humidity': 55, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent config={config} data={data} isLive={false} loading={false} />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('handles NaN values in anomaly detection gracefully', () => {
      const config = { ...baseConfig, anomalyDetection: true, anomalyThreshold: 2.0 }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': NaN, timeLabel: '10:01' },
        { 'Sensor A:temperature': 25, timeLabel: '10:02' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent config={config} data={data} isLive={false} loading={false} />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })
  })

  describe('CustomLegend', () => {
    it('renders chart with up trend direction', () => {
      const config = { ...baseConfig, forecast: true }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent
          config={config}
          data={data}
          isLive={false}
          loading={false}
          trendDirections={{ 'Sensor A:temperature': 'up' }}
        />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('renders chart with down trend direction', () => {
      const config = { ...baseConfig, forecast: true }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent
          config={config}
          data={data}
          isLive={false}
          loading={false}
          trendDirections={{ 'Sensor A:temperature': 'down' }}
        />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('renders chart with flat trend direction', () => {
      const config = { ...baseConfig, forecast: true }
      const data = [
        { 'Sensor A:temperature': 22, timeLabel: '10:00' },
        { 'Sensor A:temperature': 25, timeLabel: '10:01' },
      ]
      const { container } = render(
        <chartsPlugin.RenderComponent
          config={config}
          data={data}
          isLive={false}
          loading={false}
          trendDirections={{ 'Sensor A:temperature': 'flat' }}
        />
      )
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })
  })
})
