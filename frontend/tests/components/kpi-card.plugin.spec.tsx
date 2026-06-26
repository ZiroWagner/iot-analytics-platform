import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { kpiCardPlugin } from '@/features/analytics/presentation/plugins/kpi-card.plugin'

const baseConfig = {
  id: 'kpi-1',
  title: 'Temperature KPI',
  series: [{ id: 's1', sensorId: 'sens-1', sensorName: 'Sensor A', metric: 'temperature', chartType: 'line' as const, color: '#10b981', yAxisId: 'left' as const, unit: '°C' }],
  size: 'sm' as const,
  timeRange: '15m' as const,
  showGrid: false,
  showLegend: false,
  showReferenceLines: false,
  yAxisAutoRange: false,
  refreshInterval: 3000,
  type: 'kpi',
  warningThreshold: 70,
  criticalThreshold: 90,
}

const makeData = (values: number[]) =>
  values.map((v, i) => ({
    timestamp: new Date(Date.now() - (values.length - 1 - i) * 60000).toISOString(),
    timeLabel: `${String(i).padStart(2, '0')}:00`,
    'Sensor A:temperature': v,
  }))

describe('kpi-card.plugin', () => {
  describe('KPIRender', () => {
    it('shows loading spinner when loading with no data', () => {
      const { container } = render(
        <kpiCardPlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={true} />
      )
      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('shows empty state when no telemetry', () => {
      render(
        <kpiCardPlugin.RenderComponent config={baseConfig} data={[]} isLive={false} loading={false} />
      )
      expect(screen.getByText('Sin telemetría.')).toBeInTheDocument()
    })

    it('displays latest value with unit', () => {
      const data = makeData([20, 22, 25])
      render(
        <kpiCardPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('25.0')).toBeInTheDocument()
      expect(screen.getByText('°C')).toBeInTheDocument()
    })

    it('shows optimal status when value is below warning threshold', () => {
      const data = makeData([30, 35, 40])
      render(
        <kpiCardPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.queryByText('Crítico')).not.toBeInTheDocument()
      expect(screen.queryByText('Alerta')).not.toBeInTheDocument()
    })

    it('shows warning alert when value exceeds warning threshold', () => {
      const data = makeData([60, 65, 75])
      render(
        <kpiCardPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('Alerta')).toBeInTheDocument()
    })

    it('shows critical alert when value exceeds critical threshold', () => {
      const data = makeData([80, 85, 95])
      render(
        <kpiCardPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('Crítico')).toBeInTheDocument()
    })

    it('shows trend indicator with positive percentage', () => {
      const data = makeData([10, 20, 30])
      render(
        <kpiCardPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('+200.0%')).toBeInTheDocument()
    })

    it('shows trend indicator with negative percentage', () => {
      const data = makeData([30, 20, 10])
      render(
        <kpiCardPlugin.RenderComponent config={baseConfig} data={data} isLive={false} loading={false} />
      )
      expect(screen.getByText('-66.7%')).toBeInTheDocument()
    })
  })

  describe('KPIConfigForm', () => {
    it('renders warning and critical threshold inputs', () => {
      render(
        <kpiCardPlugin.ConfigFormComponent
          config={baseConfig}
          onChange={vi.fn()}
          availableMetrics={[]}
        />
      )
      expect(screen.getByLabelText('Límite Advertencia')).toBeInTheDocument()
      expect(screen.getByLabelText('Límite Crítico')).toBeInTheDocument()
    })
  })
})
