import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChartConfigDialog } from '@/features/analytics/presentation/components/ChartConfigDialog'
import { widgetRegistry } from '@/features/analytics/domain/widget-registry'

const mockMetrics = [
  {
    sensorId: 'sens-1',
    sensorName: 'Sensor A',
    gatewayId: 'gw-1',
    gatewayName: 'Gateway Alpha',
    availableMetrics: ['temperature', 'humidity'],
  },
  {
    sensorId: 'sens-2',
    sensorName: 'Sensor B',
    gatewayId: 'gw-1',
    gatewayName: 'Gateway Alpha',
    availableMetrics: ['pressure', 'flow'],
  },
]

async function addSeries(user: ReturnType<typeof userEvent.setup>) {
  const triggers = screen.getAllByRole('combobox')
  await user.click(triggers[0])
  const gatewayOption = await screen.findByRole('option', { name: 'Gateway Alpha' })
  await user.click(gatewayOption)
  await waitFor(() => expect(screen.getAllByRole('combobox').length).toBe(2))
  const sensorTrigger = screen.getAllByRole('combobox')[1]
  await user.click(sensorTrigger)
  const sensorOption = await screen.findByRole('option', { name: 'Sensor A' })
  await user.click(sensorOption)
  await waitFor(() => expect(screen.getAllByRole('combobox').length).toBe(3))
  const metricTrigger = screen.getAllByRole('combobox')[2]
  await user.click(metricTrigger)
  const metricOption = await screen.findByRole('option', { name: 'temperature' })
  await user.click(metricOption)
  await user.click(screen.getByText('Añadir Serie'))
}

describe('ChartConfigDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders create title when no existing config', () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Crear Widget Analítico')).toBeInTheDocument()
  })

  it('renders edit title when existing config is provided', () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        existingConfig={{ id: 'w-1', title: 'Test', series: [], size: 'md', timeRange: '15m', showGrid: true, showLegend: true, showReferenceLines: false, yAxisAutoRange: true, refreshInterval: 3000 } as any}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Editar Widget')).toBeInTheDocument()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <ChartConfigDialog
        open={false}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('renders wizard step indicators', () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByText('Series')).toBeInTheDocument()
    expect(screen.getByText('Visualización')).toBeInTheDocument()
    expect(screen.getByText('Avanzado')).toBeInTheDocument()
  })

  it('shows series step by default with title input', () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    expect(screen.getByPlaceholderText(/Ej: Temperatura vs Humedad/)).toBeInTheDocument()
    expect(screen.getByText(/Seleccionar métrica/)).toBeInTheDocument()
  })

  it('disables next button when no series added', () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    const nextButton = screen.getByText('Siguiente').closest('button')
    expect(nextButton).toBeDisabled()
  })

  it('navigates to visual step after adding series', async () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    const user = userEvent.setup()
    await addSeries(user)

    const nextButton = screen.getByText('Siguiente')
    expect(nextButton).not.toBeDisabled()
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Tipo de Visualización')).toBeInTheDocument()
    })
  })

  it('lists all widget types from registry in the visual step', async () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    const user = userEvent.setup()
    await addSeries(user)
    await user.click(screen.getByText('Siguiente'))

    const visualTriggers = screen.getAllByRole('combobox')
    await user.click(visualTriggers[0])

    const plugins = widgetRegistry.getAll()
    for (const plugin of plugins) {
      const option = await screen.findByRole('option', { name: plugin.name })
      expect(option).toBeInTheDocument()
    }
  })

  it('renders chart-specific config form in visual step', async () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    const user = userEvent.setup()
    await addSeries(user)
    await user.click(screen.getByText('Siguiente'))

    await waitFor(() => {
      expect(screen.getByText('Detección de anomalías (Z-Score)')).toBeInTheDocument()
    })
  })

  it('shows advanced step with size selector', async () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    const user = userEvent.setup()
    await addSeries(user)
    await user.click(screen.getByText('Siguiente'))
    await user.click(screen.getByText('Siguiente'))

    await waitFor(() => {
      expect(screen.getByText('Tamaño del widget')).toBeInTheDocument()
    })
  })

  it('calls onSave when creating widget', async () => {
    const onSave = vi.fn()
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={onSave}
      />
    )
    const user = userEvent.setup()
    await addSeries(user)
    await user.click(screen.getByText('Siguiente'))
    await user.click(screen.getByText('Siguiente'))

    await waitFor(() => {
      expect(screen.getByText('Crear Widget')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Crear Widget'))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })
    const saved = onSave.mock.calls[0][0]
    expect(saved.series).toHaveLength(1)
    expect(saved.series[0].sensorId).toBe('sens-1')
  })

  it('allows going back to previous step', async () => {
    render(
      <ChartConfigDialog
        open={true}
        onOpenChange={vi.fn()}
        metrics={mockMetrics}
        onSave={vi.fn()}
      />
    )
    const user = userEvent.setup()
    await addSeries(user)
    await user.click(screen.getByText('Siguiente'))
    await waitFor(() => expect(screen.getByText('Tipo de Visualización')).toBeInTheDocument())
    await user.click(screen.getByText('Atrás'))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ej: Temperatura vs Humedad/)).toBeInTheDocument()
    })
  })
})
