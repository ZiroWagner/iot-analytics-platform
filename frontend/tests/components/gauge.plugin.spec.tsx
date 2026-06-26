import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { gaugePlugin } from '@/features/analytics/presentation/plugins/gauge.plugin'

const baseConfig = {
  id: 'gauge-1',
  title: 'Motor RPM',
  series: [{ id: 's1', sensorId: 'sens-1', sensorName: 'Sensor A', metric: 'rpm', chartType: 'line' as const, color: '#6366f1', yAxisId: 'left' as const, unit: 'RPM' }],
  size: 'sm' as const,
  timeRange: '15m' as const,
  showGrid: false,
  showLegend: false,
  showReferenceLines: false,
  yAxisAutoRange: false,
  refreshInterval: 1000,
  type: 'gauge',
  gaugeMin: 0,
  gaugeMax: 100,
  warningThreshold: 70,
  criticalThreshold: 90,
}

const makeData = (values: number[]) =>
  values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - 1 - i) * 60000).toISOString(),
    timeLabel: `${String(i).padStart(2, '0')}:00`,
    'Sensor A:rpm': v,
  }))

describe('gauge.plugin', () => {
  describe('GaugeRender', () => {
    it('shows loading spinner when loading with no data', () => {
      const { container } = render(
        <gaugePlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={true} />
      )
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows awaiting telemetry when no data', () => {
      render(
        <gaugePlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={false} />
      )
      expect(screen.getByText('Esperando telemetría...')).toBeInTheDocument()
    })

    it('displays latest value with unit', () => {
      const data = makeData([45])
      render(
        <gaugePlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('45.0')).toBeInTheDocument()
      expect(screen.getByText('RPM')).toBeInTheDocument()
    })

    it('shows optimal status for low values', () => {
      const data = makeData([30])
      render(
        <gaugePlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('óptimo')).toBeInTheDocument()
    })

    it('shows warning status for mid-range values', () => {
      const data = makeData([75])
      render(
        <gaugePlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('advertencia')).toBeInTheDocument()
    })

    it('shows critical status for high values', () => {
      const data = makeData([95])
      render(
        <gaugePlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('crítico')).toBeInTheDocument()
    })

    it('displays configured min and max values', () => {
      const data = makeData([50])
      render(
        <gaugePlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('MÍN: 0')).toBeInTheDocument()
      expect(screen.getByText('MÁX: 100')).toBeInTheDocument()
    })
  })

  describe('GaugeConfigForm', () => {
    it('renders min, max, warning and critical inputs', () => {
      render(
        <gaugePlugin.ConfigFormComponent
          config={baseConfig}
          onChange={vi.fn()}
          availableMetrics={[]}
        />
      )
      expect(screen.getByLabelText('Valor Mínimo')).toBeInTheDocument()
      expect(screen.getByLabelText('Valor Máximo')).toBeInTheDocument()
      expect(screen.getByLabelText('Límite Advertencia')).toBeInTheDocument()
      expect(screen.getByLabelText('Límite Crítico')).toBeInTheDocument()
    })
  })
})
